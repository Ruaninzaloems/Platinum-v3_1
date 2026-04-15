using Microsoft.AspNetCore.Mvc;
  using PlatinumBudget.Api.Services;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/[controller]")]
  public class PlanningViewsController : ControllerBase
  {
      private readonly PlanningSpService _svc;
      public PlanningViewsController(PlanningSpService svc) { _svc = svc; }

      [HttpGet]
    [Route("plan-const-scoa-structure-consolidated")]
    public async Task<IActionResult> PlanConstSCOAStructureConsolidated([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Plan_Const_SCOA_Structure_Consolidated_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitem")]
    public async Task<IActionResult> PlanGetSCOAItem([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Plan_GetSCOAItem_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectbudget")]
    public async Task<IActionResult> PlanProjectBudget([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Plan_ProjectBudget_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("pms-projectbudget")]
    public async Task<IActionResult> PMSProjectBudget([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("PMS_ProjectBudget_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustment")]
    public async Task<IActionResult> Section71BudgetAdjustment([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_BudgetAdjustment_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetoriginal")]
    public async Task<IActionResult> Section71BudgetOriginal([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_BudgetOriginal_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-departmentdivision")]
    public async Task<IActionResult> Section71DepartmentDivision([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_DepartmentDivision_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-ledger")]
    public async Task<IActionResult> Section71Ledger([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_Ledger_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-projectbudget")]
    public async Task<IActionResult> Section71ProjectBudget([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_ProjectBudget_vw", top);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-virement")]
    public async Task<IActionResult> Section71Virement([FromQuery] int? top = null)
    {
        var result = await _svc.ExecuteViewAsync("Section71_Virement_vw", top);
        return Ok(result);
    }
  }
  