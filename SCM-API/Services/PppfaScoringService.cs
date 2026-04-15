using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;

namespace SCM_API.Services;

public interface IPppfaScoringService
{
    Task<PppfaResult> ScoreVendorsAsync(decimal contractValue, List<VendorQuoteInput> vendorQuotes);
    PppfaResult ScoreVendors(decimal contractValue, List<VendorQuoteInput> vendorQuotes);
    Task<ComparativeSchedule> GenerateComparativeScheduleAsync(int quotationId, decimal contractValue, List<VendorQuoteInput> vendorQuotes);
}

public class VendorQuoteInput
{
    public string VendorId { get; set; } = "";
    public string VendorName { get; set; } = "";
    public int BbbeeLevel { get; set; } = 8;
    public decimal QuotedAmount { get; set; }
    public bool IsCompliant { get; set; } = true;
    public bool TaxCompliant { get; set; } = true;
    public int DeliveryDays { get; set; }
    public decimal FunctionalityScore { get; set; }
}

public class PppfaResult
{
    public string Formula { get; set; } = "";
    public int PriceWeight { get; set; }
    public int BeeWeight { get; set; }
    public decimal ContractValue { get; set; }
    public List<VendorScore> Scores { get; set; } = new();
    public string RecommendedVendorId { get; set; } = "";
    public string RecommendedVendorName { get; set; } = "";
}

public class VendorScore
{
    public string VendorId { get; set; } = "";
    public string VendorName { get; set; } = "";
    public decimal QuotedAmount { get; set; }
    public int BbbeeLevel { get; set; }
    public decimal PricePoints { get; set; }
    public decimal BeePoints { get; set; }
    public decimal TotalPoints { get; set; }
    public int Rank { get; set; }
    public bool IsRecommended { get; set; }
    public bool IsCompliant { get; set; }
    public bool TaxCompliant { get; set; }
    public string DisqualificationReason { get; set; } = "";
}

public class ComparativeSchedule
{
    public int QuotationId { get; set; }
    public string Formula { get; set; } = "";
    public int PriceWeight { get; set; }
    public int BeeWeight { get; set; }
    public decimal ContractValue { get; set; }
    public int TotalVendors { get; set; }
    public int CompliantVendors { get; set; }
    public int DisqualifiedVendors { get; set; }
    public bool DeviationRequired { get; set; }
    public string? DeviationReason { get; set; }
    public List<VendorScore> Vendors { get; set; } = new();
    public DateTime GeneratedDate { get; set; } = DateTime.UtcNow;
}

public class PppfaScoringService : IPppfaScoringService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<PppfaScoringService> _logger;

    private static readonly Dictionary<int, decimal> BbbeePoints8020 = new()
    {
        { 1, 20m }, { 2, 18m }, { 3, 14m }, { 4, 12m },
        { 5, 8m }, { 6, 6m }, { 7, 4m }, { 8, 2m }
    };

    private static readonly Dictionary<int, decimal> BbbeePoints9010 = new()
    {
        { 1, 10m }, { 2, 9m }, { 3, 6m }, { 4, 5m },
        { 5, 4m }, { 6, 3m }, { 7, 2m }, { 8, 1m }
    };

    public PppfaScoringService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<PppfaScoringService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    public async Task<PppfaResult> ScoreVendorsAsync(decimal contractValue, List<VendorQuoteInput> vendorQuotes)
    {
        var thresholds = await LoadThresholdsAsync();
        var (priceWeight, beeWeight) = DetermineWeights(contractValue, thresholds);
        return CalculateScores(contractValue, vendorQuotes, priceWeight, beeWeight);
    }

    public PppfaResult ScoreVendors(decimal contractValue, List<VendorQuoteInput> vendorQuotes)
    {
        var (priceWeight, beeWeight) = DetermineWeightsDefault(contractValue);
        return CalculateScores(contractValue, vendorQuotes, priceWeight, beeWeight);
    }

    public async Task<ComparativeSchedule> GenerateComparativeScheduleAsync(int quotationId, decimal contractValue, List<VendorQuoteInput> vendorQuotes)
    {
        var result = await ScoreVendorsAsync(contractValue, vendorQuotes);
        var compliantCount = result.Scores.Count(s => s.IsCompliant && s.TaxCompliant);
        var disqualifiedCount = result.Scores.Count(s => !s.IsCompliant || !s.TaxCompliant);
        var deviationRequired = compliantCount < 3;

        return new ComparativeSchedule
        {
            QuotationId = quotationId,
            Formula = result.Formula,
            PriceWeight = result.PriceWeight,
            BeeWeight = result.BeeWeight,
            ContractValue = contractValue,
            TotalVendors = vendorQuotes.Count,
            CompliantVendors = compliantCount,
            DisqualifiedVendors = disqualifiedCount,
            DeviationRequired = deviationRequired,
            DeviationReason = deviationRequired ? $"Only {compliantCount} compliant quote(s) received. MFMA regulation requires minimum 3 quotes. Deviation approval from Accounting Officer required." : null,
            Vendors = result.Scores,
            GeneratedDate = DateTime.UtcNow
        };
    }

    private async Task<List<ScmPreferencePointThreshold>> LoadThresholdsAsync()
    {
        if (_dbChecker.IsDbAvailable)
        {
            try
            {
                return await _context.ScmPreferencePointThresholds
                    .Where(t => t.Enabled == true)
                    .OrderBy(t => t.Minimum)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load PPPFA thresholds from DB");
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<ScmPreferencePointThreshold>();
    }

    private (int priceWeight, int beeWeight) DetermineWeights(decimal contractValue, List<ScmPreferencePointThreshold> thresholds)
    {
        if (thresholds.Count > 0)
        {
            var matched = thresholds.FirstOrDefault(t => contractValue >= t.Minimum && contractValue <= t.Maximum);
            if (matched != null)
                return (matched.PricePercent, matched.BeePercent);
        }
        return DetermineWeightsDefault(contractValue);
    }

    private static (int priceWeight, int beeWeight) DetermineWeightsDefault(decimal contractValue)
    {
        return contractValue > 50_000_000m ? (90, 10) : (80, 20);
    }

    private PppfaResult CalculateScores(decimal contractValue, List<VendorQuoteInput> vendorQuotes, int priceWeight, int beeWeight)
    {
        var formula = priceWeight == 90 ? "90/10" : "80/20";
        var bbbeeTable = priceWeight == 90 ? BbbeePoints9010 : BbbeePoints8020;
        var compliantQuotes = vendorQuotes.Where(v => v.IsCompliant && v.TaxCompliant).ToList();
        var lowestPrice = compliantQuotes.Count > 0 ? compliantQuotes.Min(v => v.QuotedAmount) : 0m;

        var scores = vendorQuotes.Select(v =>
        {
            var score = new VendorScore
            {
                VendorId = v.VendorId,
                VendorName = v.VendorName,
                QuotedAmount = v.QuotedAmount,
                BbbeeLevel = v.BbbeeLevel,
                IsCompliant = v.IsCompliant,
                TaxCompliant = v.TaxCompliant
            };

            if (!v.IsCompliant)
            {
                score.DisqualificationReason = "Non-compliant bid";
                return score;
            }
            if (!v.TaxCompliant)
            {
                score.DisqualificationReason = "Tax non-compliant (CSD status invalid)";
                return score;
            }

            if (lowestPrice > 0 && v.QuotedAmount > 0)
                score.PricePoints = Math.Round(priceWeight * (1m - ((v.QuotedAmount - lowestPrice) / lowestPrice)), 2);
            else
                score.PricePoints = priceWeight;

            if (score.PricePoints < 0) score.PricePoints = 0;

            var bbbeeLevel = Math.Clamp(v.BbbeeLevel, 1, 8);
            score.BeePoints = bbbeeTable.GetValueOrDefault(bbbeeLevel, 0);
            score.TotalPoints = Math.Round(score.PricePoints + score.BeePoints, 2);

            return score;
        }).ToList();

        var ranked = scores
            .Where(s => s.IsCompliant && s.TaxCompliant)
            .OrderByDescending(s => s.TotalPoints)
            .ThenBy(s => s.QuotedAmount)
            .ToList();

        for (int i = 0; i < ranked.Count; i++)
        {
            ranked[i].Rank = i + 1;
            ranked[i].IsRecommended = i == 0;
        }

        var disqualified = scores.Where(s => !s.IsCompliant || !s.TaxCompliant).ToList();
        foreach (var dq in disqualified) dq.Rank = 0;

        return new PppfaResult
        {
            Formula = formula,
            PriceWeight = priceWeight,
            BeeWeight = beeWeight,
            ContractValue = contractValue,
            Scores = ranked.Concat(disqualified).ToList(),
            RecommendedVendorId = ranked.FirstOrDefault()?.VendorId ?? "",
            RecommendedVendorName = ranked.FirstOrDefault()?.VendorName ?? ""
        };
    }
}
