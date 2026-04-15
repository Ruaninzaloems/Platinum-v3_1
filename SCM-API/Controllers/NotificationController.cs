using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationController(INotificationService service) { _service = service; }

    [HttpGet]
    public async Task<ActionResult<PagedApiResponse<object>>> GetAll([FromQuery] int userId = 1, [FromQuery] bool? isRead = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _service.GetNotificationsAsync(userId, isRead, page, pageSize);
        return Ok(PagedApiResponse<object>.FromPagedResult(result));
    }

    [HttpPost("{id}/read")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAsRead(int id)
    {
        await _service.MarkAsReadAsync(id);
        return Ok(ApiResponse.Ok("Notification marked as read"));
    }

    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse<object>>> MarkAllAsRead([FromQuery] int userId = 1)
    {
        await _service.MarkAllAsReadAsync(userId);
        return Ok(ApiResponse.Ok("All notifications marked as read"));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount([FromQuery] int userId = 1)
    {
        var count = await _service.GetUnreadCountAsync(userId);
        return Ok(ApiResponse<int>.Ok(count));
    }
}
