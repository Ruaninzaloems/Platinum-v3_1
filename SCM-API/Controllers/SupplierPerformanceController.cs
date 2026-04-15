using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/supplier-performance")]
public class SupplierPerformanceController : ControllerBase
{
    [HttpGet("config")]
    public ActionResult GetConfig()
        => Ok(ApiResponse<object>.Ok(new { categories = new[] { "Quality", "Delivery", "Pricing", "Service" }, ratingScale = 5, evaluationPeriodMonths = 12 }));

    [HttpGet]
    public ActionResult GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = new { items = Array.Empty<object>(), total = 0, page, pageSize }, isSuccess = true, errors = Array.Empty<string>(), timestamp = DateTime.UtcNow });

    [HttpGet("{vendorId}")]
    public ActionResult GetByVendor(int vendorId)
        => Ok(ApiResponse<object>.Ok(new { vendorId, overallScore = 0, evaluations = Array.Empty<object>() }));

    [HttpGet("issues")]
    public ActionResult GetIssues([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("blacklist")]
    public ActionResult GetBlacklist([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("blacklist/check")]
    public ActionResult CheckBlacklist()
        => Ok(new { isBlacklisted = false });

    [HttpGet("whitelist")]
    public ActionResult GetWhitelist([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("scorecards")]
    public ActionResult GetScorecards([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("scorecard-weights")]
    public ActionResult GetScorecardWeights()
        => Ok(new { quality = 25, delivery = 25, pricing = 25, service = 25 });

    [HttpGet("diversity")]
    public ActionResult GetDiversity()
        => Ok(ApiResponse<object>.Ok(new { bbbeeBreakdown = Array.Empty<object>(), localContent = 0.0, womenOwned = 0, youthOwned = 0, disabilityOwned = 0 }));

    [HttpPost]
    public ActionResult Create([FromBody] object dto)
        => Ok(ApiResponse<object>.Ok(new { id = 0 }, "Evaluation created"));
}
