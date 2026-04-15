using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/ai/insights")]
public class AiInsightsController : ControllerBase
{
    [HttpGet("{category}")]
    public ActionResult<ApiResponse<object>> GetInsights(string category)
    {
        var result = new { insights = Array.Empty<object>() };
        return Ok(ApiResponse<object>.Ok(result));
    }
}
