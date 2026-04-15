using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/report-exports")]
public class ReportExportsController : ControllerBase
{
    [HttpGet("available")]
    public ActionResult GetAvailable()
        => Ok(Array.Empty<object>());

    [HttpGet("download/{reportId}")]
    public ActionResult Download(int reportId)
        => Ok(ApiResponse.Fail("No exports available"));
}
