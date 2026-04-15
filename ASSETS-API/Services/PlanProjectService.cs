using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class PlanProjectService : IPlanProjectService
{
    private readonly IPlanProjectRepository _repo;
    public PlanProjectService(IPlanProjectRepository repo) => _repo = repo;

    public Task<IEnumerable<dynamic>> GetProjectsAsync(string? finYear) => _repo.GetProjectsAsync(finYear);
    public Task<dynamic?> GetProjectAsync(int id) => _repo.GetProjectAsync(id);
    public Task<dynamic> CreateProjectAsync(Dictionary<string, object?> model) => _repo.CreateProjectAsync(model);
    public Task<bool> UpdateProjectAsync(int id, Dictionary<string, object?> model) => _repo.UpdateProjectAsync(id, model);
    public Task<bool> DeleteProjectAsync(int id) => _repo.DeleteProjectAsync(id);
    public Task<IEnumerable<dynamic>> GetProjectItemsAsync(int? projectId, string? finYear) => _repo.GetProjectItemsAsync(projectId, finYear);
    public Task<IEnumerable<dynamic>> GetProjectItemsScoaAsync(int? projectId, string? finYear) => _repo.GetProjectItemsScoaAsync(projectId, finYear);
    public Task<dynamic?> GetProjectItemAsync(int id) => _repo.GetProjectItemAsync(id);
    public Task<dynamic> CreateProjectItemAsync(Dictionary<string, object?> model) => _repo.CreateProjectItemAsync(model);
    public Task<bool> UpdateProjectItemAsync(int id, Dictionary<string, object?> model) => _repo.UpdateProjectItemAsync(id, model);
    public Task<bool> DeleteProjectItemAsync(int id) => _repo.DeleteProjectItemAsync(id);
}
