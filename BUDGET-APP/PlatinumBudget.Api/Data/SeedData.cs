using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(BudgetDbContext db)
    {
        if (db.FinancialYears.Any())
        {
            await SeedVirementPolicyAsync(db);
            await SeedBillingBudgetAsync(db);
            await SeedCreditorsBudgetAsync(db);
            await SeedHrPayrollBudgetAsync(db);
            return;
        }

        var fy2526 = new FinancialYear
        {
            YearCode = "2025/2026",
            Description = "Financial Year 2025/2026",
            StartDate = new DateTime(2025, 7, 1),
            EndDate = new DateTime(2026, 6, 30),
            IsActive = true,
            CreatedBy = "System"
        };
        var fy2627 = new FinancialYear
        {
            YearCode = "2026/2027",
            Description = "Financial Year 2026/2027",
            StartDate = new DateTime(2026, 7, 1),
            EndDate = new DateTime(2027, 6, 30),
            IsActive = false,
            CreatedBy = "System"
        };
        db.FinancialYears.AddRange(fy2526, fy2627);

        var departments = new[]
        {
            new Department { Code = "FIN", Name = "Finance" },
            new Department { Code = "INFRA", Name = "Infrastructure & Engineering" },
            new Department { Code = "CS", Name = "Community Services" },
            new Department { Code = "CORP", Name = "Corporate Services" },
            new Department { Code = "ED", Name = "Economic Development" },
            new Department { Code = "ELEC", Name = "Electrical Services" },
            new Department { Code = "PLAN", Name = "Planning & Development" },
            new Department { Code = "MM", Name = "Municipal Manager" }
        };
        db.Departments.AddRange(departments);

        var scoaItems = new[]
        {
            new ScoaItem { Code = "1100", Description = "Property Rates", Level = 1 },
            new ScoaItem { Code = "1200", Description = "Service Charges - Electricity", Level = 1 },
            new ScoaItem { Code = "1300", Description = "Service Charges - Water", Level = 1 },
            new ScoaItem { Code = "1400", Description = "Service Charges - Sanitation", Level = 1 },
            new ScoaItem { Code = "1500", Description = "Service Charges - Refuse", Level = 1 },
            new ScoaItem { Code = "1600", Description = "Rental of Facilities & Equipment", Level = 1 },
            new ScoaItem { Code = "1700", Description = "Interest Earned - External Investments", Level = 1 },
            new ScoaItem { Code = "1800", Description = "Interest Earned - Outstanding Debtors", Level = 1 },
            new ScoaItem { Code = "1900", Description = "Fines, Penalties & Forfeits", Level = 1 },
            new ScoaItem { Code = "2000", Description = "Transfers & Subsidies - Operational", Level = 1 },
            new ScoaItem { Code = "3000", Description = "Employee Related Costs", Level = 1 },
            new ScoaItem { Code = "3100", Description = "Remuneration of Councillors", Level = 1 },
            new ScoaItem { Code = "4000", Description = "Bulk Purchases - Electricity", Level = 1 },
            new ScoaItem { Code = "4100", Description = "Bulk Purchases - Water", Level = 1 },
            new ScoaItem { Code = "5000", Description = "General Expenditure", Level = 1 },
            new ScoaItem { Code = "5100", Description = "Repairs & Maintenance", Level = 1 },
            new ScoaItem { Code = "6000", Description = "Depreciation & Amortisation", Level = 1 },
            new ScoaItem { Code = "7000", Description = "Capital Expenditure", Level = 1 },
            new ScoaItem { Code = "8000", Description = "Transfers & Subsidies - Capital", Level = 1 },
            new ScoaItem { Code = "9000", Description = "Debt Impairment", Level = 1 }
        };
        db.ScoaItems.AddRange(scoaItems);

        var scoaFunds = new[]
        {
            new ScoaFund { Code = "CF", Description = "Consolidated Fund", Level = 1 },
            new ScoaFund { Code = "CRR", Description = "Capital Replacement Reserve", Level = 1 },
            new ScoaFund { Code = "GF01", Description = "Government Grant - MIG", Level = 1 },
            new ScoaFund { Code = "GF02", Description = "Government Grant - EPWP", Level = 1 },
            new ScoaFund { Code = "GF03", Description = "Government Grant - Equitable Share", Level = 1 },
            new ScoaFund { Code = "GF04", Description = "Government Grant - FMG", Level = 1 },
            new ScoaFund { Code = "EF01", Description = "External Loan - DBSA", Level = 1 },
            new ScoaFund { Code = "EF02", Description = "External Loan - Commercial Bank", Level = 1 },
            new ScoaFund { Code = "IF01", Description = "Internal Fund - Insurance Reserve", Level = 1 },
            new ScoaFund { Code = "IF02", Description = "Internal Fund - Leave Reserve", Level = 1 }
        };
        db.ScoaFunds.AddRange(scoaFunds);

        var scoaFunctions = new[]
        {
            new ScoaFunction { Code = "GOV", Description = "Governance & Administration", Level = 1 },
            new ScoaFunction { Code = "FIN", Description = "Finance & Administration", Level = 1 },
            new ScoaFunction { Code = "PLAN", Description = "Planning & Development", Level = 1 },
            new ScoaFunction { Code = "HEALTH", Description = "Health", Level = 1 },
            new ScoaFunction { Code = "SAFETY", Description = "Public Safety", Level = 1 },
            new ScoaFunction { Code = "SPORT", Description = "Sport & Recreation", Level = 1 },
            new ScoaFunction { Code = "ENVIRO", Description = "Environmental Protection", Level = 1 },
            new ScoaFunction { Code = "WASTE", Description = "Waste Management", Level = 1 },
            new ScoaFunction { Code = "WATER", Description = "Water", Level = 1 },
            new ScoaFunction { Code = "ELEC", Description = "Electricity", Level = 1 },
            new ScoaFunction { Code = "ROADS", Description = "Road Transport", Level = 1 },
            new ScoaFunction { Code = "HOUSE", Description = "Housing", Level = 1 }
        };
        db.ScoaFunctions.AddRange(scoaFunctions);

        var scoaProjects = new[]
        {
            new ScoaProject { Code = "OPEX", Description = "Operational (Non-Project)", Level = 1 },
            new ScoaProject { Code = "CAP001", Description = "Water Reticulation Phase 1", Level = 1 },
            new ScoaProject { Code = "CAP002", Description = "Roads Rehabilitation Programme", Level = 1 },
            new ScoaProject { Code = "CAP003", Description = "New Community Hall", Level = 1 },
            new ScoaProject { Code = "CAP004", Description = "Electrical Network Upgrade", Level = 1 },
            new ScoaProject { Code = "CAP005", Description = "Sewer Upgrade Phase 2", Level = 1 }
        };
        db.ScoaProjects.AddRange(scoaProjects);

        var scoaRegions = new[]
        {
            new ScoaRegion { Code = "MUN", Description = "Municipality-Wide", Level = 1 },
            new ScoaRegion { Code = "W01", Description = "Ward 1", Level = 1 },
            new ScoaRegion { Code = "W02", Description = "Ward 2", Level = 1 },
            new ScoaRegion { Code = "W03", Description = "Ward 3", Level = 1 },
            new ScoaRegion { Code = "W04", Description = "Ward 4", Level = 1 },
            new ScoaRegion { Code = "W05", Description = "Ward 5", Level = 1 }
        };
        db.ScoaRegions.AddRange(scoaRegions);

        var scoaCostings = new[]
        {
            new ScoaCosting { Code = "STD", Description = "Standard", Level = 1 },
            new ScoaCosting { Code = "PROJ", Description = "Project Cost Centre", Level = 1 },
            new ScoaCosting { Code = "DEPT", Description = "Departmental", Level = 1 },
            new ScoaCosting { Code = "SERV", Description = "Service Delivery", Level = 1 }
        };
        db.ScoaCostings.AddRange(scoaCostings);

        var scoaMscs = new[]
        {
            new ScoaMsc { Code = "GEN", Description = "General", Level = 1 },
            new ScoaMsc { Code = "RES", Description = "Residential", Level = 1 },
            new ScoaMsc { Code = "COM", Description = "Commercial", Level = 1 },
            new ScoaMsc { Code = "IND", Description = "Industrial", Level = 1 },
            new ScoaMsc { Code = "AGR", Description = "Agricultural", Level = 1 }
        };
        db.ScoaMscs.AddRange(scoaMscs);

        await db.SaveChangesAsync();

        var finYear = db.FinancialYears.First(f => f.YearCode == "2025/2026");
        var fin = db.Departments.First(d => d.Code == "FIN");
        var infra = db.Departments.First(d => d.Code == "INFRA");
        var elec = db.Departments.First(d => d.Code == "ELEC");

        var projects = new[]
        {
            new Project { ProjectCode = "PRJ-001", ProjectName = "Water Reticulation Phase 1", Type = ProjectType.Capital, Status = ProjectStatus.Active, DepartmentId = infra.Id, IdpLink = "IDP-WS-001", CreatedBy = "System" },
            new Project { ProjectCode = "PRJ-002", ProjectName = "Roads Rehabilitation Programme", Type = ProjectType.Capital, Status = ProjectStatus.Active, DepartmentId = infra.Id, IdpLink = "IDP-RT-002", CreatedBy = "System" },
            new Project { ProjectCode = "PRJ-003", ProjectName = "New Community Hall", Type = ProjectType.Capital, Status = ProjectStatus.Draft, DepartmentId = infra.Id, IdpLink = "IDP-CS-003", CreatedBy = "System" },
            new Project { ProjectCode = "PRJ-004", ProjectName = "Electrical Network Upgrade", Type = ProjectType.Capital, Status = ProjectStatus.Active, DepartmentId = elec.Id, IdpLink = "IDP-EL-004", CreatedBy = "System" },
            new Project { ProjectCode = "PRJ-005", ProjectName = "Financial System Upgrade", Type = ProjectType.Operational, Status = ProjectStatus.Active, DepartmentId = fin.Id, IdpLink = "IDP-FN-005", CreatedBy = "System" }
        };
        db.Projects.AddRange(projects);

        var tabbVersion = new BudgetVersion
        {
            FinancialYearId = finYear.Id,
            VersionType = BudgetVersionType.TABB,
            VersionName = "Tabled Budget 2025/2026",
            Description = "Initial tabled budget for council consideration",
            Status = BudgetVersionStatus.Draft,
            CreatedBy = "System"
        };
        db.BudgetVersions.Add(tabbVersion);

        await db.SaveChangesAsync();

        var item3000 = db.ScoaItems.First(i => i.Code == "3000");
        var item5000 = db.ScoaItems.First(i => i.Code == "5000");
        var item7000 = db.ScoaItems.First(i => i.Code == "7000");
        var item1100 = db.ScoaItems.First(i => i.Code == "1100");
        var item1200 = db.ScoaItems.First(i => i.Code == "1200");
        var item4000 = db.ScoaItems.First(i => i.Code == "4000");
        var fundCF = db.ScoaFunds.First(f => f.Code == "CF");
        var fundMIG = db.ScoaFunds.First(f => f.Code == "GF01");
        var funcGov = db.ScoaFunctions.First(f => f.Code == "GOV");
        var funcElec = db.ScoaFunctions.First(f => f.Code == "ELEC");
        var funcWater = db.ScoaFunctions.First(f => f.Code == "WATER");
        var funcRoads = db.ScoaFunctions.First(f => f.Code == "ROADS");
        var projOpex = db.ScoaProjects.First(p => p.Code == "OPEX");
        var projCap001 = db.ScoaProjects.First(p => p.Code == "CAP001");
        var projCap002 = db.ScoaProjects.First(p => p.Code == "CAP002");
        var projCap004 = db.ScoaProjects.First(p => p.Code == "CAP004");
        var regionMun = db.ScoaRegions.First(r => r.Code == "MUN");
        var costStd = db.ScoaCostings.First(c => c.Code == "STD");
        var costProj = db.ScoaCostings.First(c => c.Code == "PROJ");
        var mscGen = db.ScoaMscs.First(m => m.Code == "GEN");
        var mscRes = db.ScoaMscs.First(m => m.Code == "RES");

        var prj1 = db.Projects.First(p => p.ProjectCode == "PRJ-001");
        var prj2 = db.Projects.First(p => p.ProjectCode == "PRJ-002");
        var prj4 = db.Projects.First(p => p.ProjectCode == "PRJ-004");

        var budgetStrings = new[]
        {
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = null, SourceModule = SourceModule.Direct, ScoaItemId = item3000.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcGov.Id, ScoaProjectId = projOpex.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costStd.Id, ScoaMscId = mscGen.Id, Year1Amount = 45000000, Year2Amount = 47250000, Year3Amount = 49612500, Description = "Employee Costs - Governance", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = null, SourceModule = SourceModule.Direct, ScoaItemId = item5000.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcGov.Id, ScoaProjectId = projOpex.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costStd.Id, ScoaMscId = mscGen.Id, Year1Amount = 12000000, Year2Amount = 12600000, Year3Amount = 13230000, Description = "General Expenditure - Governance", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = prj1.Id, SourceModule = SourceModule.Direct, ScoaItemId = item7000.Id, ScoaFundId = fundMIG.Id, ScoaFunctionId = funcWater.Id, ScoaProjectId = projCap001.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costProj.Id, ScoaMscId = mscGen.Id, Year1Amount = 25000000, Year2Amount = 15000000, Year3Amount = 0, Description = "Capital - Water Reticulation", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = prj2.Id, SourceModule = SourceModule.Direct, ScoaItemId = item7000.Id, ScoaFundId = fundMIG.Id, ScoaFunctionId = funcRoads.Id, ScoaProjectId = projCap002.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costProj.Id, ScoaMscId = mscGen.Id, Year1Amount = 18000000, Year2Amount = 20000000, Year3Amount = 22000000, Description = "Capital - Roads Rehabilitation", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = prj4.Id, SourceModule = SourceModule.Direct, ScoaItemId = item7000.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcElec.Id, ScoaProjectId = projCap004.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costProj.Id, ScoaMscId = mscGen.Id, Year1Amount = 8500000, Year2Amount = 9000000, Year3Amount = 0, Description = "Capital - Electrical Upgrade", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = null, SourceModule = SourceModule.Direct, ScoaItemId = item1100.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcGov.Id, ScoaProjectId = projOpex.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costStd.Id, ScoaMscId = mscRes.Id, Year1Amount = 65000000, Year2Amount = 68250000, Year3Amount = 71662500, Description = "Revenue - Property Rates", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = null, SourceModule = SourceModule.EB, ScoaItemId = item1200.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcElec.Id, ScoaProjectId = projOpex.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costStd.Id, ScoaMscId = mscGen.Id, Year1Amount = 120000000, Year2Amount = 132000000, Year3Amount = 145200000, Description = "Revenue - Electricity Service Charges", CreatedBy = "System" },
            new BudgetString { BudgetVersionId = tabbVersion.Id, ProjectId = null, SourceModule = SourceModule.EB, ScoaItemId = item4000.Id, ScoaFundId = fundCF.Id, ScoaFunctionId = funcElec.Id, ScoaProjectId = projOpex.Id, ScoaRegionId = regionMun.Id, ScoaCostingId = costStd.Id, ScoaMscId = mscGen.Id, Year1Amount = 85000000, Year2Amount = 93500000, Year3Amount = 102850000, Description = "Expenditure - Bulk Electricity Purchases", CreatedBy = "System" }
        };
        db.BudgetStrings.AddRange(budgetStrings);

        await db.SaveChangesAsync();

        await SeedVirementPolicyAsync(db);
        await SeedBillingBudgetAsync(db);
    }

    public static async Task SeedVirementPolicyAsync(BudgetDbContext db)
    {
        if (db.VirementPolicies.Any()) return;

        var activeFinYear = db.FinancialYears.FirstOrDefault(f => f.YearCode == "2025/2026");
        if (activeFinYear == null) return;

        var virementPolicy = new VirementPolicy
        {
            FinancialYearId = activeFinYear.Id,
            PolicyVersion = "2025/2026_VP001",
            IsActive = true,
            CreatedBy = "System"
        };
        db.VirementPolicies.Add(virementPolicy);
        await db.SaveChangesAsync();

        var policyRules = new[]
        {
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "SCOA Projects",
                Description = "Capital applies to expenditure of a \"long term nature\" and capitalised to the Property, Plant and Equipment group of accounts in the financial statements. Projects are therefore created along this definition of capital and the detail included under the labels for either infrastructure or non-infrastructure projects. Operational projects refer to current and short term projects for which the cost is immediately recognised as an expense and funded from the municipalities operational budget.",
                ValidationRule = "From SCOA Project must equal To SCOA Project (i.e. Municipal Running Cost)",
                Severity = "Error", SegmentType = "Project",
                SortOrder = 1
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "SCOA Projects",
                Description = "Capital applies to expenditure of a \"long term nature\" and capitalised to the Property, Plant and Equipment group of accounts in the financial statements. Projects are therefore created along this definition of capital and the detail included under the labels for either infrastructure or non-infrastructure projects. Operational projects refer to current and short term projects for which the cost is immediately recognised as an expense and funded from the municipalities operational budget.",
                ValidationRule = "From SCOA Project must equal To SCOA Project (i.e. Typical Works Cost)",
                Severity = "Error", SegmentType = "Project",
                SortOrder = 2
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "SCOA Function",
                Description = "Function is the standardised vote structure referred to in Section 1 of the Municipal Finance Management Act. Function is one of the main segments into which the budget of a municipality is divided for the appropriation of money for the different departments or functional areas of the municipality specifying the total amount appropriated for the purposes of the department or functional area.",
                ValidationRule = "From SCOA Function (Energy Sources) must equal To SCOA Function (Energy Sources)",
                Severity = "Error", SegmentType = "Function",
                SortOrder = 3
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "SCOA Function",
                Description = "Function is the standardised vote structure referred to in Section 1 of the Municipal Finance Management Act. Function is one of the main segments into which the budget of a municipality is divided for the appropriation of money for the different departments or functional areas of the municipality specifying the total amount appropriated for the purposes of the department or functional area. In accordance with MFMA Circular 51.",
                ValidationRule = "From SCOA Function (Energy Sources) may transfer to any other SCOA Function",
                Severity = "Warning", SegmentType = "Function",
                SortOrder = 4
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "SCOA Fund",
                Description = "Fund represents the source of funding. Conditional grants must remain within the fund segment and may not be transferred to non-grant funded items without NT approval.",
                ValidationRule = "From SCOA Fund must equal To SCOA Fund for conditional grants",
                Severity = "Error", SegmentType = "Fund",
                SortOrder = 5
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "Threshold Limit",
                Description = "Virements exceeding the approved threshold percentage of the source vote require council approval as per the municipality's virement policy.",
                ValidationRule = "Virement amount must not exceed threshold percentage of source budget line",
                Severity = "Warning", SegmentType = null,
                ThresholdPercent = 20.0m,
                RequiresCouncilApproval = true,
                SortOrder = 6
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "Maximum Amount",
                Description = "Individual virement requests are capped at a maximum amount. Amounts exceeding this limit require special council resolution.",
                ValidationRule = "Virement amount must not exceed maximum allowed amount",
                Severity = "Error", SegmentType = null,
                MaxAmount = 50000000.0m,
                RequiresCouncilApproval = true,
                SortOrder = 7
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "Capital to Operating",
                Description = "Transfers from capital expenditure items to operating expenditure items are not permitted without council approval, as capital funding is ring-fenced for asset acquisition.",
                ValidationRule = "Capital items (7000, 8000) cannot transfer to operating items (3000-6000)",
                Severity = "Error", SegmentType = "Item",
                FromSegmentFilter = "7000,8000",
                ToSegmentFilter = "3000,3100,4000,4100,5000,5100,6000",
                SortOrder = 8
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "Revenue to Expenditure",
                Description = "Revenue items cannot be vireed to expenditure items. Revenue budget is separate from expenditure budget.",
                ValidationRule = "Revenue items (1000-2999) cannot transfer to expenditure items (3000+)",
                Severity = "Error", SegmentType = "Item",
                FromSegmentFilter = "1100,1200,1300,1400,1500,1600,1700,1800,1900,2000",
                ToSegmentFilter = "3000,3100,4000,4100,5000,5100,6000,7000,8000,9000",
                SortOrder = 9
            },
            new VirementPolicyRule
            {
                VirementPolicyId = virementPolicy.Id, IsEnabled = true,
                Principle = "Employee Costs",
                Description = "Employee-related cost adjustments require HR endorsement and may not exceed the approved compensation budget framework without council resolution.",
                ValidationRule = "Transfers into Employee Costs (3000) require HR endorsement flag",
                Severity = "Warning", SegmentType = "Item",
                ToSegmentFilter = "3000,3100",
                SortOrder = 10
            }
        };
        db.VirementPolicyRules.AddRange(policyRules);
        await db.SaveChangesAsync();
    }

    public static async Task SeedBillingBudgetAsync(BudgetDbContext db)
    {
        if (db.ServiceCategories.Any()) return;

        var fy = db.FinancialYears.FirstOrDefault(f => f.YearCode == "2025/2026");
        if (fy == null) return;

        var serviceCategories = new[]
        {
            new ServiceCategory { Code = "WATER", Name = "Water Supply", Type = ServiceType.Water, MeasurementUnit = "kL" },
            new ServiceCategory { Code = "ELEC", Name = "Electricity Distribution", Type = ServiceType.Electricity, MeasurementUnit = "kWh" },
            new ServiceCategory { Code = "SANIT", Name = "Sanitation Services", Type = ServiceType.Sanitation, MeasurementUnit = "Fixed" },
            new ServiceCategory { Code = "REFUSE", Name = "Refuse Removal", Type = ServiceType.Refuse, MeasurementUnit = "Fixed" },
            new ServiceCategory { Code = "RATES", Name = "Property Rates", Type = ServiceType.PropertyRates, MeasurementUnit = "Rand" }
        };
        db.ServiceCategories.AddRange(serviceCategories);
        await db.SaveChangesAsync();

        var water = db.ServiceCategories.First(s => s.Code == "WATER");
        var elec = db.ServiceCategories.First(s => s.Code == "ELEC");
        var sanit = db.ServiceCategories.First(s => s.Code == "SANIT");
        var refuse = db.ServiceCategories.First(s => s.Code == "REFUSE");
        var rates = db.ServiceCategories.First(s => s.Code == "RATES");

        var tariffs = new[]
        {
            new Tariff { ServiceCategoryId = water.Id, Name = "Water - Residential", PropertyCategory = PropertyCategory.Residential, TariffType = TariffType.Inclining, BasicCharge = 85.50m, UnitRate = 12.45m, BlockStart = 0, BlockEnd = 6, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = water.Id, Name = "Water - Commercial", PropertyCategory = PropertyCategory.Commercial, TariffType = TariffType.Tiered, BasicCharge = 250.00m, UnitRate = 18.75m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = elec.Id, Name = "Electricity - Residential", PropertyCategory = PropertyCategory.Residential, TariffType = TariffType.Inclining, BasicCharge = 125.00m, UnitRate = 2.85m, BlockStart = 0, BlockEnd = 50, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = elec.Id, Name = "Electricity - Commercial", PropertyCategory = PropertyCategory.Commercial, TariffType = TariffType.Tiered, BasicCharge = 450.00m, UnitRate = 3.25m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = elec.Id, Name = "Electricity - Industrial", PropertyCategory = PropertyCategory.Industrial, TariffType = TariffType.Fixed, BasicCharge = 1500.00m, UnitRate = 2.15m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = sanit.Id, Name = "Sanitation - Residential", PropertyCategory = PropertyCategory.Residential, TariffType = TariffType.Fixed, BasicCharge = 165.00m, UnitRate = 0, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = sanit.Id, Name = "Sanitation - Commercial", PropertyCategory = PropertyCategory.Commercial, TariffType = TariffType.Fixed, BasicCharge = 320.00m, UnitRate = 0, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = refuse.Id, Name = "Refuse - Residential", PropertyCategory = PropertyCategory.Residential, TariffType = TariffType.Fixed, BasicCharge = 145.00m, UnitRate = 0, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = refuse.Id, Name = "Refuse - Commercial", PropertyCategory = PropertyCategory.Commercial, TariffType = TariffType.Fixed, BasicCharge = 380.00m, UnitRate = 0, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = rates.Id, Name = "Rates - Residential", PropertyCategory = PropertyCategory.Residential, TariffType = TariffType.Fixed, BasicCharge = 0, UnitRate = 0.0089m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = rates.Id, Name = "Rates - Commercial", PropertyCategory = PropertyCategory.Commercial, TariffType = TariffType.Fixed, BasicCharge = 0, UnitRate = 0.0145m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new Tariff { ServiceCategoryId = rates.Id, Name = "Rates - Industrial", PropertyCategory = PropertyCategory.Industrial, TariffType = TariffType.Fixed, BasicCharge = 0, UnitRate = 0.0178m, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true }
        };
        db.Tariffs.AddRange(tariffs);
        await db.SaveChangesAsync();

        var consumerCategories = new[]
        {
            new ConsumerCategory { Name = "Residential Households", Type = ConsumerType.Household, ConsumerCount = 45000, AvgMonthlyConsumption = 15, PropertyValueMin = 250000, PropertyValueMax = 2500000, GeographicArea = "Municipality-Wide", IsFlagged = true },
            new ConsumerCategory { Name = "Commercial Businesses", Type = ConsumerType.Business, ConsumerCount = 3200, AvgMonthlyConsumption = 85, PropertyValueMin = 500000, PropertyValueMax = 15000000, GeographicArea = "CBD & Industrial Zone", IsFlagged = true },
            new ConsumerCategory { Name = "Industrial Operations", Type = ConsumerType.Industrial, ConsumerCount = 420, AvgMonthlyConsumption = 950, PropertyValueMin = 2000000, PropertyValueMax = 50000000, GeographicArea = "Industrial Zone", IsFlagged = true },
            new ConsumerCategory { Name = "NGOs & Non-Profits", Type = ConsumerType.NGO, ConsumerCount = 185, AvgMonthlyConsumption = 25, PropertyValueMin = 300000, PropertyValueMax = 3000000, GeographicArea = "Municipality-Wide", IsFlagged = true }
        };
        db.ConsumerCategories.AddRange(consumerCategories);
        await db.SaveChangesAsync();

        var residential = db.ConsumerCategories.First(c => c.Name == "Residential Households");
        var commercial = db.ConsumerCategories.First(c => c.Name == "Commercial Businesses");
        var industrial = db.ConsumerCategories.First(c => c.Name == "Industrial Operations");
        var ngo = db.ConsumerCategories.First(c => c.Name == "NGOs & Non-Profits");

        var consumerServices = new[]
        {
            new ConsumerCategoryService { ConsumerCategoryId = residential.Id, ServiceCategoryId = water.Id, AvgConsumption = 15, ConsumerCount = 45000 },
            new ConsumerCategoryService { ConsumerCategoryId = residential.Id, ServiceCategoryId = elec.Id, AvgConsumption = 450, ConsumerCount = 45000 },
            new ConsumerCategoryService { ConsumerCategoryId = residential.Id, ServiceCategoryId = sanit.Id, AvgConsumption = 1, ConsumerCount = 45000 },
            new ConsumerCategoryService { ConsumerCategoryId = residential.Id, ServiceCategoryId = refuse.Id, AvgConsumption = 1, ConsumerCount = 45000 },
            new ConsumerCategoryService { ConsumerCategoryId = residential.Id, ServiceCategoryId = rates.Id, AvgConsumption = 850000, ConsumerCount = 45000 },
            new ConsumerCategoryService { ConsumerCategoryId = commercial.Id, ServiceCategoryId = water.Id, AvgConsumption = 85, ConsumerCount = 3200 },
            new ConsumerCategoryService { ConsumerCategoryId = commercial.Id, ServiceCategoryId = elec.Id, AvgConsumption = 2500, ConsumerCount = 3200 },
            new ConsumerCategoryService { ConsumerCategoryId = commercial.Id, ServiceCategoryId = sanit.Id, AvgConsumption = 1, ConsumerCount = 3200 },
            new ConsumerCategoryService { ConsumerCategoryId = commercial.Id, ServiceCategoryId = refuse.Id, AvgConsumption = 1, ConsumerCount = 3200 },
            new ConsumerCategoryService { ConsumerCategoryId = commercial.Id, ServiceCategoryId = rates.Id, AvgConsumption = 3500000, ConsumerCount = 3200 },
            new ConsumerCategoryService { ConsumerCategoryId = industrial.Id, ServiceCategoryId = water.Id, AvgConsumption = 950, ConsumerCount = 420 },
            new ConsumerCategoryService { ConsumerCategoryId = industrial.Id, ServiceCategoryId = elec.Id, AvgConsumption = 15000, ConsumerCount = 420 },
            new ConsumerCategoryService { ConsumerCategoryId = industrial.Id, ServiceCategoryId = sanit.Id, AvgConsumption = 1, ConsumerCount = 420 },
            new ConsumerCategoryService { ConsumerCategoryId = industrial.Id, ServiceCategoryId = refuse.Id, AvgConsumption = 1, ConsumerCount = 420 },
            new ConsumerCategoryService { ConsumerCategoryId = industrial.Id, ServiceCategoryId = rates.Id, AvgConsumption = 12000000, ConsumerCount = 420 },
            new ConsumerCategoryService { ConsumerCategoryId = ngo.Id, ServiceCategoryId = water.Id, AvgConsumption = 25, ConsumerCount = 185 },
            new ConsumerCategoryService { ConsumerCategoryId = ngo.Id, ServiceCategoryId = elec.Id, AvgConsumption = 800, ConsumerCount = 185 },
            new ConsumerCategoryService { ConsumerCategoryId = ngo.Id, ServiceCategoryId = sanit.Id, AvgConsumption = 1, ConsumerCount = 185 },
            new ConsumerCategoryService { ConsumerCategoryId = ngo.Id, ServiceCategoryId = refuse.Id, AvgConsumption = 1, ConsumerCount = 185 },
            new ConsumerCategoryService { ConsumerCategoryId = ngo.Id, ServiceCategoryId = rates.Id, AvgConsumption = 1200000, ConsumerCount = 185 }
        };
        db.ConsumerCategoryServices.AddRange(consumerServices);
        await db.SaveChangesAsync();

        var rebateTypes = new[]
        {
            new RebateType { Name = "Indigent Subsidy - Free Basic Water (6kL)", Category = RebateCategory.Indigent, ServiceCategoryId = water.Id, RebatePercent = 100, FixedAmount = 74.70m },
            new RebateType { Name = "Indigent Subsidy - Free Basic Electricity (50kWh)", Category = RebateCategory.Indigent, ServiceCategoryId = elec.Id, RebatePercent = 100, FixedAmount = 142.50m },
            new RebateType { Name = "Indigent Subsidy - Sanitation", Category = RebateCategory.Indigent, ServiceCategoryId = sanit.Id, RebatePercent = 100, FixedAmount = 165.00m },
            new RebateType { Name = "Senior Citizen Rebate", Category = RebateCategory.SeniorCitizen, RebatePercent = 10 },
            new RebateType { Name = "Early Payment Discount", Category = RebateCategory.EarlyPayment, RebatePercent = 2.5m }
        };
        db.RebateTypes.AddRange(rebateTypes);
        await db.SaveChangesAsync();
    }

    public static async Task SeedCreditorsBudgetAsync(BudgetDbContext db)
    {
        if (db.ExpenditureCategories.Any()) return;

        var fy = db.FinancialYears.FirstOrDefault(f => f.YearCode == "2025/2026");
        if (fy == null) return;

        var expenditureCategories = new[]
        {
            new ExpenditureCategory { Code = "EMP", Name = "Employee Costs", Type = ExpenditureCategoryType.EmployeeCosts, Department = "Corporate Services", MeasurementUnit = "Rand" },
            new ExpenditureCategory { Code = "BULK", Name = "Bulk Purchases", Type = ExpenditureCategoryType.BulkPurchases, Department = "Technical Services", MeasurementUnit = "Rand" },
            new ExpenditureCategory { Code = "CONT", Name = "Contracted Services", Type = ExpenditureCategoryType.ContractedServices, Department = "Infrastructure", MeasurementUnit = "Rand" },
            new ExpenditureCategory { Code = "GEN", Name = "General Expenses", Type = ExpenditureCategoryType.GeneralExpenses, Department = "Finance", MeasurementUnit = "Rand" },
            new ExpenditureCategory { Code = "R&M", Name = "Repairs & Maintenance", Type = ExpenditureCategoryType.RepairsAndMaintenance, Department = "Technical Services", MeasurementUnit = "Rand" },
            new ExpenditureCategory { Code = "OTHER", Name = "Other Expenditure", Type = ExpenditureCategoryType.OtherExpenditure, Department = "Finance", MeasurementUnit = "Rand" }
        };
        db.ExpenditureCategories.AddRange(expenditureCategories);
        await db.SaveChangesAsync();

        var emp = db.ExpenditureCategories.First(e => e.Code == "EMP");
        var bulk = db.ExpenditureCategories.First(e => e.Code == "BULK");
        var cont = db.ExpenditureCategories.First(e => e.Code == "CONT");
        var gen = db.ExpenditureCategories.First(e => e.Code == "GEN");
        var rm = db.ExpenditureCategories.First(e => e.Code == "R&M");
        var other = db.ExpenditureCategories.First(e => e.Code == "OTHER");

        var costItems = new[]
        {
            new CostItem { ExpenditureCategoryId = emp.Id, Name = "Salaries & Wages", ItemType = CostItemType.Recurring, BasicCost = 4500000m, UnitRate = 0, VatIndicator = VatIndicator.Exempt, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = emp.Id, Name = "Employee Benefits & Pension", ItemType = CostItemType.Recurring, BasicCost = 1200000m, UnitRate = 0, VatIndicator = VatIndicator.Exempt, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = emp.Id, Name = "Overtime & Allowances", ItemType = CostItemType.Estimated, BasicCost = 350000m, UnitRate = 0, VatIndicator = VatIndicator.Exempt, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, IsVariabilityFlagged = true, VariabilityType = "Seasonal" },
            new CostItem { ExpenditureCategoryId = bulk.Id, Name = "Bulk Electricity Purchase (Eskom)", ItemType = CostItemType.Contracted, BasicCost = 850000m, UnitRate = 1.95m, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, SupplierName = "Eskom Holdings", SupplierVatNumber = "4740101508", ContractReference = "ESKOM-2025-001" },
            new CostItem { ExpenditureCategoryId = bulk.Id, Name = "Bulk Water Purchase (DWS)", ItemType = CostItemType.Contracted, BasicCost = 420000m, UnitRate = 8.50m, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, SupplierName = "Dept Water & Sanitation", ContractReference = "DWS-2025-042" },
            new CostItem { ExpenditureCategoryId = cont.Id, Name = "Waste Collection Contract", ItemType = CostItemType.Contracted, BasicCost = 280000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, SupplierName = "WasteMasters SA", ContractReference = "WM-2024-089" },
            new CostItem { ExpenditureCategoryId = cont.Id, Name = "Security Services", ItemType = CostItemType.Contracted, BasicCost = 185000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, SupplierName = "SecureGuard Holdings", ContractReference = "SG-2025-015" },
            new CostItem { ExpenditureCategoryId = cont.Id, Name = "IT Support & Maintenance", ItemType = CostItemType.Contracted, BasicCost = 125000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, SupplierName = "MuniTech Solutions", ContractReference = "MT-2025-003" },
            new CostItem { ExpenditureCategoryId = gen.Id, Name = "Office Supplies & Consumables", ItemType = CostItemType.Recurring, BasicCost = 45000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = gen.Id, Name = "Travel & Subsistence", ItemType = CostItemType.Estimated, BasicCost = 65000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, IsVariabilityFlagged = true, VariabilityType = "Demand-Based" },
            new CostItem { ExpenditureCategoryId = gen.Id, Name = "Insurance Premiums", ItemType = CostItemType.Recurring, BasicCost = 180000m, UnitRate = 0, VatIndicator = VatIndicator.ZeroRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = rm.Id, Name = "Road Infrastructure Repairs", ItemType = CostItemType.Estimated, BasicCost = 320000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true, IsVariabilityFlagged = true, VariabilityType = "Emergency" },
            new CostItem { ExpenditureCategoryId = rm.Id, Name = "Water & Sewer Network Maintenance", ItemType = CostItemType.Estimated, BasicCost = 250000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = rm.Id, Name = "Electrical Network Maintenance", ItemType = CostItemType.Estimated, BasicCost = 195000m, UnitRate = 0, VatIndicator = VatIndicator.StandardRated, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true },
            new CostItem { ExpenditureCategoryId = other.Id, Name = "Depreciation & Amortisation", ItemType = CostItemType.Recurring, BasicCost = 420000m, UnitRate = 0, VatIndicator = VatIndicator.OutOfScope, EffectiveFrom = fy.StartDate, FinancialYearId = fy.Id, IsApproved = true }
        };
        db.CostItems.AddRange(costItems);
        await db.SaveChangesAsync();

        var creditorCategories = new[]
        {
            new CreditorCategory { Name = "Current Creditors (0-30 days)", Type = CreditorCategoryType.Current, PaymentTermDays = 30, ChargesInterest = false },
            new CreditorCategory { Name = "30-Day Creditors", Type = CreditorCategoryType.ThirtyDay, PaymentTermDays = 30, ChargesInterest = false },
            new CreditorCategory { Name = "60-Day Creditors", Type = CreditorCategoryType.SixtyDay, PaymentTermDays = 60, InterestRate = 1.5m, ChargesInterest = true, InterestCalculationMethod = "Simple" },
            new CreditorCategory { Name = "90+ Day Creditors", Type = CreditorCategoryType.NinetyPlusDay, PaymentTermDays = 90, InterestRate = 2.0m, ChargesInterest = true, InterestCalculationMethod = "Simple" }
        };
        db.CreditorCategories.AddRange(creditorCategories);
        await db.SaveChangesAsync();

        var current = db.CreditorCategories.First(c => c.Type == CreditorCategoryType.Current);
        var thirty = db.CreditorCategories.First(c => c.Type == CreditorCategoryType.ThirtyDay);
        var sixty = db.CreditorCategories.First(c => c.Type == CreditorCategoryType.SixtyDay);
        var ninety = db.CreditorCategories.First(c => c.Type == CreditorCategoryType.NinetyPlusDay);

        var creditorItems = new[]
        {
            new CreditorCategoryItem { CreditorCategoryId = current.Id, ExpenditureCategoryId = emp.Id, PaymentRate30Days = 95, PaymentRate60Days = 4, PaymentRate90Days = 0.8m, PaymentRateOver90Days = 0.2m },
            new CreditorCategoryItem { CreditorCategoryId = thirty.Id, ExpenditureCategoryId = bulk.Id, PaymentRate30Days = 70, PaymentRate60Days = 20, PaymentRate90Days = 8, PaymentRateOver90Days = 2 },
            new CreditorCategoryItem { CreditorCategoryId = thirty.Id, ExpenditureCategoryId = cont.Id, PaymentRate30Days = 75, PaymentRate60Days = 18, PaymentRate90Days = 5, PaymentRateOver90Days = 2 },
            new CreditorCategoryItem { CreditorCategoryId = sixty.Id, ExpenditureCategoryId = gen.Id, PaymentRate30Days = 60, PaymentRate60Days = 25, PaymentRate90Days = 10, PaymentRateOver90Days = 5 },
            new CreditorCategoryItem { CreditorCategoryId = sixty.Id, ExpenditureCategoryId = rm.Id, PaymentRate30Days = 55, PaymentRate60Days = 28, PaymentRate90Days = 12, PaymentRateOver90Days = 5 },
            new CreditorCategoryItem { CreditorCategoryId = ninety.Id, ExpenditureCategoryId = other.Id, PaymentRate30Days = 40, PaymentRate60Days = 30, PaymentRate90Days = 20, PaymentRateOver90Days = 10 }
        };
        db.CreditorCategoryItems.AddRange(creditorItems);
        await db.SaveChangesAsync();

        var forecastAssumptions = new[]
        {
            new ForecastAssumption { Name = "Consumer Price Index (CPI)", AssumptionType = ForecastAssumptionType.CPI, FinancialYearId = fy.Id, Year1Value = 5.2m, Year2Value = 4.8m, Year3Value = 4.5m, Category = "Inflation", Justification = "SARB forecast March 2025" },
            new ForecastAssumption { Name = "Producer Price Index (PPI)", AssumptionType = ForecastAssumptionType.PPI, FinancialYearId = fy.Id, Year1Value = 6.1m, Year2Value = 5.5m, Year3Value = 5.0m, Category = "Inflation", Justification = "Stats SA projection" },
            new ForecastAssumption { Name = "Public Sector Wage Increase", AssumptionType = ForecastAssumptionType.WageIncrease, FinancialYearId = fy.Id, Year1Value = 7.5m, Year2Value = 6.8m, Year3Value = 6.0m, Category = "Employment", Justification = "SALGA collective agreement" },
            new ForecastAssumption { Name = "Bulk Electricity Tariff Increase", AssumptionType = ForecastAssumptionType.BulkElectricity, FinancialYearId = fy.Id, Year1Value = 12.7m, Year2Value = 10.0m, Year3Value = 8.5m, Category = "Bulk Purchases", Justification = "NERSA approved Eskom increase" },
            new ForecastAssumption { Name = "Bulk Water Tariff Increase", AssumptionType = ForecastAssumptionType.BulkWater, FinancialYearId = fy.Id, Year1Value = 9.5m, Year2Value = 8.0m, Year3Value = 7.5m, Category = "Bulk Purchases", Justification = "DWS gazetted increase" }
        };
        db.ForecastAssumptions.AddRange(forecastAssumptions);
        await db.SaveChangesAsync();

        var paymentArrangements = new[]
        {
            new CreditorPaymentArrangement { CreditorName = "Eskom Holdings", ReferenceNumber = "PA-ESK-2025-001", TotalOutstanding = 2450000m, InstalmentAmount = 245000m, PaymentIntervalDays = 30, RemainingBalance = 1960000m, InterestRate = 0, ArrangementStatus = PaymentArrangementStatus.Active, StartDate = new DateTime(2025, 1, 1), ExpenditureCategoryId = bulk.Id },
            new CreditorPaymentArrangement { CreditorName = "WasteMasters SA", ReferenceNumber = "PA-WM-2025-002", TotalOutstanding = 850000m, InstalmentAmount = 142000m, PaymentIntervalDays = 30, RemainingBalance = 566000m, InterestRate = 1.5m, ArrangementStatus = PaymentArrangementStatus.Active, StartDate = new DateTime(2025, 3, 1), ExpenditureCategoryId = cont.Id },
            new CreditorPaymentArrangement { CreditorName = "Road Works Contractors", ReferenceNumber = "PA-RW-2024-015", TotalOutstanding = 1200000m, InstalmentAmount = 100000m, PaymentIntervalDays = 30, RemainingBalance = 400000m, InterestRate = 2.0m, ArrangementStatus = PaymentArrangementStatus.Active, StartDate = new DateTime(2024, 6, 1), EndDate = new DateTime(2025, 6, 30), ExpenditureCategoryId = rm.Id }
        };
        db.CreditorPaymentArrangements.AddRange(paymentArrangements);
        await db.SaveChangesAsync();

        var scenarios = new[]
        {
            new ExpenditureScenario { Name = "Baseline CPI Adjustment", Description = "Standard CPI-linked expenditure increase", FinancialYearId = fy.Id, Status = CreditorApprovalStatus.Draft, BaseInflationPercent = 5.2m, DemandAdjustmentPercent = 0, Justification = "CPI-linked baseline increase per SARB forecast", CreatedBy = "system" },
            new ExpenditureScenario { Name = "High Inflation + Growth", Description = "Scenario with above-CPI inflation and demand growth", FinancialYearId = fy.Id, Status = CreditorApprovalStatus.Draft, BaseInflationPercent = 7.5m, DemandAdjustmentPercent = 3.0m, Justification = "Worst-case planning with wage settlement and service expansion", CreatedBy = "system" }
        };
        db.ExpenditureScenarios.AddRange(scenarios);
        await db.SaveChangesAsync();

        foreach (var scenario in db.ExpenditureScenarios.ToList())
        {
            foreach (var cat in db.ExpenditureCategories.ToList())
            {
                var catCostItems = db.CostItems.Where(ci => ci.ExpenditureCategoryId == cat.Id && ci.IsApproved).ToList();
                var baseCostItem = catCostItems.FirstOrDefault();
                var currentRate = baseCostItem?.UnitRate ?? 0;
                var currentBasic = baseCostItem?.BasicCost ?? 0;
                var inflFactor = 1 + (scenario.BaseInflationPercent / 100);
                var demandFactor = 1 + ((scenario.DemandAdjustmentPercent ?? 0) / 100);

                var currentExp = catCostItems.Sum(ci => (ci.UnitRate + ci.BasicCost) * 12);
                var projectedExp = catCostItems.Sum(ci => (ci.UnitRate * inflFactor + ci.BasicCost * inflFactor) * demandFactor * 12);

                var line = new ExpenditureScenarioLine
                {
                    ExpenditureScenarioId = scenario.Id,
                    ExpenditureCategoryId = cat.Id,
                    BaseCostItemId = baseCostItem?.Id,
                    CurrentUnitRate = currentRate,
                    CurrentBasicCost = currentBasic,
                    ProjectedUnitRate = Math.Round(currentRate * inflFactor, 4),
                    ProjectedBasicCost = Math.Round(currentBasic * inflFactor, 4),
                    InflationPercent = scenario.BaseInflationPercent,
                    DemandAdjustmentPercent = scenario.DemandAdjustmentPercent ?? 0,
                    CurrentExpenditure = Math.Round(currentExp, 2),
                    ProjectedExpenditure = Math.Round(projectedExp, 2),
                    VarianceAmount = Math.Round(projectedExp - currentExp, 2),
                    VariancePercent = currentExp != 0 ? Math.Round((projectedExp - currentExp) / currentExp * 100, 2) : 0,
                    IsMaterialShift = currentExp != 0 && Math.Abs((projectedExp - currentExp) / currentExp * 100) > 15
                };
                db.ExpenditureScenarioLines.Add(line);
            }
        }
        await db.SaveChangesAsync();

        var allCostItems = db.CostItems.Include(ci => ci.ExpenditureCategory).Where(ci => ci.FinancialYearId == fy.Id && ci.IsApproved).ToList();
        foreach (var ci in allCostItems)
        {
            var annualGross = (ci.UnitRate + ci.BasicCost) * 12;
            var vatRate = ci.VatIndicator == VatIndicator.StandardRated ? 0.15m : 0;
            var vatAmount = Math.Round(annualGross * vatRate, 2);
            var y1 = Math.Round(annualGross, 2);
            var y2 = Math.Round(y1 * 1.052m, 2);
            var y3 = Math.Round(y2 * 1.048m, 2);
            var monthly = Math.Round(y1 / 12, 2);

            var projection = new ExpenditureProjection
            {
                FinancialYearId = fy.Id,
                ExpenditureCategoryId = ci.ExpenditureCategoryId,
                CostItemId = ci.Id,
                UnitRate = ci.UnitRate,
                BasicCost = ci.BasicCost,
                GrossExpenditure = y1,
                VatAmount = vatAmount,
                NetExpenditure = y1 + vatAmount,
                Year1Amount = y1,
                Year2Amount = y2,
                Year3Amount = y3,
                Month01 = monthly, Month02 = monthly, Month03 = monthly,
                Month04 = monthly, Month05 = monthly, Month06 = monthly,
                Month07 = monthly, Month08 = monthly, Month09 = monthly,
                Month10 = monthly, Month11 = monthly, Month12 = monthly,
                Status = CreditorApprovalStatus.Draft
            };
            db.ExpenditureProjections.Add(projection);
        }
        await db.SaveChangesAsync();

        var projections = db.ExpenditureProjections.Include(p => p.ExpenditureCategory).Where(p => p.FinancialYearId == fy.Id).ToList();
        var credCats = db.CreditorCategories.Include(c => c.CreditorItems).ToList();
        var projGrouped = projections.GroupBy(p => p.ExpenditureCategoryId);

        foreach (var group in projGrouped)
        {
            var cat = group.First().ExpenditureCategory;
            var totalExp = group.Sum(p => p.GrossExpenditure);

            var matchingCredCat = credCats.FirstOrDefault(cc => cc.CreditorItems.Any(ci => ci.ExpenditureCategoryId == cat.Id));
            if (matchingCredCat == null) matchingCredCat = credCats.First();

            var paymentRate = matchingCredCat.CreditorItems.FirstOrDefault(ci => ci.ExpenditureCategoryId == cat.Id)?.PaymentRate30Days ?? 80;
            var openingBal = totalExp * 0.08m;
            var projPayments = totalExp * (paymentRate / 100);
            var closingBal = openingBal + totalExp - projPayments;

            var liability = new CreditorLiability
            {
                FinancialYearId = fy.Id,
                ExpenditureCategoryId = cat.Id,
                CreditorCategoryId = matchingCredCat.Id,
                LiabilityType = matchingCredCat.Type.ToString(),
                OpeningBalance = Math.Round(openingBal, 2),
                ProjectedExpenditure = Math.Round(totalExp, 2),
                ProjectedPayments = Math.Round(projPayments, 2),
                ClosingBalance = Math.Round(closingBal, 2),
                PaymentRate = paymentRate,
                ContraBankAccount = $"BNK-{cat.Code}-{matchingCredCat.Type}",
                IsPriorYearLiability = false,
                Year1Amount = Math.Round(closingBal, 2),
                Year2Amount = Math.Round(closingBal * 1.052m, 2),
                Year3Amount = Math.Round(closingBal * 1.052m * 1.048m, 2),
                Status = CreditorApprovalStatus.Draft
            };
            db.CreditorLiabilities.Add(liability);
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedHrPayrollBudgetAsync(BudgetDbContext db)
    {
        if (db.StatutoryDeductions.Any()) return;

        var fy = db.FinancialYears.First(f => f.IsActive);
        var departments = db.Departments.Select(d => d.Name).ToList();

        db.StatutoryDeductions.AddRange(
            new StatutoryDeduction { DeductionType = "PAYE", CalculationMethod = DeductionCalculationMethod.TaxTable, Rate = 0, Description = "Pay-As-You-Earn income tax per SARS tax tables" },
            new StatutoryDeduction { DeductionType = "UIF", CalculationMethod = DeductionCalculationMethod.Percentage, Rate = 0.01m, EmployerContributionRate = 0.01m, Threshold = 177120m, Description = "Unemployment Insurance Fund - 1% employee + 1% employer" },
            new StatutoryDeduction { DeductionType = "SDL", CalculationMethod = DeductionCalculationMethod.Percentage, Rate = 0.01m, Description = "Skills Development Levy - 1% of total remuneration" },
            new StatutoryDeduction { DeductionType = "Pension", CalculationMethod = DeductionCalculationMethod.Percentage, Rate = 0.075m, EmployerContributionRate = 0.13m, Description = "Pension fund contribution" },
            new StatutoryDeduction { DeductionType = "MedicalAid", CalculationMethod = DeductionCalculationMethod.FixedAmount, Rate = 3200m, EmployerContributionRate = 0.66m, Description = "Medical aid employer subsidy" },
            new StatutoryDeduction { DeductionType = "GroupLife", CalculationMethod = DeductionCalculationMethod.Percentage, Rate = 0.012m, Description = "Group life insurance premium" },
            new StatutoryDeduction { DeductionType = "UnionFees", CalculationMethod = DeductionCalculationMethod.Percentage, Rate = 0.01m, Description = "Trade union membership fee deduction" }
        );

        db.TravelStandardRates.AddRange(
            new TravelStandardRate { RateType = "Mileage", Classification = TravelClassification.Local, RateAmount = 4.64m, EffectiveDate = new DateTime(2025, 3, 1), PolicyReference = "SARS 2025/26" },
            new TravelStandardRate { RateType = "Mileage", Classification = TravelClassification.Provincial, RateAmount = 4.64m, EffectiveDate = new DateTime(2025, 3, 1), PolicyReference = "SARS 2025/26" },
            new TravelStandardRate { RateType = "Accommodation", Classification = TravelClassification.Local, RateAmount = 1200m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" },
            new TravelStandardRate { RateType = "Accommodation", Classification = TravelClassification.Provincial, RateAmount = 1800m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" },
            new TravelStandardRate { RateType = "Accommodation", Classification = TravelClassification.National, RateAmount = 2500m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" },
            new TravelStandardRate { RateType = "Subsistence", Classification = TravelClassification.Local, RateAmount = 452m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" },
            new TravelStandardRate { RateType = "Subsistence", Classification = TravelClassification.Provincial, RateAmount = 452m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" },
            new TravelStandardRate { RateType = "Subsistence", Classification = TravelClassification.National, RateAmount = 452m, EffectiveDate = new DateTime(2025, 7, 1), PolicyReference = "Cost Containment 2025/26" }
        );

        for (int g = 1; g <= 10; g++)
        {
            for (int n = 1; n <= 5; n++)
            {
                var baseAmount = 120000m + (g * 45000m) + (n * 8000m);
                db.SalaryStructures.Add(new SalaryStructure
                {
                    Grade = g,
                    Notch = n,
                    AnnualAmount = baseAmount,
                    HourlyRate = Math.Round(baseAmount / 2080, 2),
                    EffectiveDate = new DateTime(2025, 7, 1),
                    BargainingUnit = g <= 5 ? "SALGA" : "Non-Bargaining",
                    EmployeeCategory = g <= 3 ? "General Worker" : g <= 6 ? "Skilled Worker" : g <= 8 ? "Professional" : "Senior Management",
                    JobLevel = $"Level {g}"
                });
            }
        }

        var postIdx = 1;
        var postData = new[]
        {
            ("Finance", "Chief Financial Officer", 10, 5, PostStatus.Filled),
            ("Finance", "Senior Accountant", 7, 3, PostStatus.Filled),
            ("Finance", "Budget Analyst", 6, 2, PostStatus.Filled),
            ("Finance", "Revenue Clerk", 3, 1, PostStatus.Vacant),
            ("Infrastructure & Engineering", "Director: Infrastructure", 10, 4, PostStatus.Filled),
            ("Infrastructure & Engineering", "Civil Engineer", 8, 3, PostStatus.Filled),
            ("Infrastructure & Engineering", "Project Manager", 7, 2, PostStatus.Vacant),
            ("Infrastructure & Engineering", "Maintenance Supervisor", 5, 3, PostStatus.Filled),
            ("Infrastructure & Engineering", "General Worker", 2, 1, PostStatus.Filled),
            ("Community Services", "Director: Community Services", 9, 4, PostStatus.Filled),
            ("Community Services", "Librarian", 5, 2, PostStatus.Filled),
            ("Community Services", "Parks Supervisor", 4, 3, PostStatus.Vacant),
            ("Corporate Services", "Director: Corporate Services", 9, 5, PostStatus.Filled),
            ("Corporate Services", "HR Manager", 7, 3, PostStatus.Filled),
            ("Corporate Services", "IT Technician", 5, 2, PostStatus.Vacant),
            ("Corporate Services", "Records Clerk", 3, 1, PostStatus.Filled),
            ("Electrical Services", "Electrical Engineer", 8, 4, PostStatus.Filled),
            ("Electrical Services", "Electrician", 4, 3, PostStatus.Filled),
            ("Electrical Services", "Meter Reader", 2, 1, PostStatus.Vacant),
            ("Municipal Manager", "Municipal Manager", 10, 5, PostStatus.Filled),
            ("Municipal Manager", "Executive Assistant", 5, 2, PostStatus.Filled),
        };

        foreach (var (dept, title, grade, notch, status) in postData)
        {
            var salaryStructure = db.SalaryStructures.Local.FirstOrDefault(s => s.Grade == grade && s.Notch == notch);
            var annualSalary = salaryStructure?.AnnualAmount ?? (120000m + grade * 45000m + notch * 8000m);
            var totalCost = Math.Round(annualSalary * 1.35m, 2);

            db.PostEstablishments.Add(new PostEstablishment
            {
                PostCode = $"POST-{postIdx:D4}",
                Title = title,
                Department = dept,
                JobLevel = $"Level {grade}",
                SalaryGrade = grade,
                SalaryNotch = notch,
                EmploymentType = PostEmploymentType.Permanent,
                Status = status,
                IsFunded = true,
                IsActive = true,
                FundingSource = "Equitable Share",
                PlannedStartDate = status == PostStatus.Vacant ? new DateTime(2025, 10, 1) : null,
                PriorityStatus = status == PostStatus.Vacant ? PostPriorityStatus.High : PostPriorityStatus.NotRanked,
                RankingScore = status == PostStatus.Vacant ? 75 + postIdx : 0,
                BargainingUnit = grade <= 5 ? "SALGA" : "Non-Bargaining",
                EmployeeCategory = grade <= 3 ? "General Worker" : grade <= 6 ? "Skilled Worker" : grade <= 8 ? "Professional" : "Senior Management",
                AnnualSalary = annualSalary,
                TotalCostToMunicipality = totalCost,
                FinancialYearId = fy.Id,
                ScoaItemCode = "3000",
                ScoaFundCode = "CF",
                ScoaFunctionCode = "GOVN"
            });
            postIdx++;
        }

        db.TemporaryContracts.AddRange(
            new TemporaryContract { EmployeeName = "J. Nkosi", Department = "Infrastructure & Engineering", JobTitle = "Contract Surveyor", ContractStartDate = new DateTime(2025, 7, 1), ContractEndDate = new DateTime(2025, 12, 31), RemunerationType = RemunerationType.Monthly, Rate = 35000m, CalculatedBudget = 210000m, ContractStatus = "Active", FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new TemporaryContract { EmployeeName = "S. van der Merwe", Department = "Finance", JobTitle = "Audit Assistant", ContractStartDate = new DateTime(2025, 8, 1), ContractEndDate = new DateTime(2026, 1, 31), RemunerationType = RemunerationType.Monthly, Rate = 22000m, CalculatedBudget = 132000m, ContractStatus = "Active", FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new TemporaryContract { EmployeeName = "T. Dlamini", Department = "Community Services", JobTitle = "Seasonal Groundskeeper", ContractStartDate = new DateTime(2025, 10, 1), ContractEndDate = new DateTime(2026, 3, 31), RemunerationType = RemunerationType.Hourly, Rate = 85m, CalculatedBudget = 88400m, ContractStatus = "Pending", FinancialYearId = fy.Id, ScoaItemCode = "3000" }
        );

        db.CouncillorPositions.AddRange(
            new CouncillorPosition { PositionTitle = "Executive Mayor", CouncillorType = CouncillorType.FullTime, NumberOfPositions = 1, BasicSalary = 1250000m, TravelAllowance = 180000m, CellphoneAllowance = 36000m, MedicalContribution = 48000m, OtherBenefits = 24000m, TotalRemuneration = 1538000m, AnticipatedIncreasePercent = 4.5m, AdjustedTotalRemuneration = 1607210m, GazettedUpperLimit = 1650000m, FinancialYearId = fy.Id, ScoaItemCode = "3100" },
            new CouncillorPosition { PositionTitle = "Speaker", CouncillorType = CouncillorType.FullTime, NumberOfPositions = 1, BasicSalary = 1100000m, TravelAllowance = 150000m, CellphoneAllowance = 30000m, MedicalContribution = 48000m, OtherBenefits = 18000m, TotalRemuneration = 1346000m, AnticipatedIncreasePercent = 4.5m, AdjustedTotalRemuneration = 1406570m, GazettedUpperLimit = 1450000m, FinancialYearId = fy.Id, ScoaItemCode = "3100" },
            new CouncillorPosition { PositionTitle = "Mayoral Committee Member", CouncillorType = CouncillorType.FullTime, NumberOfPositions = 6, BasicSalary = 950000m, TravelAllowance = 120000m, CellphoneAllowance = 24000m, MedicalContribution = 48000m, OtherBenefits = 12000m, TotalRemuneration = 1154000m, AnticipatedIncreasePercent = 4.5m, AdjustedTotalRemuneration = 1205930m, GazettedUpperLimit = 1250000m, FinancialYearId = fy.Id, ScoaItemCode = "3100" },
            new CouncillorPosition { PositionTitle = "Ward Councillor", CouncillorType = CouncillorType.PartTime, NumberOfPositions = 30, BasicSalary = 420000m, TravelAllowance = 60000m, CellphoneAllowance = 12000m, MedicalContribution = 0m, OtherBenefits = 0m, TotalRemuneration = 492000m, AnticipatedIncreasePercent = 4.5m, AdjustedTotalRemuneration = 514140m, GazettedUpperLimit = 550000m, FinancialYearId = fy.Id, ScoaItemCode = "3100" },
            new CouncillorPosition { PositionTitle = "Proportional Representative Councillor", CouncillorType = CouncillorType.PartTime, NumberOfPositions = 29, BasicSalary = 380000m, TravelAllowance = 48000m, CellphoneAllowance = 12000m, MedicalContribution = 0m, OtherBenefits = 0m, TotalRemuneration = 440000m, AnticipatedIncreasePercent = 4.5m, AdjustedTotalRemuneration = 459800m, GazettedUpperLimit = 500000m, FinancialYearId = fy.Id, ScoaItemCode = "3100" }
        );

        for (int w = 1; w <= 30; w++)
        {
            db.WardCommitteeBudgets.Add(new WardCommitteeBudget
            {
                WardNumber = w,
                WardName = $"Ward {w}",
                Region = w <= 10 ? "Region A" : w <= 20 ? "Region B" : "Region C",
                NumberOfMembers = 10,
                NumberOfMeetings = 12,
                RatePerMeeting = 650m,
                AnticipatedRateIncreasePercent = 5m,
                AdjustedRatePerMeeting = 682.50m,
                TotalEstimatedCost = 81900m,
                FinancialYearId = fy.Id,
                ScoaItemCode = "3100",
                ScoaFundCode = "CF",
                ScoaFunctionCode = "GOVN",
                ScoaRegionCode = w <= 10 ? "REG-A" : w <= 20 ? "REG-B" : "REG-C"
            });
        }

        foreach (var dept in departments.Take(6))
        {
            db.VariableBenefitHours.AddRange(
                new VariableBenefitHours { Department = dept, BenefitType = VariableBenefitType.Overtime, EstimatedHours = 1200 + new Random(dept.GetHashCode()).Next(0, 800), AverageRate = 180m, CalculatedCost = 0, HistoricalHours = 1100, HistoricalCost = 198000m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
                new VariableBenefitHours { Department = dept, BenefitType = VariableBenefitType.Standby, EstimatedHours = 600 + new Random(dept.GetHashCode() + 1).Next(0, 400), AverageRate = 95m, CalculatedCost = 0, HistoricalHours = 580, HistoricalCost = 55100m, FinancialYearId = fy.Id, ScoaItemCode = "3000" }
            );
        }

        foreach (var vb in db.VariableBenefitHours.Local)
        {
            vb.CalculatedCost = vb.EstimatedHours * vb.AverageRate;
            vb.VariancePercent = vb.HistoricalCost > 0 ? Math.Round((vb.CalculatedCost - vb.HistoricalCost.Value) / vb.HistoricalCost.Value * 100, 2) : 0;
        }

        db.TravelRequirements.AddRange(
            new TravelRequirement { Department = "Finance", ProjectReference = "AUD-001", Destination = "National Treasury, Pretoria", PurposeOfTravel = "Budget submission and NT engagement", NumberOfOfficials = 3, NumberOfTrips = 4, EstimatedKilometres = 0, AccommodationNights = 8, TravelDuration = 8, TransportMode = TransportMode.Flight, EstimatedCost = 96000m, FinancialYearId = fy.Id, ScoaItemCode = "3000", ScoaFundCode = "CF" },
            new TravelRequirement { Department = "Infrastructure & Engineering", ProjectReference = "MIG-002", Destination = "Various project sites", PurposeOfTravel = "Project inspections and oversight", NumberOfOfficials = 2, NumberOfTrips = 24, EstimatedKilometres = 12000, AccommodationNights = 0, TravelDuration = 24, TransportMode = TransportMode.OwnVehicle, EstimatedCost = 55680m, FinancialYearId = fy.Id, ScoaItemCode = "3000", ScoaFundCode = "CF" },
            new TravelRequirement { Department = "Corporate Services", ProjectReference = "HR-003", Destination = "SALGA Conference, Durban", PurposeOfTravel = "HR conference and training", NumberOfOfficials = 2, NumberOfTrips = 2, EstimatedKilometres = 0, AccommodationNights = 6, TravelDuration = 6, TransportMode = TransportMode.Flight, EstimatedCost = 42000m, FinancialYearId = fy.Id, ScoaItemCode = "3000", ScoaFundCode = "CF" }
        );

        db.PerformanceBonuses.AddRange(
            new PerformanceBonus { Department = "Municipal Manager", EmployeeCategory = "Senior Management", BonusPercentage = 14m, QualifyingEmployees = 2, AverageSalary = 620000m, EstimatedTotalCost = 173600m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new PerformanceBonus { Department = "Finance", EmployeeCategory = "Senior Management", BonusPercentage = 14m, QualifyingEmployees = 1, AverageSalary = 570000m, EstimatedTotalCost = 79800m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new PerformanceBonus { Department = "Infrastructure & Engineering", EmployeeCategory = "Professional", BonusPercentage = 10m, QualifyingEmployees = 3, AverageSalary = 450000m, EstimatedTotalCost = 135000m, FinancialYearId = fy.Id, ScoaItemCode = "3000" }
        );

        db.DefinedBenefitObligations.AddRange(
            new DefinedBenefitObligation { BenefitType = DboBenefitType.PostRetirementMedical, OpeningBalance = 45000000m, ServiceCost = 3200000m, InterestCost = 4500000m, BenefitPayments = 2800000m, ActuarialGainLoss = -1200000m, ClosingBalance = 48700000m, CurrentPortion = 2800000m, NonCurrentPortion = 45900000m, DiscountRate = 0.098m, InflationRate = 0.052m, SalaryGrowthRate = 0.06m, MortalityRate = 0.005m, TurnoverRate = 0.08m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new DefinedBenefitObligation { BenefitType = DboBenefitType.LongServiceAward, OpeningBalance = 8500000m, ServiceCost = 850000m, InterestCost = 850000m, BenefitPayments = 450000m, ActuarialGainLoss = -200000m, ClosingBalance = 9550000m, CurrentPortion = 450000m, NonCurrentPortion = 9100000m, DiscountRate = 0.098m, InflationRate = 0.052m, SalaryGrowthRate = 0.06m, TurnoverRate = 0.08m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new DefinedBenefitObligation { BenefitType = DboBenefitType.PensionTopUp, OpeningBalance = 12000000m, ServiceCost = 1100000m, InterestCost = 1200000m, BenefitPayments = 800000m, ActuarialGainLoss = -350000m, ClosingBalance = 13150000m, CurrentPortion = 800000m, NonCurrentPortion = 12350000m, DiscountRate = 0.098m, InflationRate = 0.052m, SalaryGrowthRate = 0.06m, FinancialYearId = fy.Id, ScoaItemCode = "3000" }
        );

        db.LongServiceAwards.AddRange(
            new LongServiceAward { Department = "Corporate Services", MilestoneYears = 10, BenefitAmount = 5000m, EligibleEmployees = 8, EstimatedPayments = 40000m, CurrentPortion = 40000m, NonCurrentPortion = 0m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new LongServiceAward { Department = "Infrastructure & Engineering", MilestoneYears = 20, BenefitAmount = 15000m, EligibleEmployees = 4, EstimatedPayments = 60000m, CurrentPortion = 60000m, NonCurrentPortion = 0m, FinancialYearId = fy.Id, ScoaItemCode = "3000" },
            new LongServiceAward { Department = "Finance", MilestoneYears = 30, BenefitAmount = 30000m, EligibleEmployees = 2, EstimatedPayments = 60000m, CurrentPortion = 60000m, NonCurrentPortion = 0m, FinancialYearId = fy.Id, ScoaItemCode = "3000" }
        );

        db.PayrollScenarios.AddRange(
            new PayrollScenario { Name = "Baseline - Current Structure", Description = "Current post establishment with 5.2% salary increase", SalaryIncreasePercent = 5.2m, VacancyFillingPercent = 100m, BenefitAdjustmentPercent = 0m, Status = HrBudgetStatus.Draft, FinancialYearId = fy.Id },
            new PayrollScenario { Name = "Conservative - Freeze Vacancies", Description = "Current filled posts only, no new appointments", SalaryIncreasePercent = 5.2m, VacancyFillingPercent = 0m, BenefitAdjustmentPercent = 0m, OvertimeAdjustmentPercent = -10m, TravelAdjustmentPercent = -15m, Status = HrBudgetStatus.Draft, FinancialYearId = fy.Id },
            new PayrollScenario { Name = "Growth - Fill Critical Posts", Description = "Fill high-priority vacancies with 6% increase", SalaryIncreasePercent = 6m, VacancyFillingPercent = 60m, BenefitAdjustmentPercent = 5m, Status = HrBudgetStatus.Draft, FinancialYearId = fy.Id }
        );

        await db.SaveChangesAsync();
    }
}
