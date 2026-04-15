using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(new { data = new { items = Array.Empty<object>(), total = 0, page, pageSize }, isSuccess = true, errors = Array.Empty<string>(), timestamp = DateTime.UtcNow });
}
