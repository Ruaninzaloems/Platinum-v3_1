using SCM_API.Models.Domain;

namespace SCM_API.Repositories.Interfaces;

public interface IAuthRepository : IRepository<User>
{
    Task<User?> GetByUserNameAsync(string userName);
    Task UpdateLastLoginAsync(int userId);
    Task<List<string>> GetUserRolesAsync(int userId);
    Task<decimal> GetMaxDelegationLimitAsync(int userId);
    Task<string?> GetDepartmentNameAsync(int departmentId);
}
