namespace SCM_API.Services.Interfaces;

public interface IInventorySettingsService
{
    Task<object> GetSettingsAsync(string settingType);
    Task<object?> GetSettingByIdAsync(string settingType, int id);
    Task<object> CreateSettingAsync(string settingType, object dto);
    Task<bool> UpdateSettingAsync(string settingType, int id, object dto);
    Task<bool> ToggleSettingAsync(string settingType, int id, bool enabled);
}
