using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class VendorRepository : Repository<Vendor>, IVendorRepository
{
    public VendorRepository(ApplicationDbContext context, ILogger<VendorRepository> logger) : base(context, logger) { }

    public async Task<Vendor?> GetWithDetailsAsync(int id)
    {
        return await _context.Vendors
            .Include(v => v.BankingDetails)
            .Include(v => v.ContactDetails)
            .Include(v => v.Owners)
            .FirstOrDefaultAsync(v => v.VendorId == id);
    }

    public async Task<PagedResult<Vendor>> GetFilteredAsync(
        string? search, int? statusId, int page, int pageSize)
    {
        var query = _context.Vendors.Where(v => v.Enabled == true);

        if (statusId.HasValue)
            query = query.Where(v => v.Status == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(v => v.VendorName!.Contains(search) || v.TradingName!.Contains(search) || v.CsdSupplierNumber!.Contains(search));

        query = query.OrderBy(v => v.VendorName);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<IEnumerable<VendorBankingDetail>> GetBankDetailsAsync(int vendorId)
    {
        return await _context.VendorBankingDetails
            .Where(b => b.VendorId == vendorId)
            .ToListAsync();
    }

    public async Task<IEnumerable<VendorOwner>> GetDirectorsAsync(int vendorId)
    {
        return await _context.VendorOwners
            .Where(o => o.VendorId == vendorId)
            .ToListAsync();
    }
}
