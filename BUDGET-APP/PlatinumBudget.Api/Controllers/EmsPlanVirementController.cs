using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-virement")]
  public class EmsPlanVirementController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanVirementController(BudgetDbContext db) => _db = db;
  
      // === Plan_VirementApprovalRejections ===
      [HttpGet("plan-virementapprovalrejections")]
      public async Task<IActionResult> GetAllPlan_VirementApprovalRejections([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementApprovalRejections.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementapprovalrejections/{id}")]
      public async Task<IActionResult> GetPlan_VirementApprovalRejectionsById(int id)
      {
          var item = await _db.Plan_VirementApprovalRejections.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementapprovalrejections")]
      public async Task<IActionResult> CreatePlan_VirementApprovalRejections([FromBody] Plan_VirementApprovalRejections model)
      {
          _db.Plan_VirementApprovalRejections.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementApprovalRejectionsById), new { id = model.VirementApprovalRejectionId }, model);
      }

      [HttpPut("plan-virementapprovalrejections/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementApprovalRejections(int id, [FromBody] Plan_VirementApprovalRejections model)
      {
          if (id != model.VirementApprovalRejectionId) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementApprovalRejections.AnyAsync(e => e.VirementApprovalRejectionId == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementapprovalrejections/{id}")]
      public async Task<IActionResult> DeletePlan_VirementApprovalRejections(int id)
      {
          var item = await _db.Plan_VirementApprovalRejections.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementApprovalRejections.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_VirementApprovalUsers ===
      [HttpGet("plan-virementapprovalusers")]
      public async Task<IActionResult> GetAllPlan_VirementApprovalUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementApprovalUsers.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementapprovalusers/{id}")]
      public async Task<IActionResult> GetPlan_VirementApprovalUsersById(int id)
      {
          var item = await _db.Plan_VirementApprovalUsers.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementapprovalusers")]
      public async Task<IActionResult> CreatePlan_VirementApprovalUsers([FromBody] Plan_VirementApprovalUsers model)
      {
          _db.Plan_VirementApprovalUsers.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementApprovalUsersById), new { id = model.VirementApprovalUserId }, model);
      }

      [HttpPut("plan-virementapprovalusers/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementApprovalUsers(int id, [FromBody] Plan_VirementApprovalUsers model)
      {
          if (id != model.VirementApprovalUserId) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementApprovalUsers.AnyAsync(e => e.VirementApprovalUserId == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementapprovalusers/{id}")]
      public async Task<IActionResult> DeletePlan_VirementApprovalUsers(int id)
      {
          var item = await _db.Plan_VirementApprovalUsers.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementApprovalUsers.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_VirementBudgetSplit ===
      [HttpGet("plan-virementbudgetsplit")]
      public async Task<IActionResult> GetAllPlan_VirementBudgetSplit([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementBudgetSplit.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementbudgetsplit/{id}")]
      public async Task<IActionResult> GetPlan_VirementBudgetSplitById(int id)
      {
          var item = await _db.Plan_VirementBudgetSplit.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementbudgetsplit")]
      public async Task<IActionResult> CreatePlan_VirementBudgetSplit([FromBody] Plan_VirementBudgetSplit model)
      {
          _db.Plan_VirementBudgetSplit.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementBudgetSplitById), new { id = model.VirementBudgetSplit_Id }, model);
      }

      [HttpPut("plan-virementbudgetsplit/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementBudgetSplit(int id, [FromBody] Plan_VirementBudgetSplit model)
      {
          if (id != model.VirementBudgetSplit_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementBudgetSplit.AnyAsync(e => e.VirementBudgetSplit_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementbudgetsplit/{id}")]
      public async Task<IActionResult> DeletePlan_VirementBudgetSplit(int id)
      {
          var item = await _db.Plan_VirementBudgetSplit.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementBudgetSplit.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_VirementPolicyApproval ===
      [HttpGet("plan-virementpolicyapproval")]
      public async Task<IActionResult> GetAllPlan_VirementPolicyApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementPolicyApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementpolicyapproval/{id}")]
      public async Task<IActionResult> GetPlan_VirementPolicyApprovalById(long id)
      {
          var item = await _db.Plan_VirementPolicyApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementpolicyapproval")]
      public async Task<IActionResult> CreatePlan_VirementPolicyApproval([FromBody] Plan_VirementPolicyApproval model)
      {
          _db.Plan_VirementPolicyApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementPolicyApprovalById), new { id = model.VirementPolicyApproval_Id }, model);
      }

      [HttpPut("plan-virementpolicyapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementPolicyApproval(long id, [FromBody] Plan_VirementPolicyApproval model)
      {
          if (id != model.VirementPolicyApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementPolicyApproval.AnyAsync(e => e.VirementPolicyApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementpolicyapproval/{id}")]
      public async Task<IActionResult> DeletePlan_VirementPolicyApproval(long id)
      {
          var item = await _db.Plan_VirementPolicyApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementPolicyApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_VirementPolicyVersion ===
      [HttpGet("plan-virementpolicyversion")]
      public async Task<IActionResult> GetAllPlan_VirementPolicyVersion([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementPolicyVersion.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementpolicyversion/{id}")]
      public async Task<IActionResult> GetPlan_VirementPolicyVersionById(int id)
      {
          var item = await _db.Plan_VirementPolicyVersion.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementpolicyversion")]
      public async Task<IActionResult> CreatePlan_VirementPolicyVersion([FromBody] Plan_VirementPolicyVersion model)
      {
          _db.Plan_VirementPolicyVersion.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementPolicyVersionById), new { id = model.VirementPolicyVersion_ID }, model);
      }

      [HttpPut("plan-virementpolicyversion/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementPolicyVersion(int id, [FromBody] Plan_VirementPolicyVersion model)
      {
          if (id != model.VirementPolicyVersion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementPolicyVersion.AnyAsync(e => e.VirementPolicyVersion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementpolicyversion/{id}")]
      public async Task<IActionResult> DeletePlan_VirementPolicyVersion(int id)
      {
          var item = await _db.Plan_VirementPolicyVersion.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementPolicyVersion.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_VirementPolicyVersionDetail ===
      [HttpGet("plan-virementpolicyversiondetail")]
      public async Task<IActionResult> GetAllPlan_VirementPolicyVersionDetail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_VirementPolicyVersionDetail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virementpolicyversiondetail/{id}")]
      public async Task<IActionResult> GetPlan_VirementPolicyVersionDetailById(int id)
      {
          var item = await _db.Plan_VirementPolicyVersionDetail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virementpolicyversiondetail")]
      public async Task<IActionResult> CreatePlan_VirementPolicyVersionDetail([FromBody] Plan_VirementPolicyVersionDetail model)
      {
          _db.Plan_VirementPolicyVersionDetail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementPolicyVersionDetailById), new { id = model.VirementPolicyVersionDetail_ID }, model);
      }

      [HttpPut("plan-virementpolicyversiondetail/{id}")]
      public async Task<IActionResult> UpdatePlan_VirementPolicyVersionDetail(int id, [FromBody] Plan_VirementPolicyVersionDetail model)
      {
          if (id != model.VirementPolicyVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_VirementPolicyVersionDetail.AnyAsync(e => e.VirementPolicyVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virementpolicyversiondetail/{id}")]
      public async Task<IActionResult> DeletePlan_VirementPolicyVersionDetail(int id)
      {
          var item = await _db.Plan_VirementPolicyVersionDetail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_VirementPolicyVersionDetail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_Virements ===
      [HttpGet("plan-virements")]
      public async Task<IActionResult> GetAllPlan_Virements([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Virements.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-virements/{id}")]
      public async Task<IActionResult> GetPlan_VirementsById(int id)
      {
          var item = await _db.Plan_Virements.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-virements")]
      public async Task<IActionResult> CreatePlan_Virements([FromBody] Plan_Virements model)
      {
          _db.Plan_Virements.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_VirementsById), new { id = model.VirementId }, model);
      }

      [HttpPut("plan-virements/{id}")]
      public async Task<IActionResult> UpdatePlan_Virements(int id, [FromBody] Plan_Virements model)
      {
          if (id != model.VirementId) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Virements.AnyAsync(e => e.VirementId == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-virements/{id}")]
      public async Task<IActionResult> DeletePlan_Virements(int id)
      {
          var item = await _db.Plan_Virements.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Virements.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  