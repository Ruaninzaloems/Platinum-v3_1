using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class HrPayrollBudgetStringService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public HrPayrollBudgetStringService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<GenerateBudgetStringsResultDto> GenerateBudgetStrings(int budgetVersionId, int financialYearId)
    {
        var version = await _db.BudgetVersions.FindAsync(budgetVersionId);
        if (version == null) throw new ArgumentException("Budget version not found");

        var budgetLines = await _db.PayrollBudgetLines
            .Where(l => l.FinancialYearId == financialYearId && l.Status == HrBudgetStatus.Approved)
            .ToListAsync();

        var scoaProjectOpex = await _db.ScoaProjects.FirstOrDefaultAsync(p => p.Code == "OPEX");
        var scoaMscGen = await _db.ScoaMscs.FirstOrDefaultAsync(m => m.Code == "GEN");

        var existingStrings = await _db.BudgetStrings
            .Where(bs => bs.BudgetVersionId == budgetVersionId && bs.SourceModule == SourceModule.HRPB)
            .ToListAsync();

        int generated = 0, updated = 0;
        var warnings = new List<string>();

        var scoaItems = await _db.ScoaItems.ToListAsync();
        var scoaFunds = await _db.ScoaFunds.ToListAsync();
        var scoaFunctions = await _db.ScoaFunctions.ToListAsync();
        var scoaRegions = await _db.ScoaRegions.ToListAsync();
        var scoaCostings = await _db.ScoaCostings.ToListAsync();

        foreach (var line in budgetLines)
        {
            var scoaItem = !string.IsNullOrEmpty(line.ScoaItemCode)
                ? scoaItems.FirstOrDefault(s => s.Code == line.ScoaItemCode)
                : null;
            var scoaFund = !string.IsNullOrEmpty(line.ScoaFundCode)
                ? scoaFunds.FirstOrDefault(s => s.Code == line.ScoaFundCode)
                : null;
            var scoaFunction = !string.IsNullOrEmpty(line.ScoaFunctionCode)
                ? scoaFunctions.FirstOrDefault(s => s.Code == line.ScoaFunctionCode)
                : null;
            var scoaRegion = !string.IsNullOrEmpty(line.ScoaRegionCode)
                ? scoaRegions.FirstOrDefault(s => s.Code == line.ScoaRegionCode)
                : null;
            var scoaCosting = !string.IsNullOrEmpty(line.ScoaCostingCode)
                ? scoaCostings.FirstOrDefault(s => s.Code == line.ScoaCostingCode)
                : null;

            if (scoaItem == null || scoaFund == null || scoaFunction == null)
            {
                warnings.Add($"Skipped budget line {line.Id}: missing required mSCOA segments (Item/Fund/Function)");
                continue;
            }

            var existing = existingStrings.FirstOrDefault(bs =>
                bs.ScoaItemId == scoaItem.Id &&
                bs.ScoaFundId == scoaFund.Id &&
                bs.ScoaFunctionId == scoaFunction.Id);

            if (existing != null)
            {
                existing.Year1Amount = line.Year1Amount;
                existing.Year2Amount = line.Year2Amount;
                existing.Year3Amount = line.Year3Amount;
                existing.Month01 = line.Month01; existing.Month02 = line.Month02; existing.Month03 = line.Month03;
                existing.Month04 = line.Month04; existing.Month05 = line.Month05; existing.Month06 = line.Month06;
                existing.Month07 = line.Month07; existing.Month08 = line.Month08; existing.Month09 = line.Month09;
                existing.Month10 = line.Month10; existing.Month11 = line.Month11; existing.Month12 = line.Month12;
                existing.ModifiedBy = "HrPayrollBudget";
                existing.ModifiedOn = DateTime.UtcNow;
                updated++;
            }
            else
            {
                var bs = new BudgetString
                {
                    BudgetVersionId = budgetVersionId,
                    SourceModule = SourceModule.HRPB,
                    ScoaItemId = scoaItem.Id,
                    ScoaFundId = scoaFund.Id,
                    ScoaFunctionId = scoaFunction.Id,
                    ScoaProjectId = scoaProjectOpex?.Id ?? 1,
                    ScoaRegionId = scoaRegion?.Id ?? 1,
                    ScoaCostingId = scoaCosting?.Id ?? 1,
                    ScoaMscId = scoaMscGen?.Id ?? 1,
                    Year1Amount = line.Year1Amount,
                    Year2Amount = line.Year2Amount,
                    Year3Amount = line.Year3Amount,
                    Month01 = line.Month01, Month02 = line.Month02, Month03 = line.Month03,
                    Month04 = line.Month04, Month05 = line.Month05, Month06 = line.Month06,
                    Month07 = line.Month07, Month08 = line.Month08, Month09 = line.Month09,
                    Month10 = line.Month10, Month11 = line.Month11, Month12 = line.Month12,
                    Description = $"HR Payroll Budget - {line.CostCategory} - {line.Department ?? "All"}",
                    OriginRefId = $"HRPB-{financialYearId}-{line.Id}",
                    CreatedBy = "HrPayrollBudget"
                };
                _db.BudgetStrings.Add(bs);
                generated++;
            }
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetString", budgetVersionId, "HrPayrollBudgetGenerated", "system", $"Generated {generated} new, updated {updated} HR payroll budget strings");

        return new GenerateBudgetStringsResultDto(generated, updated, warnings);
    }

    public async Task<MscoaValidationResultDto> ValidateMscoaStrings(int financialYearId)
    {
        var budgetLines = await _db.PayrollBudgetLines
            .Where(l => l.FinancialYearId == financialYearId)
            .ToListAsync();

        var posts = await _db.PostEstablishments
            .Where(p => p.FinancialYearId == financialYearId && p.IsActive)
            .ToListAsync();

        var councillors = await _db.CouncillorPositions
            .Where(c => c.FinancialYearId == financialYearId)
            .ToListAsync();

        var wards = await _db.WardCommitteeBudgets
            .Where(w => w.FinancialYearId == financialYearId)
            .ToListAsync();

        var scoaItems = await _db.ScoaItems.Select(s => s.Code).ToListAsync();
        var scoaFunds = await _db.ScoaFunds.Select(s => s.Code).ToListAsync();
        var scoaFunctions = await _db.ScoaFunctions.Select(s => s.Code).ToListAsync();

        var validationItems = new List<MscoaValidationItemDto>();

        foreach (var line in budgetLines)
        {
            var (status, message) = ValidateSegments(line.ScoaItemCode, line.ScoaFundCode, line.ScoaFunctionCode, scoaItems, scoaFunds, scoaFunctions);
            validationItems.Add(new MscoaValidationItemDto("PayrollBudgetLine", line.Id, line.ScoaItemCode, line.ScoaFundCode, line.ScoaFunctionCode, status, message));
        }

        foreach (var post in posts)
        {
            var (status, message) = ValidateSegments(post.ScoaItemCode, post.ScoaFundCode, post.ScoaFunctionCode, scoaItems, scoaFunds, scoaFunctions);
            validationItems.Add(new MscoaValidationItemDto("PostEstablishment", post.Id, post.ScoaItemCode, post.ScoaFundCode, post.ScoaFunctionCode, status, message));
        }

        foreach (var councillor in councillors)
        {
            var (status, message) = ValidateSegments(councillor.ScoaItemCode, councillor.ScoaFundCode, councillor.ScoaFunctionCode, scoaItems, scoaFunds, scoaFunctions);
            validationItems.Add(new MscoaValidationItemDto("CouncillorPosition", councillor.Id, councillor.ScoaItemCode, councillor.ScoaFundCode, councillor.ScoaFunctionCode, status, message));
        }

        foreach (var ward in wards)
        {
            var (status, message) = ValidateSegments(ward.ScoaItemCode, ward.ScoaFundCode, ward.ScoaFunctionCode, scoaItems, scoaFunds, scoaFunctions);
            validationItems.Add(new MscoaValidationItemDto("WardCommitteeBudget", ward.Id, ward.ScoaItemCode, ward.ScoaFundCode, ward.ScoaFunctionCode, status, message));
        }

        int valid = validationItems.Count(i => i.ValidationStatus == "Valid");
        int warning = validationItems.Count(i => i.ValidationStatus == "Warning");
        int error = validationItems.Count(i => i.ValidationStatus == "Error");

        await _audit.LogAsync("MscoaValidation", 0, "Validated", "system", $"Validated {validationItems.Count} strings: {valid} valid, {warning} warnings, {error} errors");

        return new MscoaValidationResultDto(validationItems.Count, valid, warning, error, validationItems);
    }

    private (string Status, string? Message) ValidateSegments(string? itemCode, string? fundCode, string? functionCode, List<string> validItems, List<string> validFunds, List<string> validFunctions)
    {
        var messages = new List<string>();

        if (string.IsNullOrEmpty(itemCode))
            messages.Add("Missing Item segment");
        else if (!validItems.Contains(itemCode))
            messages.Add($"Invalid Item code: {itemCode}");

        if (string.IsNullOrEmpty(fundCode))
            messages.Add("Missing Fund segment");
        else if (!validFunds.Contains(fundCode))
            messages.Add($"Invalid Fund code: {fundCode}");

        if (string.IsNullOrEmpty(functionCode))
            messages.Add("Missing Function segment");
        else if (!validFunctions.Contains(functionCode))
            messages.Add($"Invalid Function code: {functionCode}");

        if (messages.Any(m => m.StartsWith("Missing")))
            return ("Error", string.Join("; ", messages));
        if (messages.Any())
            return ("Warning", string.Join("; ", messages));

        return ("Valid", null);
    }
}
