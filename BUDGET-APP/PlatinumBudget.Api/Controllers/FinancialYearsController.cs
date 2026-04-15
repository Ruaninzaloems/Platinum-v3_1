using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinancialYearsController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public FinancialYearsController(BudgetDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.FinancialYears.OrderByDescending(f => f.StartDate).ToListAsync());

    [HttpGet("active")]
    public async Task<IActionResult> GetActive() =>
        Ok(await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive));
}
