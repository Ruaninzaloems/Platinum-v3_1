using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class ConfigRepository : Repository<ConfigSetting>, IConfigRepository
{
    public ConfigRepository(ApplicationDbContext context, ILogger<ConfigRepository> logger) : base(context, logger) { }

    public async Task<IEnumerable<Department>> GetDepartmentsAsync()
        => await _context.Departments.Where(d => d.Enabled == true).OrderBy(d => d.DepartmentDesc).ToListAsync();

    public async Task<IEnumerable<Division>> GetDivisionsAsync(int? departmentId = null)
    {
        var query = _context.Divisions.Where(d => d.Enabled == true);
        if (departmentId.HasValue) query = query.Where(d => d.DepartmentId == departmentId.Value);
        return await query.OrderBy(d => d.DivisionDesc).ToListAsync();
    }

    public async Task<IEnumerable<Employee>> GetEmployeesAsync(int? departmentId = null)
    {
        var query = _context.Employees.Where(e => e.Enabled == true);
        if (departmentId.HasValue) query = query.Where(e => e.DepartmentId == departmentId.Value);
        return await query.OrderBy(e => e.Surname).ThenBy(e => e.FirstName).ToListAsync();
    }

    public async Task<IEnumerable<Store>> GetStoresAsync()
        => await _context.Stores.Where(s => s.Enabled == true).OrderBy(s => s.StoreName).ToListAsync();

    public async Task<IEnumerable<FinancialYear>> GetFinancialYearsAsync()
        => await _context.FinancialYears.OrderByDescending(f => f.FinancialYearName).ToListAsync();

    public async Task<IEnumerable<Bank>> GetBanksAsync()
        => await _context.Banks.Where(b => b.Enabled == true).OrderBy(b => b.BankName).ToListAsync();

    public async Task<IEnumerable<ScmVendorStatus>> GetVendorStatusesAsync()
        => await _context.ScmVendorStatuses.Where(s => s.Enabled == true).ToListAsync();

    public async Task<IEnumerable<ProcessBoundary>> GetProcessBoundariesAsync()
        => await _context.ProcessBoundaries.Where(p => p.Enabled == true).OrderBy(p => p.RangeFrom).ToListAsync();

    public async Task<IEnumerable<Vote>> GetVotesAsync()
        => await _context.Votes.Where(v => v.Enabled == true).OrderBy(v => v.VoteNumber).ToListAsync();

    public async Task<ConfigSetting?> GetByKeyAsync(string keyName)
        => await _dbSet.FirstOrDefaultAsync(c => c.KeyName == keyName);
}
