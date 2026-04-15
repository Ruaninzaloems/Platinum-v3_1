using SCM_API.Helpers;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class DashboardService : IDashboardService
{
    private readonly IDashboardRepository _repository;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(IDashboardRepository repository, ILogger<DashboardService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<object> GetDashboardStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetDashboardStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for dashboard stats, returning fallback"); return GetFallbackDashboardStats(fy); }
    }

    public async Task<object> GetExecutiveDashboardAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetDashboardStatsAsync(fy); }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for executive dashboard, returning fallback");
            return new
            {
                kpiCards = new[]
                {
                    new { id = "requisitions", label = "Active Requisitions", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() },
                    new { id = "orders", label = "Purchase Orders", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() },
                    new { id = "payments", label = "Payments Processed", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() },
                    new { id = "invoices", label = "Invoices Pending", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() },
                    new { id = "budget", label = "Budget Utilization", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() },
                    new { id = "compliance", label = "Compliance Score", value = 0, count = 0, total = 0, percentage = 0, trend = 0, trendDirection = "up", breakdown = new Dictionary<string, int>() }
                },
                lifecyclePipeline = Array.Empty<object>(),
                turnaroundTimes = Array.Empty<object>(),
                complianceScore = new { overall = 0, trend = 0, components = Array.Empty<object>() },
                recentTransactions = Array.Empty<object>()
            };
        }
    }

    public Task<object> GetComplianceDashboardAsync(string? financialYear)
    {
        return Task.FromResult<object>(new
        {
            uifw = new
            {
                unauthorized = new { amount = 0, count = 0, status = "None reported" },
                irregular = new { amount = 0, count = 0, status = "None reported" },
                fruitless = new { amount = 0, count = 0, status = "None reported" },
                cumulative = new { amount = 0, priorYears = false }
            },
            complianceGates = Array.Empty<object>(),
            segregationOfDuties = Array.Empty<object>(),
            fraudRiskIndicators = Array.Empty<object>()
        });
    }

    public Task<object> GetOperationalDashboardAsync(string? financialYear)
    {
        return Task.FromResult<object>(new
        {
            myWorkload = new
            {
                pendingApprovals = 0,
                myRequisitions = 0,
                grnToProcess = 0,
                invoicesToMatch = 0,
                contractsExpiring = 0,
                overdueItems = 0,
                items = Array.Empty<object>()
            },
            bottlenecks = Array.Empty<object>(),
            supplierScorecard = new { top5 = Array.Empty<object>(), bottom5 = Array.Empty<object>() },
            budgetCommitments = Array.Empty<object>(),
            spendAnalytics = new
            {
                byCategory = Array.Empty<object>(),
                byBbbeeLevel = Array.Empty<object>(),
                localVsNational = new { local = 0, national = 0 },
                monthlyTrend = Array.Empty<object>()
            }
        });
    }

    public Task<object> GetControlTowerDashboardAsync(string? financialYear)
    {
        return Task.FromResult<object>(new
        {
            attentionTiles = Array.Empty<object>(),
            agingHeatmap = new { stages = Array.Empty<string>(), buckets = Array.Empty<string>(), data = Array.Empty<int[]>() },
            blockingLeaderboard = Array.Empty<object>(),
            bottleneckFunnel = Array.Empty<object>(),
            escalationPanel = Array.Empty<object>()
        });
    }

    public Task<object> GetAiInsightsAsync(string? financialYear)
    {
        return Task.FromResult<object>(new { insights = Array.Empty<object>() });
    }

    public async Task<object> GetRequisitionStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetRequisitionStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for requisition stats"); return new { financialYear = fy, total = 0, pending = 0, approved = 0 }; }
    }

    public async Task<object> GetOrderStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetOrderStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for order stats"); return new { financialYear = fy, total = 0, pending = 0, completed = 0 }; }
    }

    public async Task<object> GetInvoiceStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetInvoiceStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for invoice stats"); return new { financialYear = fy, total = 0, pending = 0, paid = 0 }; }
    }

    public async Task<object> GetPaymentStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetPaymentStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for payment stats"); return new { financialYear = fy, total = 0, processed = 0 }; }
    }

    public async Task<object> GetTenderStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetTenderStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for tender stats"); return new { financialYear = fy, total = 0, active = 0 }; }
    }

    public async Task<object> GetContractStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetContractStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for contract stats"); return new { financialYear = fy, total = 0, active = 0 }; }
    }

    public async Task<object> GetVendorStatsAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        try { return await _repository.GetVendorStatsAsync(fy); }
        catch (Exception ex) { _logger.LogWarning(ex, "DB unavailable for vendor stats"); return new { financialYear = fy, total = 0, active = 0 }; }
    }

    public async Task<object> GetBudgetUtilizationAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        return new { FinancialYear = fy, TotalBudget = 0m, Utilized = 0m, Available = 0m, UtilizationPercentage = 0m };
    }

    public async Task<object> GetProcurementSummaryAsync(string? financialYear)
    {
        var fy = financialYear ?? FinancialYearHelper.GetCurrentFinancialYear();
        return new { FinancialYear = fy, TotalProcurement = 0, TotalValue = 0m };
    }

    private object GetFallbackDashboardStats(string fy) => new { financialYear = fy, totalRequisitions = 0, totalOrders = 0, totalInvoices = 0, totalPayments = 0 };
}
