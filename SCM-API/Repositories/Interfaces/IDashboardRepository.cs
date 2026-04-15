namespace SCM_API.Repositories.Interfaces;

public interface IDashboardRepository
{
    Task<object> GetDashboardStatsAsync(string financialYear);
    Task<object> GetRequisitionStatsAsync(string financialYear);
    Task<object> GetOrderStatsAsync(string financialYear);
    Task<object> GetInvoiceStatsAsync(string financialYear);
    Task<object> GetPaymentStatsAsync(string financialYear);
    Task<object> GetTenderStatsAsync(string financialYear);
    Task<object> GetContractStatsAsync(string financialYear);
    Task<object> GetVendorStatsAsync(string financialYear);
}
