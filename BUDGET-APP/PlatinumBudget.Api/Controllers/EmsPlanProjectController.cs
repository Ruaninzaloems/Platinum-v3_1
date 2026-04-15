using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-project")]
  public class EmsPlanProjectController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanProjectController(BudgetDbContext db) => _db = db;
  
      // === Plan_Activity ===
      [HttpGet("plan-activity")]
      public async Task<IActionResult> GetAllPlan_Activity([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Activity.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-activity/{id}")]
      public async Task<IActionResult> GetPlan_ActivityById(int id)
      {
          var item = await _db.Plan_Activity.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-activity")]
      public async Task<IActionResult> CreatePlan_Activity([FromBody] Plan_Activity model)
      {
          _db.Plan_Activity.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ActivityById), new { id = model.Activity_ID }, model);
      }

      [HttpPut("plan-activity/{id}")]
      public async Task<IActionResult> UpdatePlan_Activity(int id, [FromBody] Plan_Activity model)
      {
          if (id != model.Activity_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Activity.AnyAsync(e => e.Activity_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-activity/{id}")]
      public async Task<IActionResult> DeletePlan_Activity(int id)
      {
          var item = await _db.Plan_Activity.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Activity.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ActivityProgress ===
      [HttpGet("plan-activityprogress")]
      public async Task<IActionResult> GetAllPlan_ActivityProgress([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ActivityProgress.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-activityprogress/{id}")]
      public async Task<IActionResult> GetPlan_ActivityProgressById(int id)
      {
          var item = await _db.Plan_ActivityProgress.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-activityprogress")]
      public async Task<IActionResult> CreatePlan_ActivityProgress([FromBody] Plan_ActivityProgress model)
      {
          _db.Plan_ActivityProgress.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ActivityProgressById), new { id = model.ActivityProgress_ID }, model);
      }

      [HttpPut("plan-activityprogress/{id}")]
      public async Task<IActionResult> UpdatePlan_ActivityProgress(int id, [FromBody] Plan_ActivityProgress model)
      {
          if (id != model.ActivityProgress_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ActivityProgress.AnyAsync(e => e.ActivityProgress_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-activityprogress/{id}")]
      public async Task<IActionResult> DeletePlan_ActivityProgress(int id)
      {
          var item = await _db.Plan_ActivityProgress.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ActivityProgress.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_Project ===
      [HttpGet("plan-project")]
      public async Task<IActionResult> GetAllPlan_Project([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Project.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-project/{id}")]
      public async Task<IActionResult> GetPlan_ProjectById(int id)
      {
          var item = await _db.Plan_Project.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project")]
      public async Task<IActionResult> CreatePlan_Project([FromBody] Plan_Project model)
      {
          _db.Plan_Project.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectById), new { id = model.Project_ID }, model);
      }

      [HttpPut("plan-project/{id}")]
      public async Task<IActionResult> UpdatePlan_Project(int id, [FromBody] Plan_Project model)
      {
          if (id != model.Project_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Project.AnyAsync(e => e.Project_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-project/{id}")]
      public async Task<IActionResult> DeletePlan_Project(int id)
      {
          var item = await _db.Plan_Project.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Project.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_Project_Beneficiaries ===
      [HttpGet("plan-project-beneficiaries")]
      public async Task<IActionResult> GetAllPlan_Project_Beneficiaries([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Project_Beneficiaries.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-project-beneficiaries/{id}")]
      public async Task<IActionResult> GetPlan_Project_BeneficiariesById(int id)
      {
          var item = await _db.Plan_Project_Beneficiaries.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project-beneficiaries")]
      public async Task<IActionResult> CreatePlan_Project_Beneficiaries([FromBody] Plan_Project_Beneficiaries model)
      {
          _db.Plan_Project_Beneficiaries.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_Project_BeneficiariesById), new { id = model.PlanProjectBeneficiary_ID }, model);
      }

      [HttpPut("plan-project-beneficiaries/{id}")]
      public async Task<IActionResult> UpdatePlan_Project_Beneficiaries(int id, [FromBody] Plan_Project_Beneficiaries model)
      {
          if (id != model.PlanProjectBeneficiary_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Project_Beneficiaries.AnyAsync(e => e.PlanProjectBeneficiary_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-project-beneficiaries/{id}")]
      public async Task<IActionResult> DeletePlan_Project_Beneficiaries(int id)
      {
          var item = await _db.Plan_Project_Beneficiaries.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Project_Beneficiaries.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_Project_CashFlow ===
      [HttpGet("plan-project-cashflow")]
      public async Task<IActionResult> GetAllPlan_Project_CashFlow([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Project_CashFlow.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-project-cashflow/{id}")]
      public async Task<IActionResult> GetPlan_Project_CashFlowById(int id)
      {
          var item = await _db.Plan_Project_CashFlow.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project-cashflow")]
      public async Task<IActionResult> CreatePlan_Project_CashFlow([FromBody] Plan_Project_CashFlow model)
      {
          _db.Plan_Project_CashFlow.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_Project_CashFlowById), new { id = model.ProjectCashFlow_ID }, model);
      }

      [HttpPut("plan-project-cashflow/{id}")]
      public async Task<IActionResult> UpdatePlan_Project_CashFlow(int id, [FromBody] Plan_Project_CashFlow model)
      {
          if (id != model.ProjectCashFlow_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Project_CashFlow.AnyAsync(e => e.ProjectCashFlow_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-project-cashflow/{id}")]
      public async Task<IActionResult> DeletePlan_Project_CashFlow(int id)
      {
          var item = await _db.Plan_Project_CashFlow.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Project_CashFlow.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectDivisions ===
      [HttpGet("plan-projectdivisions")]
      public async Task<IActionResult> GetAllPlan_ProjectDivisions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectDivisions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectdivisions/{id}")]
      public async Task<IActionResult> GetPlan_ProjectDivisionsById(int id)
      {
          var item = await _db.Plan_ProjectDivisions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectdivisions")]
      public async Task<IActionResult> CreatePlan_ProjectDivisions([FromBody] Plan_ProjectDivisions model)
      {
          _db.Plan_ProjectDivisions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectDivisionsById), new { id = model.ProjectDivision_ID }, model);
      }

      [HttpPut("plan-projectdivisions/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectDivisions(int id, [FromBody] Plan_ProjectDivisions model)
      {
          if (id != model.ProjectDivision_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectDivisions.AnyAsync(e => e.ProjectDivision_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectdivisions/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectDivisions(int id)
      {
          var item = await _db.Plan_ProjectDivisions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectDivisions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectFunctions ===
      [HttpGet("plan-projectfunctions")]
      public async Task<IActionResult> GetAllPlan_ProjectFunctions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectFunctions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectfunctions/{id}")]
      public async Task<IActionResult> GetPlan_ProjectFunctionsById(int id)
      {
          var item = await _db.Plan_ProjectFunctions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectfunctions")]
      public async Task<IActionResult> CreatePlan_ProjectFunctions([FromBody] Plan_ProjectFunctions model)
      {
          _db.Plan_ProjectFunctions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectFunctionsById), new { id = model.ProjectFunction_ID }, model);
      }

      [HttpPut("plan-projectfunctions/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectFunctions(int id, [FromBody] Plan_ProjectFunctions model)
      {
          if (id != model.ProjectFunction_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectFunctions.AnyAsync(e => e.ProjectFunction_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectfunctions/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectFunctions(int id)
      {
          var item = await _db.Plan_ProjectFunctions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectFunctions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectFund ===
      [HttpGet("plan-projectfund")]
      public async Task<IActionResult> GetAllPlan_ProjectFund([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectFund.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectfund/{id}")]
      public async Task<IActionResult> GetPlan_ProjectFundById(int id)
      {
          var item = await _db.Plan_ProjectFund.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectfund")]
      public async Task<IActionResult> CreatePlan_ProjectFund([FromBody] Plan_ProjectFund model)
      {
          _db.Plan_ProjectFund.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectFundById), new { id = model.ProjectFund_ID }, model);
      }

      [HttpPut("plan-projectfund/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectFund(int id, [FromBody] Plan_ProjectFund model)
      {
          if (id != model.ProjectFund_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectFund.AnyAsync(e => e.ProjectFund_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectfund/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectFund(int id)
      {
          var item = await _db.Plan_ProjectFund.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectFund.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectFundYear ===
      [HttpGet("plan-projectfundyear")]
      public async Task<IActionResult> GetAllPlan_ProjectFundYear([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectFundYear.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectfundyear/{id}")]
      public async Task<IActionResult> GetPlan_ProjectFundYearById(int id)
      {
          var item = await _db.Plan_ProjectFundYear.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectfundyear")]
      public async Task<IActionResult> CreatePlan_ProjectFundYear([FromBody] Plan_ProjectFundYear model)
      {
          _db.Plan_ProjectFundYear.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectFundYearById), new { id = model.ProjectFundYear_ID }, model);
      }

      [HttpPut("plan-projectfundyear/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectFundYear(int id, [FromBody] Plan_ProjectFundYear model)
      {
          if (id != model.ProjectFundYear_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectFundYear.AnyAsync(e => e.ProjectFundYear_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectfundyear/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectFundYear(int id)
      {
          var item = await _db.Plan_ProjectFundYear.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectFundYear.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectIDP ===
      [HttpGet("plan-projectidp")]
      public async Task<IActionResult> GetAllPlan_ProjectIDP([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectIDP.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectidp/{id}")]
      public async Task<IActionResult> GetPlan_ProjectIDPById(int id)
      {
          var item = await _db.Plan_ProjectIDP.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectidp")]
      public async Task<IActionResult> CreatePlan_ProjectIDP([FromBody] Plan_ProjectIDP model)
      {
          _db.Plan_ProjectIDP.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectIDPById), new { id = model.ProjectIDP_ID }, model);
      }

      [HttpPut("plan-projectidp/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectIDP(int id, [FromBody] Plan_ProjectIDP model)
      {
          if (id != model.ProjectIDP_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectIDP.AnyAsync(e => e.ProjectIDP_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectidp/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectIDP(int id)
      {
          var item = await _db.Plan_ProjectIDP.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectIDP.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectItem ===
      [HttpGet("plan-projectitem")]
      public async Task<IActionResult> GetAllPlan_ProjectItem([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectItem.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectitem/{id}")]
      public async Task<IActionResult> GetPlan_ProjectItemById(int id)
      {
          var item = await _db.Plan_ProjectItem.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectitem")]
      public async Task<IActionResult> CreatePlan_ProjectItem([FromBody] Plan_ProjectItem model)
      {
          _db.Plan_ProjectItem.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectItemById), new { id = model.PlanProjectItem_ID }, model);
      }

      [HttpPut("plan-projectitem/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectItem(int id, [FromBody] Plan_ProjectItem model)
      {
          if (id != model.PlanProjectItem_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectItem.AnyAsync(e => e.PlanProjectItem_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectitem/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectItem(int id)
      {
          var item = await _db.Plan_ProjectItem.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectItem.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectItemDocs ===
      [HttpGet("plan-projectitemdocs")]
      public async Task<IActionResult> GetAllPlan_ProjectItemDocs([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectItemDocs.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectitemdocs/{id}")]
      public async Task<IActionResult> GetPlan_ProjectItemDocsById(int id)
      {
          var item = await _db.Plan_ProjectItemDocs.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectitemdocs")]
      public async Task<IActionResult> CreatePlan_ProjectItemDocs([FromBody] Plan_ProjectItemDocs model)
      {
          _db.Plan_ProjectItemDocs.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectItemDocsById), new { id = model.ProjectItemDocs_ID }, model);
      }

      [HttpPut("plan-projectitemdocs/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectItemDocs(int id, [FromBody] Plan_ProjectItemDocs model)
      {
          if (id != model.ProjectItemDocs_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectItemDocs.AnyAsync(e => e.ProjectItemDocs_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectitemdocs/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectItemDocs(int id)
      {
          var item = await _db.Plan_ProjectItemDocs.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectItemDocs.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectItemMonth ===
      [HttpGet("plan-projectitemmonth")]
      public async Task<IActionResult> GetAllPlan_ProjectItemMonth([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectItemMonth.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectitemmonth/{id}")]
      public async Task<IActionResult> GetPlan_ProjectItemMonthById(int id)
      {
          var item = await _db.Plan_ProjectItemMonth.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectitemmonth")]
      public async Task<IActionResult> CreatePlan_ProjectItemMonth([FromBody] Plan_ProjectItemMonth model)
      {
          _db.Plan_ProjectItemMonth.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectItemMonthById), new { id = model.ProjectItemMonth_ID }, model);
      }

      [HttpPut("plan-projectitemmonth/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectItemMonth(int id, [FromBody] Plan_ProjectItemMonth model)
      {
          if (id != model.ProjectItemMonth_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectItemMonth.AnyAsync(e => e.ProjectItemMonth_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectitemmonth/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectItemMonth(int id)
      {
          var item = await _db.Plan_ProjectItemMonth.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectItemMonth.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectJustification ===
      [HttpGet("plan-projectjustification")]
      public async Task<IActionResult> GetAllPlan_ProjectJustification([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectJustification.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectjustification/{id}")]
      public async Task<IActionResult> GetPlan_ProjectJustificationById(int id)
      {
          var item = await _db.Plan_ProjectJustification.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectjustification")]
      public async Task<IActionResult> CreatePlan_ProjectJustification([FromBody] Plan_ProjectJustification model)
      {
          _db.Plan_ProjectJustification.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectJustificationById), new { id = model.PlanProjectJustification_ID }, model);
      }

      [HttpPut("plan-projectjustification/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectJustification(int id, [FromBody] Plan_ProjectJustification model)
      {
          if (id != model.PlanProjectJustification_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectJustification.AnyAsync(e => e.PlanProjectJustification_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectjustification/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectJustification(int id)
      {
          var item = await _db.Plan_ProjectJustification.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectJustification.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_ProjectRegions ===
      [HttpGet("plan-projectregions")]
      public async Task<IActionResult> GetAllPlan_ProjectRegions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectRegions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-projectregions/{id}")]
      public async Task<IActionResult> GetPlan_ProjectRegionsById(int id)
      {
          var item = await _db.Plan_ProjectRegions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-projectregions")]
      public async Task<IActionResult> CreatePlan_ProjectRegions([FromBody] Plan_ProjectRegions model)
      {
          _db.Plan_ProjectRegions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectRegionsById), new { id = model.ProjectRegion_ID }, model);
      }

      [HttpPut("plan-projectregions/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectRegions(int id, [FromBody] Plan_ProjectRegions model)
      {
          if (id != model.ProjectRegion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectRegions.AnyAsync(e => e.ProjectRegion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-projectregions/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectRegions(int id)
      {
          var item = await _db.Plan_ProjectRegions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectRegions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  