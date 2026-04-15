using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(ApplicationDbContext context, ILogger<OrderRepository> logger) : base(context, logger) { }

    public async Task<Order?> GetWithDetailsAsync(int id)
    {
        return await _context.Orders
            .Include(o => o.OrderDetails)
            .Include(o => o.OrderDocuments)
            .Include(o => o.SplitDetails)
            .Include(o => o.Vendor)
            .FirstOrDefaultAsync(o => o.OrderId == id);
    }

    public async Task<PagedResult<Order>> GetFilteredAsync(
        string? financialYear, int? statusId, int? vendorId, string? search, int page, int pageSize)
    {
        var query = _context.Orders.Where(o => o.Enabled == true);

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(o => o.FinancialYear == financialYear);
        if (statusId.HasValue)
            query = query.Where(o => o.StatusId == statusId.Value);
        if (vendorId.HasValue)
            query = query.Where(o => o.VendorId == vendorId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(o => o.OrderNumber!.Contains(search) || o.Comments!.Contains(search));

        query = query.OrderByDescending(o => o.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<OrderTypeDetail>> GetOrderDetailsAsync(int orderId)
    {
        return await _context.OrderTypeDetails
            .Where(d => d.OrderId == orderId)
            .ToListAsync();
    }
}
