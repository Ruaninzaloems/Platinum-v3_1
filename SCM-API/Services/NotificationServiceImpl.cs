using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class NotificationServiceImpl : INotificationService
{
    private readonly ILogger<NotificationServiceImpl> _logger;

    public NotificationServiceImpl(ILogger<NotificationServiceImpl> logger) { _logger = logger; }

    public async Task<PagedResult<object>> GetNotificationsAsync(int userId, bool? isRead, int page, int pageSize)
        => new PagedResult<object> { Items = new List<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };

    public async Task<bool> MarkAsReadAsync(int notificationId) { return true; }
    public async Task<bool> MarkAllAsReadAsync(int userId) { return true; }
    public async Task<int> GetUnreadCountAsync(int userId) { return 0; }

    public async Task SendNotificationAsync(int userId, string title, string message, string? entityType, int? entityId)
    {
        _logger.LogInformation("Notification sent to user {UserId}: {Title}", userId, title);
    }
}
