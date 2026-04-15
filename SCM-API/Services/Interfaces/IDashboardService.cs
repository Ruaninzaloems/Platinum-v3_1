namespace SCM_API.Services.Interfaces;

public interface IDashboardService
{
    Task<object> GetDashboardStatsAsync(string? financialYear);
    Task<object> GetExecutiveDashboardAsync(string? financialYear);
    Task<object> GetComplianceDashboardAsync(string? financialYear);
    Task<object> GetOperationalDashboardAsync(string? financialYear);
    Task<object> GetControlTowerDashboardAsync(string? financialYear);
    Task<object> GetAiInsightsAsync(string? financialYear);
    Task<object> GetRequisitionStatsAsync(string? financialYear);
    Task<object> GetOrderStatsAsync(string? financialYear);
    Task<object> GetInvoiceStatsAsync(string? financialYear);
    Task<object> GetPaymentStatsAsync(string? financialYear);
    Task<object> GetTenderStatsAsync(string? financialYear);
    Task<object> GetContractStatsAsync(string? financialYear);
    Task<object> GetVendorStatsAsync(string? financialYear);
    Task<object> GetBudgetUtilizationAsync(string? financialYear);
    Task<object> GetProcurementSummaryAsync(string? financialYear);
}
