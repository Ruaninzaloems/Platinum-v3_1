using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;

namespace SCM_API.Repositories;

public class AuthRepository : Repository<User>, IAuthRepository
{
    public AuthRepository(ApplicationDbContext context, ILogger<AuthRepository> logger) : base(context, logger) { }

    public async Task<User?> GetByUserNameAsync(string userName)
    {
        return await _dbSet
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                u.UserName == userName
                && u.Enabled
                && (u.EndDate == null || u.EndDate > DateTime.UtcNow));
    }

    public async Task UpdateLastLoginAsync(int userId)
    {
        var user = await _dbSet.FindAsync(userId);
        if (user != null)
        {
            user.LastLoginDate = DateTime.UtcNow;
            user.TotalLogin = (user.TotalLogin ?? 0) + 1;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<string>> GetUserRolesAsync(int userId)
    {
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId
                && (ur.DelegationExpiry == null || ur.DelegationExpiry > DateTime.UtcNow))
            .Join(_context.Set<SysRoleName>(),
                ur => ur.RoleId,
                r => r.RoleId,
                (ur, r) => r.RoleDesc)
            .ToListAsync();
    }

    public async Task<decimal> GetMaxDelegationLimitAsync(int userId)
    {
        var maxVal = await _context.UserTransactionAuthorizations
            .Where(ta => ta.UserId == userId && ta.ScmTransactionTypeId != null)
            .Select(ta => (decimal?)ta.MaxValue)
            .MaxAsync();
        return maxVal ?? 0m;
    }

    public async Task<string?> GetDepartmentNameAsync(int departmentId)
    {
        var dept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentId == departmentId);
        return dept?.DepartmentDesc;
    }
}
