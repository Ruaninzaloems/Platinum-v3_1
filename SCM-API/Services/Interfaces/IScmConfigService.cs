namespace SCM_API.Services.Interfaces;

public interface IScmConfigService
{
    Task<object> GetConfigAsync();
    Task<object> UpdateBoundariesAsync(List<dynamic> boundaries);
    Task<object> UpdatePreferencePointsAsync(List<dynamic> thresholds);
    Task<object> UpdateSpecialMethodsAsync(List<dynamic> methods);
    Task<object> GetAntiSplitSettingsAsync();
    Task<object> UpdateAntiSplitAsync(dynamic settings);
    Task<object?> GetProcurementRouteAsync(decimal value);
    Task<object> GetProcessBoundariesAsync();
    Task<object> ValidateRouteAsync(decimal value, string method);
}
