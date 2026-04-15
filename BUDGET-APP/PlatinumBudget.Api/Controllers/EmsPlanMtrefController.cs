using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-mtref")]
  public class EmsPlanMtrefController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanMtrefController(BudgetDbContext db) => _db = db;
  
      // === Plan_GetApprovedVirementFromSP_Temp ===
      [HttpGet("plan-getapprovedvirementfromsp-temp")]
      public async Task<IActionResult> GetAllPlan_GetApprovedVirementFromSP_Temp([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_GetApprovedVirementFromSP_Temp.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-getapprovedvirementfromsp-temp/{id}")]
      public async Task<IActionResult> GetPlan_GetApprovedVirementFromSP_TempById(int id)
      {
          var item = await _db.Plan_GetApprovedVirementFromSP_Temp.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-getapprovedvirementfromsp-temp")]
      public async Task<IActionResult> CreatePlan_GetApprovedVirementFromSP_Temp([FromBody] Plan_GetApprovedVirementFromSP_Temp model)
      {
          _db.Plan_GetApprovedVirementFromSP_Temp.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_GetApprovedVirementFromSP_TempById), new { id = model.Rownumber }, model);
      }

      [HttpPut("plan-getapprovedvirementfromsp-temp/{id}")]
      public async Task<IActionResult> UpdatePlan_GetApprovedVirementFromSP_Temp(int id, [FromBody] Plan_GetApprovedVirementFromSP_Temp model)
      {
          if (id != model.Rownumber) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_GetApprovedVirementFromSP_Temp.AnyAsync(e => e.Rownumber == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-getapprovedvirementfromsp-temp/{id}")]
      public async Task<IActionResult> DeletePlan_GetApprovedVirementFromSP_Temp(int id)
      {
          var item = await _db.Plan_GetApprovedVirementFromSP_Temp.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_GetApprovedVirementFromSP_Temp.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_IDPMTREFApproval ===
      [HttpGet("plan-idpmtrefapproval")]
      public async Task<IActionResult> GetAllPlan_IDPMTREFApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_IDPMTREFApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-idpmtrefapproval/{id}")]
      public async Task<IActionResult> GetPlan_IDPMTREFApprovalById(long id)
      {
          var item = await _db.Plan_IDPMTREFApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-idpmtrefapproval")]
      public async Task<IActionResult> CreatePlan_IDPMTREFApproval([FromBody] Plan_IDPMTREFApproval model)
      {
          _db.Plan_IDPMTREFApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_IDPMTREFApprovalById), new { id = model.IDPMTREFApproval_Id }, model);
      }

      [HttpPut("plan-idpmtrefapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_IDPMTREFApproval(long id, [FromBody] Plan_IDPMTREFApproval model)
      {
          if (id != model.IDPMTREFApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_IDPMTREFApproval.AnyAsync(e => e.IDPMTREFApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-idpmtrefapproval/{id}")]
      public async Task<IActionResult> DeletePlan_IDPMTREFApproval(long id)
      {
          var item = await _db.Plan_IDPMTREFApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_IDPMTREFApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_MTREFApproval ===
      [HttpGet("plan-mtrefapproval")]
      public async Task<IActionResult> GetAllPlan_MTREFApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_MTREFApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-mtrefapproval/{id}")]
      public async Task<IActionResult> GetPlan_MTREFApprovalById(long id)
      {
          var item = await _db.Plan_MTREFApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-mtrefapproval")]
      public async Task<IActionResult> CreatePlan_MTREFApproval([FromBody] Plan_MTREFApproval model)
      {
          _db.Plan_MTREFApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_MTREFApprovalById), new { id = model.IDPMTREFApproval_Id }, model);
      }

      [HttpPut("plan-mtrefapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_MTREFApproval(long id, [FromBody] Plan_MTREFApproval model)
      {
          if (id != model.IDPMTREFApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_MTREFApproval.AnyAsync(e => e.IDPMTREFApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-mtrefapproval/{id}")]
      public async Task<IActionResult> DeletePlan_MTREFApproval(long id)
      {
          var item = await _db.Plan_MTREFApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_MTREFApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_MTREFDraft ===
      [HttpGet("plan-mtrefdraft")]
      public async Task<IActionResult> GetAllPlan_MTREFDraft([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_MTREFDraft.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-mtrefdraft/{id}")]
      public async Task<IActionResult> GetPlan_MTREFDraftById(long id)
      {
          var item = await _db.Plan_MTREFDraft.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-mtrefdraft")]
      public async Task<IActionResult> CreatePlan_MTREFDraft([FromBody] Plan_MTREFDraft model)
      {
          _db.Plan_MTREFDraft.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_MTREFDraftById), new { id = model.MTREFDarft_Id }, model);
      }

      [HttpPut("plan-mtrefdraft/{id}")]
      public async Task<IActionResult> UpdatePlan_MTREFDraft(long id, [FromBody] Plan_MTREFDraft model)
      {
          if (id != model.MTREFDarft_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_MTREFDraft.AnyAsync(e => e.MTREFDarft_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-mtrefdraft/{id}")]
      public async Task<IActionResult> DeletePlan_MTREFDraft(long id)
      {
          var item = await _db.Plan_MTREFDraft.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_MTREFDraft.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_TrackChanges ===
      [HttpGet("plan-trackchanges")]
      public async Task<IActionResult> GetAllPlan_TrackChanges([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_TrackChanges.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-trackchanges/{id}")]
      public async Task<IActionResult> GetPlan_TrackChangesById(long id)
      {
          var item = await _db.Plan_TrackChanges.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-trackchanges")]
      public async Task<IActionResult> CreatePlan_TrackChanges([FromBody] Plan_TrackChanges model)
      {
          _db.Plan_TrackChanges.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_TrackChangesById), new { id = model.TrackChanges_ID }, model);
      }

      [HttpPut("plan-trackchanges/{id}")]
      public async Task<IActionResult> UpdatePlan_TrackChanges(long id, [FromBody] Plan_TrackChanges model)
      {
          if (id != model.TrackChanges_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_TrackChanges.AnyAsync(e => e.TrackChanges_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-trackchanges/{id}")]
      public async Task<IActionResult> DeletePlan_TrackChanges(long id)
      {
          var item = await _db.Plan_TrackChanges.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_TrackChanges.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_TrackChangesVirement ===
      [HttpGet("plan-trackchangesvirement")]
      public async Task<IActionResult> GetAllPlan_TrackChangesVirement([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_TrackChangesVirement.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-trackchangesvirement/{id}")]
      public async Task<IActionResult> GetPlan_TrackChangesVirementById(int id)
      {
          var item = await _db.Plan_TrackChangesVirement.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-trackchangesvirement")]
      public async Task<IActionResult> CreatePlan_TrackChangesVirement([FromBody] Plan_TrackChangesVirement model)
      {
          _db.Plan_TrackChangesVirement.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_TrackChangesVirementById), new { id = model.TrackChangesVirement_Id }, model);
      }

      [HttpPut("plan-trackchangesvirement/{id}")]
      public async Task<IActionResult> UpdatePlan_TrackChangesVirement(int id, [FromBody] Plan_TrackChangesVirement model)
      {
          if (id != model.TrackChangesVirement_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_TrackChangesVirement.AnyAsync(e => e.TrackChangesVirement_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-trackchangesvirement/{id}")]
      public async Task<IActionResult> DeletePlan_TrackChangesVirement(int id)
      {
          var item = await _db.Plan_TrackChangesVirement.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_TrackChangesVirement.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_TrackExceptions ===
      [HttpGet("plan-trackexceptions")]
      public async Task<IActionResult> GetAllPlan_TrackExceptions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_TrackExceptions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-trackexceptions/{id}")]
      public async Task<IActionResult> GetPlan_TrackExceptionsById(int id)
      {
          var item = await _db.Plan_TrackExceptions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-trackexceptions")]
      public async Task<IActionResult> CreatePlan_TrackExceptions([FromBody] Plan_TrackExceptions model)
      {
          _db.Plan_TrackExceptions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_TrackExceptionsById), new { id = model.TrackException_Id }, model);
      }

      [HttpPut("plan-trackexceptions/{id}")]
      public async Task<IActionResult> UpdatePlan_TrackExceptions(int id, [FromBody] Plan_TrackExceptions model)
      {
          if (id != model.TrackException_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_TrackExceptions.AnyAsync(e => e.TrackException_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-trackexceptions/{id}")]
      public async Task<IActionResult> DeletePlan_TrackExceptions(int id)
      {
          var item = await _db.Plan_TrackExceptions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_TrackExceptions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  