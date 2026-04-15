using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/vendor-reports")]
public class VendorReportsController : ControllerBase
{
    [HttpGet("status")]
    public ActionResult GetStatus()
        => Ok(ApiResponse<object>.Ok(new { total = 0, active = 0, suspended = 0, blacklisted = 0, pending = 0, expired = 0 }));

    [HttpGet("diversity")]
    public ActionResult GetDiversity()
        => Ok(new { bbbeeBreakdown = Array.Empty<object>(), hdiOwned = 0.0, womenOwned = 0, youthOwned = 0, disabilityOwned = 0, localContent = 0.0 });
}
