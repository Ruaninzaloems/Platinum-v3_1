using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/ifw")]
public class IfwController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll([FromQuery] string? type, [FromQuery] string? status, [FromQuery] string? financialYear,
        [FromQuery] string? sortBy, [FromQuery] string? sortDir, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), totalPages = 1, total = 0, page, pageSize });

    [HttpGet("summary")]
    public ActionResult GetSummary()
        => Ok(new { irregular = new { count = 0, amount = 0m }, fruitless = new { count = 0, amount = 0m }, wasteful = new { count = 0, amount = 0m }, unauthorized = new { count = 0, amount = 0m }, total = 0, totalAmount = 0m, underInvestigation = 0, condoned = 0, uncondoned = 0 });

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
        => Ok(ApiResponse<object>.Ok(new { id, type = "Irregular", status = "Under Investigation", amount = 0m, description = "", discoveredDate = DateTime.UtcNow, actions = Array.Empty<object>() }));

    [HttpPost]
    public ActionResult Create([FromBody] object dto)
        => Ok(ApiResponse<object>.Ok(new { id = 0 }, "IFW entry created"));

    [HttpPut("{id}")]
    public ActionResult Update(int id, [FromBody] object dto)
        => Ok(ApiResponse.Ok("IFW entry updated"));

    [HttpPatch("{id}/status")]
    public ActionResult UpdateStatus(int id, [FromBody] object dto)
        => Ok(ApiResponse.Ok("Status updated"));
}
