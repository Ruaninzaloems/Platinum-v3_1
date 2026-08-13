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

      [HttpGet("plan-project/by-name")]
      public async Task<IActionResult> GetPlan_ProjectByName([FromQuery] string finYear, [FromQuery] string name)
      {
          if (string.IsNullOrWhiteSpace(finYear) || string.IsNullOrWhiteSpace(name)) return BadRequest();
          var match = await _db.Plan_Project
              .Where(p => p.FinYear == finYear && p.ProjectName != null && p.ProjectName.ToLower() == name.ToLower())
              .Select(p => new { p.Project_ID })
              .FirstOrDefaultAsync();
          return match == null ? NotFound() : Ok(match);
      }

      [HttpPost("plan-project")]
      public async Task<IActionResult> CreatePlan_Project([FromBody] Plan_Project model)
      {
          // Uniqueness: ProjectName per FinYear (excluding self if Project_ID > 0)
          var selfId = model.Project_ID;
          var nameExists = await _db.Plan_Project.AnyAsync(p =>
              p.Project_ID != selfId &&
              p.ProjectName != null &&
              p.ProjectName.ToLower() == model.ProjectName!.ToLower() &&
              p.FinYear == model.FinYear);
          if (nameExists)
              return Conflict("A project with this name already exists for the selected financial year.");

          // Auto-assign ProjectCode (uses ProjectCode index on both tables)
          var maxCode = await _db.Database
              .SqlQuery<int>($"""
                  SELECT GREATEST(
                      COALESCE((SELECT MAX("ProjectCode") FROM "Plan_Project"), 0),
                      COALESCE((SELECT MAX("ProjectCode") FROM "Plan_AdjustmentProject"), 0)
                  ) AS "Value"
              """)
              .FirstOrDefaultAsync();
          model.ProjectCode = maxCode + 1;

          _db.Plan_Project.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_ProjectById), new { id = model.Project_ID }, model);
      }

      [HttpPut("plan-project/{id}")]
      public async Task<IActionResult> UpdatePlan_Project(int id, [FromBody] Plan_Project model)
      {
          if (id != model.Project_ID) return BadRequest("ID mismatch");

          // Uniqueness: ProjectName per FinYear (excluding self)
          var nameExists = await _db.Plan_Project.AnyAsync(p =>
              p.Project_ID != id &&
              p.ProjectName != null &&
              p.ProjectName.ToLower() == model.ProjectName!.ToLower() &&
              p.FinYear == model.FinYear);
          if (nameExists)
              return Conflict("A project with this name already exists for the selected financial year.");

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


      // === Plan_ProjectScoaFunds ===
      [HttpGet("plan-project-scoa-funds")]
      public async Task<IActionResult> GetAllPlan_ProjectScoaFunds([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectScoaFunds.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-project-scoa-funds/{id}")]
      public async Task<IActionResult> GetPlan_ProjectScoaFundsById(int id)
      {
          var item = await _db.Plan_ProjectScoaFunds.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project-scoa-funds")]
      public async Task<IActionResult> CreatePlan_ProjectScoaFunds([FromBody] Plan_ProjectScoaFunds model)
      {
          _db.Plan_ProjectScoaFunds.Add(model);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOAFundId = model.ScoaFundID; });
          return CreatedAtAction(nameof(GetPlan_ProjectScoaFundsById), new { id = model.ProjectScoaFund_ID }, model);
      }

      [HttpPut("plan-project-scoa-funds/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectScoaFunds(int id, [FromBody] Plan_ProjectScoaFunds model)
      {
          if (id != model.ProjectScoaFund_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectScoaFunds.AnyAsync(e => e.ProjectScoaFund_ID == id)) return NotFound(); throw; }
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOAFundId = model.ScoaFundID; });
          return NoContent();
      }

      [HttpDelete("plan-project-scoa-funds/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectScoaFunds(int id)
      {
          var item = await _db.Plan_ProjectScoaFunds.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectScoaFunds.Remove(item);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(item.ProjectID, pi => { pi.SCOAFundId = null; });
          return NoContent();
      }

      // === Plan_ProjectScoaRegions ===
      [HttpGet("plan-project-scoa-regions")]
      public async Task<IActionResult> GetAllPlan_ProjectScoaRegions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectScoaRegions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-project-scoa-regions/{id}")]
      public async Task<IActionResult> GetPlan_ProjectScoaRegionsById(int id)
      {
          var item = await _db.Plan_ProjectScoaRegions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project-scoa-regions")]
      public async Task<IActionResult> CreatePlan_ProjectScoaRegions([FromBody] Plan_ProjectScoaRegions model)
      {
          _db.Plan_ProjectScoaRegions.Add(model);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOARegionId = model.ScoaRegionID; });
          return CreatedAtAction(nameof(GetPlan_ProjectScoaRegionsById), new { id = model.ProjectScoaRegion_ID }, model);
      }

      [HttpPut("plan-project-scoa-regions/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectScoaRegions(int id, [FromBody] Plan_ProjectScoaRegions model)
      {
          if (id != model.ProjectScoaRegion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectScoaRegions.AnyAsync(e => e.ProjectScoaRegion_ID == id)) return NotFound(); throw; }
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOARegionId = model.ScoaRegionID; });
          return NoContent();
      }

      [HttpDelete("plan-project-scoa-regions/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectScoaRegions(int id)
      {
          var item = await _db.Plan_ProjectScoaRegions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectScoaRegions.Remove(item);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(item.ProjectID, pi => { pi.SCOARegionId = null; });
          return NoContent();
      }


      // === Plan_ProjectScoaItem ===
      [HttpGet("plan-project-scoa-item")]
      public async Task<IActionResult> GetAllPlan_ProjectScoaItem([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_ProjectScoaItem.AsQueryable();
          var total = await q.CountAsync();
          var data  = await q.OrderBy(x => x.ProjectScoaItem_ID).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
          return Ok(new { total, data });
      }

      [HttpGet("plan-project-scoa-item/{id}")]
      public async Task<IActionResult> GetPlan_ProjectScoaItemById(int id)
      {
          var item = await _db.Plan_ProjectScoaItem.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-project-scoa-item")]
      public async Task<IActionResult> CreatePlan_ProjectScoaItem([FromBody] Plan_ProjectScoaItem model)
      {
          _db.Plan_ProjectScoaItem.Add(model);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOAItemID = model.ScoaItemID; });
          return CreatedAtAction(nameof(GetPlan_ProjectScoaItemById), new { id = model.ProjectScoaItem_ID }, model);
      }

      [HttpPut("plan-project-scoa-item/{id}")]
      public async Task<IActionResult> UpdatePlan_ProjectScoaItem(int id, [FromBody] Plan_ProjectScoaItem model)
      {
          if (id != model.ProjectScoaItem_ID) return BadRequest();
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_ProjectScoaItem.AnyAsync(e => e.ProjectScoaItem_ID == id)) return NotFound(); throw; }
          await SyncPlanProjectItemField(model.ProjectID, pi => { pi.SCOAItemID = model.ScoaItemID; });
          return NoContent();
      }

      [HttpDelete("plan-project-scoa-item/{id}")]
      public async Task<IActionResult> DeletePlan_ProjectScoaItem(int id)
      {
          var item = await _db.Plan_ProjectScoaItem.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_ProjectScoaItem.Remove(item);
          await _db.SaveChangesAsync();
          await SyncPlanProjectItemField(item.ProjectID, pi => { pi.SCOAItemID = 0; });
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
          model.PlanProjectItemCode = model.PlanProjectItem_ID;
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


      // ── Helper: sync a SCOA segment field back to every Plan_ProjectItem row for the given project ──
      private async Task SyncPlanProjectItemField(int projectId, Action<Plan_ProjectItem> applyField)
      {
          var rows = await _db.Plan_ProjectItem.Where(pi => pi.ProjectID == projectId).ToListAsync();
          if (!rows.Any()) return;
          foreach (var row in rows) applyField(row);
          await _db.SaveChangesAsync();
      }
  }
  