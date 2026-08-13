using Microsoft.AspNetCore.Mvc;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetUsersController : ControllerBase
{
    private static readonly List<object> _users = new()
    {
        new { id = 1, name = "Abigail Dlamini",  title = "CFO",                    department = "Finance" },
        new { id = 2, name = "Brian Nkosi",       title = "Budget Manager",         department = "Finance" },
        new { id = 3, name = "Carol Sithole",     title = "Senior Budget Analyst",  department = "Finance" },
        new { id = 4, name = "David Molefe",      title = "Director: Infrastructure", department = "Infrastructure" },
        new { id = 5, name = "Elsie Khumalo",     title = "HOD: Community Services", department = "Community Services" },
        new { id = 6, name = "Frank Mahlangu",    title = "HOD: Finance",           department = "Finance" },
        new { id = 7, name = "Grace Ndlovu",      title = "Municipal Manager",      department = "Office of the MM" },
        new { id = 8, name = "Hendrick Zulu",     title = "Budget Officer",         department = "Finance" },
        new { id = 9, name = "Irene Mokoena",     title = "SCM Manager",            department = "Supply Chain" },
        new { id = 10, name = "Jacob Pretorius",  title = "Director: Planning",     department = "Planning" },
    };

    [HttpGet]
    public IActionResult GetAll() => Ok(_users);
}
