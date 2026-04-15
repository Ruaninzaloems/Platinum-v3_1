using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/constants")]
public class SystemConstantsController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public SystemConstantsController(BudgetDbContext db)
    {
        _db = db;
    }

    [HttpGet("budget-consumption-processes")]
    public async Task<IActionResult> GetBudgetConsumptionProcesses([FromQuery] bool? enabledOnly)
    {
        var query = _db.Const_BudgetConsumptionProcess_Sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.BudgetConsumptionProcessEnabled);
        return Ok(await query.OrderBy(x => x.BudgetConsumptionProcess_ID).ToListAsync());
    }

    [HttpGet("budget-consumption-processes/{id}")]
    public async Task<IActionResult> GetBudgetConsumptionProcess(int id)
    {
        var item = await _db.Const_BudgetConsumptionProcess_Sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("budget-split-options")]
    public async Task<IActionResult> GetBudgetSplitOptions([FromQuery] bool? enabledOnly)
    {
        var query = _db.Const_BudgetSplitOptions.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        return Ok(await query.OrderBy(x => x.BudgetSplit_ID).ToListAsync());
    }

    [HttpGet("budget-split-options/{id}")]
    public async Task<IActionResult> GetBudgetSplitOption(int id)
    {
        var item = await _db.Const_BudgetSplitOptions.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("budget-transaction-types")]
    public async Task<IActionResult> GetBudgetTransactionTypes([FromQuery] bool? enabledOnly)
    {
        var query = _db.Const_BudgetTransactionType_sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        return Ok(await query.OrderBy(x => x.BudgetTransactionType_ID).ToListAsync());
    }

    [HttpGet("budget-transaction-types/{id}")]
    public async Task<IActionResult> GetBudgetTransactionType(int id)
    {
        var item = await _db.Const_BudgetTransactionType_sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("budget-validation-rules")]
    public async Task<IActionResult> GetBudgetValidationRules([FromQuery] bool? enabledOnly)
    {
        var query = _db.Const_BudgetValidationRule_Sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.BudgetValidationRuleEnabled);
        return Ok(await query.OrderBy(x => x.BudgetValidationRule_ID).ToListAsync());
    }

    [HttpGet("budget-validation-rules/{id}")]
    public async Task<IActionResult> GetBudgetValidationRule(int id)
    {
        var item = await _db.Const_BudgetValidationRule_Sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("plan-adjustment-reasons")]
    public async Task<IActionResult> GetPlanAdjustmentReasons([FromQuery] bool? enabledOnly, [FromQuery] string? finYear)
    {
        var query = _db.Const_PlanAdjustmentReason_sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        if (!string.IsNullOrEmpty(finYear)) query = query.Where(x => x.FinYear == finYear);
        return Ok(await query.OrderBy(x => x.Number).ThenBy(x => x.AdjustmentReason_ID).ToListAsync());
    }

    [HttpGet("plan-adjustment-reasons/{id}")]
    public async Task<IActionResult> GetPlanAdjustmentReason(int id)
    {
        var item = await _db.Const_PlanAdjustmentReason_sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("plan-adjustment-types")]
    public async Task<IActionResult> GetPlanAdjustmentTypes([FromQuery] bool? enabledOnly, [FromQuery] string? finYear)
    {
        var query = _db.Const_PlanAdjustmentType_sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        if (!string.IsNullOrEmpty(finYear)) query = query.Where(x => x.FinYear == finYear);
        return Ok(await query.OrderBy(x => x.Number).ThenBy(x => x.AdjustmentType_ID).ToListAsync());
    }

    [HttpGet("plan-adjustment-types/{id}")]
    public async Task<IActionResult> GetPlanAdjustmentType(int id)
    {
        var item = await _db.Const_PlanAdjustmentType_sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("plan-capital-operational-types")]
    public async Task<IActionResult> GetPlanCapitalOperationalTypes([FromQuery] bool? enabledOnly)
    {
        var query = _db.Const_PlanCapitalOperationalTypes_sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        return Ok(await query.OrderBy(x => x.SortOrder).ThenBy(x => x.Type_ID).ToListAsync());
    }

    [HttpGet("plan-capital-operational-types/{id}")]
    public async Task<IActionResult> GetPlanCapitalOperationalType(int id)
    {
        var item = await _db.Const_PlanCapitalOperationalTypes_sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("plan-virement-rules")]
    public async Task<IActionResult> GetPlanVirementRules([FromQuery] bool? enabledOnly, [FromQuery] string? finYear, [FromQuery] int? policyVersionId)
    {
        var query = _db.Const_PlanVirementRules_sys.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        if (!string.IsNullOrEmpty(finYear)) query = query.Where(x => x.FinYear == finYear);
        if (policyVersionId.HasValue) query = query.Where(x => x.VirementPolicyVersionID == policyVersionId);
        return Ok(await query.OrderBy(x => x.Priority).ThenBy(x => x.VirementRule_ID).ToListAsync());
    }

    [HttpGet("plan-virement-rules/{id}")]
    public async Task<IActionResult> GetPlanVirementRule(int id)
    {
        var item = await _db.Const_PlanVirementRules_sys.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("idp-level-description-details")]
    public async Task<IActionResult> GetIdpLevelDescriptionDetails([FromQuery] int? headerId, [FromQuery] int? levelNumber)
    {
        var query = _db.ConstIdpLevelDescriptionDetails.AsQueryable();
        if (headerId.HasValue) query = query.Where(x => x.IDPLevelDescHeaderID == headerId);
        if (levelNumber.HasValue) query = query.Where(x => x.IDPLevelNumber == levelNumber);
        return Ok(await query.OrderBy(x => x.IDPLevelNumber).ThenBy(x => x.IDPLevelDescDetail_ID).ToListAsync());
    }

    [HttpGet("idp-level-description-details/{id}")]
    public async Task<IActionResult> GetIdpLevelDescriptionDetail(int id)
    {
        var item = await _db.ConstIdpLevelDescriptionDetails.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("idp-level-description-headers")]
    public async Task<IActionResult> GetIdpLevelDescriptionHeaders([FromQuery] string? financialYear)
    {
        var query = _db.ConstIdpLevelDescriptionHeaders.AsQueryable();
        if (!string.IsNullOrEmpty(financialYear)) query = query.Where(x => x.FinancialYear == financialYear);
        return Ok(await query.OrderBy(x => x.FinancialYear).ThenBy(x => x.IDPLevelDescHeader_ID).ToListAsync());
    }

    [HttpGet("idp-level-description-headers/{id}")]
    public async Task<IActionResult> GetIdpLevelDescriptionHeader(int id)
    {
        var item = await _db.ConstIdpLevelDescriptionHeaders.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("idp-national-kpa-details")]
    public async Task<IActionResult> GetIdpNationalKpaDetails([FromQuery] bool? enabledOnly, [FromQuery] int? headerId)
    {
        var query = _db.ConstIdpNationalKpaDetails.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.NationalKPAEnabled == true);
        if (headerId.HasValue) query = query.Where(x => x.NationalKPAHeaderID == headerId);
        return Ok(await query.OrderBy(x => x.NationalKPANumber).ThenBy(x => x.NationalKPADetail_ID).ToListAsync());
    }

    [HttpGet("idp-national-kpa-details/{id}")]
    public async Task<IActionResult> GetIdpNationalKpaDetail(int id)
    {
        var item = await _db.ConstIdpNationalKpaDetails.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("idp-national-kpa-headers")]
    public async Task<IActionResult> GetIdpNationalKpaHeaders([FromQuery] string? financialYear)
    {
        var query = _db.ConstIdpNationalKpaHeaders.AsQueryable();
        if (!string.IsNullOrEmpty(financialYear)) query = query.Where(x => x.FinancialYear == financialYear);
        return Ok(await query.OrderBy(x => x.FinancialYear).ThenBy(x => x.NationalKPAHeader_ID).ToListAsync());
    }

    [HttpGet("idp-national-kpa-headers/{id}")]
    public async Task<IActionResult> GetIdpNationalKpaHeader(int id)
    {
        var item = await _db.ConstIdpNationalKpaHeaders.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("idp-items")]
    public async Task<IActionResult> GetIdpItems([FromQuery] string? financialYear, [FromQuery] int? levelNumber, [FromQuery] int? parentId, [FromQuery] bool? isProj)
    {
        var query = _db.IdpItems.AsQueryable();
        if (!string.IsNullOrEmpty(financialYear)) query = query.Where(x => x.FinancialYear == financialYear);
        if (levelNumber.HasValue) query = query.Where(x => x.IDPLevelNumber == levelNumber);
        if (parentId.HasValue) query = query.Where(x => x.ItemParentID == parentId);
        if (isProj.HasValue) query = query.Where(x => x.isProj == isProj);
        return Ok(await query.OrderBy(x => x.IDPLevelNumber).ThenBy(x => x.ItemOrderID).ThenBy(x => x.Item_ID).ToListAsync());
    }

    [HttpGet("idp-items/{id}")]
    public async Task<IActionResult> GetIdpItem(int id)
    {
        var item = await _db.IdpItems.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-function-structure-consolidated")]
    public async Task<IActionResult> GetScoaFunctionStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText)
    {
        var query = _db.ConstScoaFunctionStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        return Ok(await query.OrderBy(x => x.LevelID).ThenBy(x => x.ScoaID).ToListAsync());
    }

    [HttpGet("scoa-function-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaFunctionStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaFunctionStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-funds-structure-consolidated")]
    public async Task<IActionResult> GetScoaFundsStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText, [FromQuery] int? levelID)
    {
        var query = _db.ConstScoaFundsStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        if (levelID.HasValue) query = query.Where(x => x.LevelID == levelID);
        return Ok(await query.OrderBy(x => x.LevelID).ThenBy(x => x.ScoaID).ToListAsync());
    }

    [HttpGet("scoa-funds-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaFundsStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaFundsStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-project-structure-consolidated")]
    public async Task<IActionResult> GetScoaProjectStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText, [FromQuery] int? levelID, [FromQuery] int? parentId, [FromQuery] bool? rootOnly, [FromQuery] string? postingLevel)
    {
        var query = _db.ConstScoaProjectStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        if (levelID.HasValue) query = query.Where(x => x.LevelID == levelID);
        if (parentId.HasValue) query = query.Where(x => x.ScoaParentID == parentId);
        if (rootOnly == true) query = query.Where(x => x.ScoaParentID == null || x.ScoaParentID == 0);
        if (!string.IsNullOrEmpty(postingLevel)) query = query.Where(x => x.PostingLevel == postingLevel);
        return Ok(await query.OrderBy(x => x.LevelID).ThenBy(x => x.ScoaID).ToListAsync());
    }

    [HttpGet("scoa-project-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaProjectStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaProjectStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-regional-structure-consolidated")]
    public async Task<IActionResult> GetScoaRegionalStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText, [FromQuery] int? levelID)
    {
        var query = _db.ConstScoaRegionalStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        if (levelID.HasValue) query = query.Where(x => x.LevelID == levelID);
        return Ok(await query.OrderBy(x => x.LevelID).ThenBy(x => x.ScoaID).ToListAsync());
    }

    [HttpGet("scoa-regional-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaRegionalStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaRegionalStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-structure-consolidated")]
    public async Task<IActionResult> GetScoaStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText, [FromQuery] string? scoaFile, [FromQuery] int? levelID, [FromQuery] int? parentId, [FromQuery] bool? rootOnly, [FromQuery] string? postingLevel, [FromQuery] string? search, [FromQuery] int? take)
    {
        var query = _db.ConstScoaStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        if (!string.IsNullOrEmpty(scoaFile)) query = query.Where(x => x.NTSCOAFile == scoaFile);
        if (levelID.HasValue) query = query.Where(x => x.LevelID == levelID);
        if (parentId.HasValue) query = query.Where(x => x.ScoaParentID == parentId);
        if (rootOnly == true) query = query.Where(x => x.ScoaParentID == null || x.ScoaParentID == 0);
        if (!string.IsNullOrEmpty(postingLevel)) query = query.Where(x => x.PostingLevel == postingLevel);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(x => (x.ScoaCode != null && x.ScoaCode.Contains(search)) ||
                                     (x.ScoaShortDesc != null && x.ScoaShortDesc.Contains(search)) ||
                                     (x.ScoaDesc != null && x.ScoaDesc.Contains(search)));
        var ordered = query.OrderBy(x => x.NTSCOAFile).ThenBy(x => x.LevelID).ThenBy(x => x.ScoaID);
        var result = take.HasValue ? await ordered.Take(take.Value).ToListAsync() : await ordered.ToListAsync();
        return Ok(result);
    }

    [HttpGet("scoa-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("scoa-costing-structure-consolidated")]
    public async Task<IActionResult> GetScoaCostingStructureConsolidated([FromQuery] bool? enabledOnly, [FromQuery] string? finYearText, [FromQuery] string? scoaFile)
    {
        var query = _db.ConstScoaCostingStructureConsolidated.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled == true);
        if (!string.IsNullOrEmpty(finYearText)) query = query.Where(x => x.FinYearText == finYearText);
        if (!string.IsNullOrEmpty(scoaFile)) query = query.Where(x => x.NTSCOAFile == scoaFile);
        return Ok(await query.OrderBy(x => x.LevelID).ThenBy(x => x.ScoaID).ToListAsync());
    }

    [HttpGet("scoa-costing-structure-consolidated/{id}")]
    public async Task<IActionResult> GetScoaCostingStructureConsolidatedById(int id)
    {
        var item = await _db.ConstScoaCostingStructureConsolidated.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("project-types")]
    public async Task<IActionResult> GetProjectTypes([FromQuery] string? finYear, [FromQuery] bool? enabledOnly)
    {
        var query = _db.ConstProjectTypes.AsQueryable();
        if (!string.IsNullOrEmpty(finYear)) query = query.Where(x => x.FinYear == finYear);
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        return Ok(await query.OrderBy(x => x.ProjectType_ID).ToListAsync());
    }

    [HttpGet("project-types/{id}")]
    public async Task<IActionResult> GetProjectType(int id)
    {
        var item = await _db.ConstProjectTypes.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost("project-types")]
    public async Task<IActionResult> CreateProjectType([FromBody] ConstProjectType model)
    {
        _db.ConstProjectTypes.Add(model);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProjectType), new { id = model.ProjectType_ID }, model);
    }

    [HttpPut("project-types/{id}")]
    public async Task<IActionResult> UpdateProjectType(int id, [FromBody] ConstProjectType model)
    {
        if (id != model.ProjectType_ID) return BadRequest();
        _db.Entry(model).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
        try { await _db.SaveChangesAsync(); } catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException) { if (!await _db.ConstProjectTypes.AnyAsync(e => e.ProjectType_ID == id)) return NotFound(); throw; }
        return NoContent();
    }

    [HttpDelete("project-types/{id}")]
    public async Task<IActionResult> DeleteProjectType(int id)
    {
        var item = await _db.ConstProjectTypes.FindAsync(id);
        if (item == null) return NotFound();
        _db.ConstProjectTypes.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetStatuses([FromQuery] bool? enabledOnly, [FromQuery] string? usedBy)
    {
        var query = _db.ConstStatuses.AsQueryable();
        if (enabledOnly == true) query = query.Where(x => x.Enabled);
        if (!string.IsNullOrEmpty(usedBy)) query = query.Where(x => x.UsedBy == usedBy);
        return Ok(await query.OrderBy(x => x.Status_ID).ToListAsync());
    }

    [HttpGet("statuses/{id}")]
    public async Task<IActionResult> GetStatus(int id)
    {
        var item = await _db.ConstStatuses.FindAsync(id);
        return item == null ? NotFound() : Ok(item);
    }
}
