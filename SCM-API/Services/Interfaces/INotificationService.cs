using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface INotificationService
{
    Task<PagedResult<object>> GetNotificationsAsync(int userId, bool? isRead, int page, int pageSize);
    Task<bool> MarkAsReadAsync(int notificationId);
    Task<bool> MarkAllAsReadAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task SendNotificationAsync(int userId, string title, string message, string? entityType, int? entityId);
}
