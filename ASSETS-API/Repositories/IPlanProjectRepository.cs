namespace MssqlApi.Repositories;

public interface IPlanProjectRepository
{
    Task<IEnumerable<dynamic>> GetProjectsAsync(string? finYear);
    Task<dynamic?> GetProjectAsync(int id);
    Task<dynamic> CreateProjectAsync(Dictionary<string, object?> model);
    Task<bool> UpdateProjectAsync(int id, Dictionary<string, object?> model);
    Task<bool> DeleteProjectAsync(int id);
    Task<IEnumerable<dynamic>> GetProjectItemsAsync(int? projectId, string? finYear);
    Task<IEnumerable<dynamic>> GetProjectItemsScoaAsync(int? projectId, string? finYear);
    Task<dynamic?> GetProjectItemAsync(int id);
    Task<dynamic> CreateProjectItemAsync(Dictionary<string, object?> model);
    Task<bool> UpdateProjectItemAsync(int id, Dictionary<string, object?> model);
    Task<bool> DeleteProjectItemAsync(int id);
}
