using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-funding")]
  public class EmsPlanFundingController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanFundingController(BudgetDbContext db) => _db = db;
  
      // === Plan_FundingBudgetVersion ===
      [HttpGet("plan-fundingbudgetversion")]
      public async Task<IActionResult> GetAllPlan_FundingBudgetVersion([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingBudgetVersion.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingbudgetversion/{id}")]
      public async Task<IActionResult> GetPlan_FundingBudgetVersionById(int id)
      {
          var item = await _db.Plan_FundingBudgetVersion.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingbudgetversion")]
      public async Task<IActionResult> CreatePlan_FundingBudgetVersion([FromBody] Plan_FundingBudgetVersion model)
      {
          _db.Plan_FundingBudgetVersion.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingBudgetVersionById), new { id = model.FundingBudgetVersion_ID }, model);
      }

      [HttpPut("plan-fundingbudgetversion/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingBudgetVersion(int id, [FromBody] Plan_FundingBudgetVersion model)
      {
          if (id != model.FundingBudgetVersion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingBudgetVersion.AnyAsync(e => e.FundingBudgetVersion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingbudgetversion/{id}")]
      public async Task<IActionResult> DeletePlan_FundingBudgetVersion(int id)
      {
          var item = await _db.Plan_FundingBudgetVersion.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingBudgetVersion.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_FundingBudgetVersionDetails ===
      [HttpGet("plan-fundingbudgetversiondetails")]
      public async Task<IActionResult> GetAllPlan_FundingBudgetVersionDetails([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingBudgetVersionDetails.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> GetPlan_FundingBudgetVersionDetailsById(int id)
      {
          var item = await _db.Plan_FundingBudgetVersionDetails.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingbudgetversiondetails")]
      public async Task<IActionResult> CreatePlan_FundingBudgetVersionDetails([FromBody] Plan_FundingBudgetVersionDetails model)
      {
          _db.Plan_FundingBudgetVersionDetails.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingBudgetVersionDetailsById), new { id = model.FundingBudgetVersionDetail_Id }, model);
      }

      [HttpPut("plan-fundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingBudgetVersionDetails(int id, [FromBody] Plan_FundingBudgetVersionDetails model)
      {
          if (id != model.FundingBudgetVersionDetail_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingBudgetVersionDetails.AnyAsync(e => e.FundingBudgetVersionDetail_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> DeletePlan_FundingBudgetVersionDetails(int id)
      {
          var item = await _db.Plan_FundingBudgetVersionDetails.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingBudgetVersionDetails.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_FundingSourceBudget_Detail ===
      [HttpGet("plan-fundingsourcebudget-detail")]
      public async Task<IActionResult> GetAllPlan_FundingSourceBudget_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingSourceBudget_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> GetPlan_FundingSourceBudget_DetailById(int id)
      {
          var item = await _db.Plan_FundingSourceBudget_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingsourcebudget-detail")]
      public async Task<IActionResult> CreatePlan_FundingSourceBudget_Detail([FromBody] Plan_FundingSourceBudget_Detail model)
      {
          _db.Plan_FundingSourceBudget_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingSourceBudget_DetailById), new { id = model.FundingSourceBudgetDetail_ID }, model);
      }

      [HttpPut("plan-fundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingSourceBudget_Detail(int id, [FromBody] Plan_FundingSourceBudget_Detail model)
      {
          if (id != model.FundingSourceBudgetDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingSourceBudget_Detail.AnyAsync(e => e.FundingSourceBudgetDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> DeletePlan_FundingSourceBudget_Detail(int id)
      {
          var item = await _db.Plan_FundingSourceBudget_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingSourceBudget_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_FundingSourceBudget_Header ===
      [HttpGet("plan-fundingsourcebudget-header")]
      public async Task<IActionResult> GetAllPlan_FundingSourceBudget_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingSourceBudget_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingsourcebudget-header/{id}")]
      public async Task<IActionResult> GetPlan_FundingSourceBudget_HeaderById(int id)
      {
          var item = await _db.Plan_FundingSourceBudget_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingsourcebudget-header")]
      public async Task<IActionResult> CreatePlan_FundingSourceBudget_Header([FromBody] Plan_FundingSourceBudget_Header model)
      {
          _db.Plan_FundingSourceBudget_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingSourceBudget_HeaderById), new { id = model.FundingSourceBudgetHeader_ID }, model);
      }

      [HttpPut("plan-fundingsourcebudget-header/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingSourceBudget_Header(int id, [FromBody] Plan_FundingSourceBudget_Header model)
      {
          if (id != model.FundingSourceBudgetHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingSourceBudget_Header.AnyAsync(e => e.FundingSourceBudgetHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingsourcebudget-header/{id}")]
      public async Task<IActionResult> DeletePlan_FundingSourceBudget_Header(int id)
      {
          var item = await _db.Plan_FundingSourceBudget_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingSourceBudget_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_FundingSourceChanges ===
      [HttpGet("plan-fundingsourcechanges")]
      public async Task<IActionResult> GetAllPlan_FundingSourceChanges([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingSourceChanges.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingsourcechanges/{id}")]
      public async Task<IActionResult> GetPlan_FundingSourceChangesById(int id)
      {
          var item = await _db.Plan_FundingSourceChanges.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingsourcechanges")]
      public async Task<IActionResult> CreatePlan_FundingSourceChanges([FromBody] Plan_FundingSourceChanges model)
      {
          _db.Plan_FundingSourceChanges.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingSourceChangesById), new { id = model.PlanFundingSourceChange_ID }, model);
      }

      [HttpPut("plan-fundingsourcechanges/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingSourceChanges(int id, [FromBody] Plan_FundingSourceChanges model)
      {
          if (id != model.PlanFundingSourceChange_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingSourceChanges.AnyAsync(e => e.PlanFundingSourceChange_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingsourcechanges/{id}")]
      public async Task<IActionResult> DeletePlan_FundingSourceChanges(int id)
      {
          var item = await _db.Plan_FundingSourceChanges.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingSourceChanges.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_FundingSourceDocs ===
      [HttpGet("plan-fundingsourcedocs")]
      public async Task<IActionResult> GetAllPlan_FundingSourceDocs([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_FundingSourceDocs.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-fundingsourcedocs/{id}")]
      public async Task<IActionResult> GetPlan_FundingSourceDocsById(int id)
      {
          var item = await _db.Plan_FundingSourceDocs.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-fundingsourcedocs")]
      public async Task<IActionResult> CreatePlan_FundingSourceDocs([FromBody] Plan_FundingSourceDocs model)
      {
          _db.Plan_FundingSourceDocs.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_FundingSourceDocsById), new { id = model.FundingSourceDocs_ID }, model);
      }

      [HttpPut("plan-fundingsourcedocs/{id}")]
      public async Task<IActionResult> UpdatePlan_FundingSourceDocs(int id, [FromBody] Plan_FundingSourceDocs model)
      {
          if (id != model.FundingSourceDocs_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_FundingSourceDocs.AnyAsync(e => e.FundingSourceDocs_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-fundingsourcedocs/{id}")]
      public async Task<IActionResult> DeletePlan_FundingSourceDocs(int id)
      {
          var item = await _db.Plan_FundingSourceDocs.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_FundingSourceDocs.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  