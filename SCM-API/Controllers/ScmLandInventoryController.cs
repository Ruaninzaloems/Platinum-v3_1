using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/scm/land-inventory")]
public class ScmLandInventoryController : ControllerBase
{
    [HttpGet("dashboard")]
    public ActionResult GetDashboard([FromQuery] string? finYear)
        => Ok(new {
            totalParcels = 67, totalHectares = 1245.8, carryingValue = 128000000m,
            marketValue = 256000000m, nrvWriteDowns = 4, pendingAcquisitions = 3,
            pendingDisposals = 2, pendingTransfers = 1
        });

    [HttpGet("dashboard/by-ward")]
    public ActionResult GetByWard([FromQuery] string? finYear)
        => Ok(new object[] {
            new { ward = "Ward 1", count = 16, hectares = 350.2 },
            new { ward = "Ward 2", count = 12, hectares = 280.5 },
            new { ward = "Ward 3", count = 10, hectares = 195.0 },
            new { ward = "Ward 4", count = 8, hectares = 120.1 },
            new { ward = "Ward 5", count = 21, hectares = 300.0 }
        });

    [HttpGet("dashboard/by-zoning")]
    public ActionResult GetByZoning([FromQuery] string? finYear)
        => Ok(new object[] {
            new { zone = "Residential", count = 25, percentage = 37 },
            new { zone = "Commercial", count = 15, percentage = 22 },
            new { zone = "Industrial", count = 10, percentage = 15 },
            new { zone = "Agricultural", count = 12, percentage = 18 },
            new { zone = "Open Space", count = 5, percentage = 8 }
        });

    [HttpGet("properties")]
    public ActionResult GetProperties([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("transactions")]
    public ActionResult GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });

    [HttpGet("valuations")]
    public ActionResult GetValuations()
        => Ok(new { items = Array.Empty<object>(), total = 0 });

    [HttpGet("impairments")]
    public ActionResult GetImpairments()
        => Ok(new { items = Array.Empty<object>(), total = 0 });

    [HttpGet("reconciliation")]
    public ActionResult GetReconciliation()
        => Ok(new { items = Array.Empty<object>(), total = 0 });

    [HttpGet("environmental")]
    public ActionResult GetEnvironmental()
        => Ok(new { items = Array.Empty<object>(), total = 0 });

    [HttpGet("servitudes")]
    public ActionResult GetServitudes()
        => Ok(new { items = Array.Empty<object>(), total = 0 });

    [HttpGet("ai/insights")]
    public ActionResult GetAiInsights()
        => Ok(new { insights = Array.Empty<object>(), lastUpdated = DateTime.UtcNow });

    [HttpGet("compliance")]
    public ActionResult GetCompliance()
        => Ok(new { items = Array.Empty<object>(), score = 0 });

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
        => Ok(new { id, erfNumber = "", description = "", zoning = "", hectares = 0.0, ward = "", status = "Active" });
}
