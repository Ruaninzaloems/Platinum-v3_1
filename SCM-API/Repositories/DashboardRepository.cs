using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DashboardRepository> _logger;

    public DashboardRepository(ApplicationDbContext context, ILogger<DashboardRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<object> GetDashboardStatsAsync(string financialYear)
    {
        var requisitionCount = await _context.Requisitions.CountAsync(r => r.Enabled == true && r.FinancialYear == financialYear);
        var orderCount = await _context.Orders.CountAsync(o => o.Enabled == true && o.FinancialYear == financialYear);
        var invoiceCount = await _context.Invoices.CountAsync(i => i.Enabled == true && i.FinancialYear == financialYear);
        var tenderCount = await _context.Tenders.CountAsync(t => t.Enabled == true && t.FinancialYear == financialYear);
        var vendorCount = await _context.Vendors.CountAsync(v => v.Enabled == true);
        var contractCount = await _context.ContractDetails.CountAsync(c => c.Enabled == true);

        return new
        {
            Requisitions = new { Total = requisitionCount },
            Orders = new { Total = orderCount },
            Invoices = new { Total = invoiceCount },
            Tenders = new { Total = tenderCount },
            Vendors = new { Total = vendorCount },
            Contracts = new { Total = contractCount },
            FinancialYear = financialYear
        };
    }

    public async Task<object> GetRequisitionStatsAsync(string financialYear)
    {
        var query = _context.Requisitions.Where(r => r.Enabled == true && r.FinancialYear == financialYear);
        var total = await query.CountAsync();
        var draft = await query.CountAsync(r => r.SavedStatusId == 1);
        var submitted = await query.CountAsync(r => r.SavedStatusId == 3);
        var approved = await query.CountAsync(r => r.FinalApproved == true);
        var rejected = await query.CountAsync(r => r.Rejected == true);

        return new { Total = total, Draft = draft, Submitted = submitted, Approved = approved, Rejected = rejected };
    }

    public async Task<object> GetOrderStatsAsync(string financialYear)
    {
        var query = _context.Orders.Where(o => o.Enabled == true && o.FinancialYear == financialYear);
        var total = await query.CountAsync();
        var pending = await query.CountAsync(o => o.StatusId == 1);
        var approved = await query.CountAsync(o => o.ApproveStatus == 1);
        var voided = await query.CountAsync(o => o.IsVoid == true);

        return new { Total = total, Pending = pending, Approved = approved, Voided = voided };
    }

    public async Task<object> GetInvoiceStatsAsync(string financialYear)
    {
        var query = _context.Invoices.Where(i => i.Enabled == true && i.FinancialYear == financialYear);
        var total = await query.CountAsync();
        var totalValue = await query.SumAsync(i => i.CalculatedInvoiceAmount ?? 0);

        return new { Total = total, TotalValue = totalValue };
    }

    public async Task<object> GetPaymentStatsAsync(string financialYear)
    {
        var total = await _context.PaymentHeaders.CountAsync(p => p.Enabled == true && p.FinancialYear == financialYear);
        return new { Total = total };
    }

    public async Task<object> GetTenderStatsAsync(string financialYear)
    {
        var query = _context.Tenders.Where(t => t.Enabled == true && t.FinancialYear == financialYear);
        var total = await query.CountAsync();
        var cancelled = await query.CountAsync(t => t.TenderCancel == true);
        return new { Total = total, Cancelled = cancelled, Active = total - cancelled };
    }

    public async Task<object> GetContractStatsAsync(string financialYear)
    {
        var total = await _context.ContractDetails.CountAsync(c => c.Enabled == true);
        return new { Total = total };
    }

    public async Task<object> GetVendorStatsAsync(string financialYear)
    {
        var total = await _context.Vendors.CountAsync(v => v.Enabled == true);
        var active = await _context.Vendors.CountAsync(v => v.Enabled == true && v.Status == 1);
        return new { Total = total, Active = active };
    }
}
