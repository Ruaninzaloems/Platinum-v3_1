using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Extensions;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class VendorManagementRepository : IVendorManagementRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VendorManagementRepository> _logger;

    public VendorManagementRepository(ApplicationDbContext context, ILogger<VendorManagementRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<VendorRegistration?> GetRegistrationByIdAsync(int id)
    {
        return await _context.VendorRegistrations.FindAsync(id);
    }

    public async Task<VendorRegistration?> GetRegistrationWithDetailsAsync(int id)
    {
        return await _context.VendorRegistrations
            .Include(r => r.ShareHolders.Where(s => s.Enabled))
            .Include(r => r.BusinessAreas.Where(b => b.Enabled))
            .FirstOrDefaultAsync(r => r.VendorRegistrationId == id);
    }

    public async Task<PagedResult<VendorRegistration>> GetRegistrationsFilteredAsync(
        bool? status, string? search, int page, int pageSize)
    {
        var query = _context.VendorRegistrations.Where(r => r.Enabled);

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(r =>
                (r.CompanyName != null && r.CompanyName.ToLower().Contains(searchLower)) ||
                (r.TradingName != null && r.TradingName.ToLower().Contains(searchLower)) ||
                (r.ServiceProviderNumber != null && r.ServiceProviderNumber.ToLower().Contains(searchLower)) ||
                (r.ContactName != null && r.ContactName.ToLower().Contains(searchLower)));
        }

        query = query.OrderByDescending(r => r.DateCaptured);
        return await query.ToPagedResultAsync(page, pageSize);
    }

    public async Task<VendorRegistration> CreateRegistrationAsync(VendorRegistration registration)
    {
        _context.VendorRegistrations.Add(registration);
        await _context.SaveChangesAsync();
        return registration;
    }

    public async Task<bool> UpdateRegistrationAsync(VendorRegistration registration)
    {
        _context.VendorRegistrations.Update(registration);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<VendorDocumentDetail>> GetDocumentsByVendorIdAsync(int vendorId)
    {
        return await _context.VendorDocumentDetails
            .Where(d => d.VendorId == vendorId && d.Enabled)
            .OrderByDescending(d => d.DateCaptured)
            .ToListAsync();
    }

    public async Task<VendorDocumentDetail> CreateDocumentAsync(VendorDocumentDetail document)
    {
        _context.VendorDocumentDetails.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<IEnumerable<VendorShareHolderDetail>> GetShareHoldersByVendorIdAsync(int vendorId)
    {
        return await _context.VendorShareHolderDetails
            .Where(s => s.VendorId == vendorId && s.Enabled)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<VendorShareHolderDetail> CreateShareHolderAsync(VendorShareHolderDetail shareHolder)
    {
        _context.VendorShareHolderDetails.Add(shareHolder);
        await _context.SaveChangesAsync();
        return shareHolder;
    }

    public async Task<bool> RemoveShareHolderAsync(int shareHolderId)
    {
        var entity = await _context.VendorShareHolderDetails.FindAsync(shareHolderId);
        if (entity == null) return false;
        entity.Enabled = false;
        entity.DateModified = DateTime.UtcNow;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<VendorIssueRegister>> GetIssuesByVendorIdAsync(int vendorId)
    {
        return await _context.VendorIssueRegisters
            .Include(i => i.Details)
            .Where(i => i.VendorId == vendorId && i.Enabled)
            .OrderByDescending(i => i.LoggedDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<VendorBusinessArea>> GetBusinessAreasByVendorIdAsync(int vendorId)
    {
        return await _context.VendorBusinessAreas
            .Where(b => b.VendorId == vendorId && b.Enabled)
            .ToListAsync();
    }

    public async Task<IEnumerable<VendorProfessionalBody>> GetAccreditationsByVendorIdAsync(int vendorId)
    {
        return await _context.VendorProfessionalBodies
            .Where(p => p.VendorId == vendorId)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
