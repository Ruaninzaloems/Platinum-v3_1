using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
        => Ok(new { data = new[] {
            new { id = 1, name = "System Administrator", key = "system_admin", permissions = Array.Empty<string>() },
            new { id = 2, name = "SCM Practitioner", key = "scm_practitioner", permissions = Array.Empty<string>() },
            new { id = 3, name = "SCM Manager", key = "scm_manager", permissions = Array.Empty<string>() },
            new { id = 4, name = "Requestor", key = "requestor", permissions = Array.Empty<string>() },
            new { id = 5, name = "Budget Officer", key = "budget_officer", permissions = Array.Empty<string>() },
            new { id = 6, name = "Approving Officer", key = "approving_officer", permissions = Array.Empty<string>() },
            new { id = 7, name = "Stores Officer", key = "stores_officer", permissions = Array.Empty<string>() },
            new { id = 8, name = "Creditors Clerk", key = "creditors_clerk", permissions = Array.Empty<string>() },
            new { id = 9, name = "Expenditure Officer", key = "expenditure_officer", permissions = Array.Empty<string>() },
            new { id = 10, name = "CFO", key = "cfo", permissions = Array.Empty<string>() },
            new { id = 11, name = "Municipal Manager", key = "municipal_manager", permissions = Array.Empty<string>() },
            new { id = 12, name = "Internal Auditor", key = "internal_auditor", permissions = Array.Empty<string>() }
        } });
}
