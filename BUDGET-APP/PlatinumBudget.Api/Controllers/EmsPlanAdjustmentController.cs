using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-adjustment")]
  public class EmsPlanAdjustmentController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanAdjustmentController(BudgetDbContext db) => _db = db;
  
      // === Plan_AdjBudgetTemp ===
      [HttpGet("plan-adjbudgettemp")]
      public async Task<IActionResult> GetAllPlan_AdjBudgetTemp([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjBudgetTemp.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjbudgettemp/{id}")]
      public async Task<IActionResult> GetPlan_AdjBudgetTempById(int id)
      {
          var item = await _db.Plan_AdjBudgetTemp.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjbudgettemp")]
      public async Task<IActionResult> CreatePlan_AdjBudgetTemp([FromBody] Plan_AdjBudgetTemp model)
      {
          _db.Plan_AdjBudgetTemp.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjBudgetTempById), new { id = model.IDCount }, model);
      }

      [HttpPut("plan-adjbudgettemp/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjBudgetTemp(int id, [FromBody] Plan_AdjBudgetTemp model)
      {
          if (id != model.IDCount) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjBudgetTemp.AnyAsync(e => e.IDCount == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjbudgettemp/{id}")]
      public async Task<IActionResult> DeletePlan_AdjBudgetTemp(int id)
      {
          var item = await _db.Plan_AdjBudgetTemp.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjBudgetTemp.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_Adjustment ===
      [HttpGet("plan-adjustment")]
      public async Task<IActionResult> GetAllPlan_Adjustment([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_Adjustment.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustment/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentById(int id)
      {
          var item = await _db.Plan_Adjustment.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustment")]
      public async Task<IActionResult> CreatePlan_Adjustment([FromBody] Plan_Adjustment model)
      {
          _db.Plan_Adjustment.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentById), new { id = model.AdjustmentBudget_Id }, model);
      }

      [HttpPut("plan-adjustment/{id}")]
      public async Task<IActionResult> UpdatePlan_Adjustment(int id, [FromBody] Plan_Adjustment model)
      {
          if (id != model.AdjustmentBudget_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_Adjustment.AnyAsync(e => e.AdjustmentBudget_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustment/{id}")]
      public async Task<IActionResult> DeletePlan_Adjustment(int id)
      {
          var item = await _db.Plan_Adjustment.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_Adjustment.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentApprovalRejections ===
      [HttpGet("plan-adjustmentapprovalrejections")]
      public async Task<IActionResult> GetAllPlan_AdjustmentApprovalRejections([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentApprovalRejections.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentapprovalrejections/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentApprovalRejectionsById(int id)
      {
          var item = await _db.Plan_AdjustmentApprovalRejections.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentapprovalrejections")]
      public async Task<IActionResult> CreatePlan_AdjustmentApprovalRejections([FromBody] Plan_AdjustmentApprovalRejections model)
      {
          _db.Plan_AdjustmentApprovalRejections.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentApprovalRejectionsById), new { id = model.AdjustmentApprovalRejectionId }, model);
      }

      [HttpPut("plan-adjustmentapprovalrejections/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentApprovalRejections(int id, [FromBody] Plan_AdjustmentApprovalRejections model)
      {
          if (id != model.AdjustmentApprovalRejectionId) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentApprovalRejections.AnyAsync(e => e.AdjustmentApprovalRejectionId == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentapprovalrejections/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentApprovalRejections(int id)
      {
          var item = await _db.Plan_AdjustmentApprovalRejections.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentApprovalRejections.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentBudgetApproval ===
      [HttpGet("plan-adjustmentbudgetapproval")]
      public async Task<IActionResult> GetAllPlan_AdjustmentBudgetApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentBudgetApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentbudgetapproval/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentBudgetApprovalById(long id)
      {
          var item = await _db.Plan_AdjustmentBudgetApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentbudgetapproval")]
      public async Task<IActionResult> CreatePlan_AdjustmentBudgetApproval([FromBody] Plan_AdjustmentBudgetApproval model)
      {
          _db.Plan_AdjustmentBudgetApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentBudgetApprovalById), new { id = model.AdjustmentBudgetApproval_Id }, model);
      }

      [HttpPut("plan-adjustmentbudgetapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentBudgetApproval(long id, [FromBody] Plan_AdjustmentBudgetApproval model)
      {
          if (id != model.AdjustmentBudgetApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentBudgetApproval.AnyAsync(e => e.AdjustmentBudgetApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentbudgetapproval/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentBudgetApproval(long id)
      {
          var item = await _db.Plan_AdjustmentBudgetApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentBudgetApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentBudgetPolicyApproval ===
      [HttpGet("plan-adjustmentbudgetpolicyapproval")]
      public async Task<IActionResult> GetAllPlan_AdjustmentBudgetPolicyApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentBudgetPolicyApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentbudgetpolicyapproval/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentBudgetPolicyApprovalById(long id)
      {
          var item = await _db.Plan_AdjustmentBudgetPolicyApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentbudgetpolicyapproval")]
      public async Task<IActionResult> CreatePlan_AdjustmentBudgetPolicyApproval([FromBody] Plan_AdjustmentBudgetPolicyApproval model)
      {
          _db.Plan_AdjustmentBudgetPolicyApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentBudgetPolicyApprovalById), new { id = model.AdjustmentBudgetPolicyApproval_Id }, model);
      }

      [HttpPut("plan-adjustmentbudgetpolicyapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentBudgetPolicyApproval(long id, [FromBody] Plan_AdjustmentBudgetPolicyApproval model)
      {
          if (id != model.AdjustmentBudgetPolicyApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentBudgetPolicyApproval.AnyAsync(e => e.AdjustmentBudgetPolicyApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentbudgetpolicyapproval/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentBudgetPolicyApproval(long id)
      {
          var item = await _db.Plan_AdjustmentBudgetPolicyApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentBudgetPolicyApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentBudgetVersion ===
      [HttpGet("plan-adjustmentbudgetversion")]
      public async Task<IActionResult> GetAllPlan_AdjustmentBudgetVersion([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentBudgetVersion.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentbudgetversion/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentBudgetVersionById(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersion.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentbudgetversion")]
      public async Task<IActionResult> CreatePlan_AdjustmentBudgetVersion([FromBody] Plan_AdjustmentBudgetVersion model)
      {
          _db.Plan_AdjustmentBudgetVersion.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentBudgetVersionById), new { id = model.AdjustmentBudgetVersion_ID }, model);
      }

      [HttpPut("plan-adjustmentbudgetversion/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentBudgetVersion(int id, [FromBody] Plan_AdjustmentBudgetVersion model)
      {
          if (id != model.AdjustmentBudgetVersion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentBudgetVersion.AnyAsync(e => e.AdjustmentBudgetVersion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentbudgetversion/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentBudgetVersion(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersion.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentBudgetVersion.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentBudgetVersionDetail ===
      [HttpGet("plan-adjustmentbudgetversiondetail")]
      public async Task<IActionResult> GetAllPlan_AdjustmentBudgetVersionDetail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentBudgetVersionDetail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentbudgetversiondetail/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentBudgetVersionDetailById(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersionDetail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentbudgetversiondetail")]
      public async Task<IActionResult> CreatePlan_AdjustmentBudgetVersionDetail([FromBody] Plan_AdjustmentBudgetVersionDetail model)
      {
          _db.Plan_AdjustmentBudgetVersionDetail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentBudgetVersionDetailById), new { id = model.AdjustmentBudgetVersionDetail_ID }, model);
      }

      [HttpPut("plan-adjustmentbudgetversiondetail/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentBudgetVersionDetail(int id, [FromBody] Plan_AdjustmentBudgetVersionDetail model)
      {
          if (id != model.AdjustmentBudgetVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentBudgetVersionDetail.AnyAsync(e => e.AdjustmentBudgetVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentbudgetversiondetail/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentBudgetVersionDetail(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersionDetail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentBudgetVersionDetail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentBudgetVersionMonths ===
      [HttpGet("plan-adjustmentbudgetversionmonths")]
      public async Task<IActionResult> GetAllPlan_AdjustmentBudgetVersionMonths([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentBudgetVersionMonths.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentbudgetversionmonths/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentBudgetVersionMonthsById(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersionMonths.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentbudgetversionmonths")]
      public async Task<IActionResult> CreatePlan_AdjustmentBudgetVersionMonths([FromBody] Plan_AdjustmentBudgetVersionMonths model)
      {
          _db.Plan_AdjustmentBudgetVersionMonths.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentBudgetVersionMonthsById), new { id = model.AdjustmentBudgetVersionMonth_ID }, model);
      }

      [HttpPut("plan-adjustmentbudgetversionmonths/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentBudgetVersionMonths(int id, [FromBody] Plan_AdjustmentBudgetVersionMonths model)
      {
          if (id != model.AdjustmentBudgetVersionMonth_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentBudgetVersionMonths.AnyAsync(e => e.AdjustmentBudgetVersionMonth_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentbudgetversionmonths/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentBudgetVersionMonths(int id)
      {
          var item = await _db.Plan_AdjustmentBudgetVersionMonths.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentBudgetVersionMonths.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingBudgetVersion ===
      [HttpGet("plan-adjustmentfundingbudgetversion")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingBudgetVersion([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingBudgetVersion.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingbudgetversion/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingBudgetVersionById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingBudgetVersion.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingbudgetversion")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingBudgetVersion([FromBody] Plan_AdjustmentFundingBudgetVersion model)
      {
          _db.Plan_AdjustmentFundingBudgetVersion.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingBudgetVersionById), new { id = model.AdjustmentFundingBudgetVersion_ID }, model);
      }

      [HttpPut("plan-adjustmentfundingbudgetversion/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingBudgetVersion(int id, [FromBody] Plan_AdjustmentFundingBudgetVersion model)
      {
          if (id != model.AdjustmentFundingBudgetVersion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingBudgetVersion.AnyAsync(e => e.AdjustmentFundingBudgetVersion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingbudgetversion/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingBudgetVersion(int id)
      {
          var item = await _db.Plan_AdjustmentFundingBudgetVersion.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingBudgetVersion.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingBudgetVersionDetails ===
      [HttpGet("plan-adjustmentfundingbudgetversiondetails")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingBudgetVersionDetails([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingBudgetVersionDetails.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingBudgetVersionDetailsById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingBudgetVersionDetails.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingbudgetversiondetails")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingBudgetVersionDetails([FromBody] Plan_AdjustmentFundingBudgetVersionDetails model)
      {
          _db.Plan_AdjustmentFundingBudgetVersionDetails.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingBudgetVersionDetailsById), new { id = model.AdjustmentFundingBudgetVersionDetail_Id }, model);
      }

      [HttpPut("plan-adjustmentfundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingBudgetVersionDetails(int id, [FromBody] Plan_AdjustmentFundingBudgetVersionDetails model)
      {
          if (id != model.AdjustmentFundingBudgetVersionDetail_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingBudgetVersionDetails.AnyAsync(e => e.AdjustmentFundingBudgetVersionDetail_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingbudgetversiondetails/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingBudgetVersionDetails(int id)
      {
          var item = await _db.Plan_AdjustmentFundingBudgetVersionDetails.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingBudgetVersionDetails.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingSourceBudget_Detail ===
      [HttpGet("plan-adjustmentfundingsourcebudget-detail")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingSourceBudget_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingSourceBudget_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingSourceBudget_DetailById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceBudget_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingsourcebudget-detail")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingSourceBudget_Detail([FromBody] Plan_AdjustmentFundingSourceBudget_Detail model)
      {
          _db.Plan_AdjustmentFundingSourceBudget_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingSourceBudget_DetailById), new { id = model.AdjustmentFundingSourceBudgetDetail_ID }, model);
      }

      [HttpPut("plan-adjustmentfundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingSourceBudget_Detail(int id, [FromBody] Plan_AdjustmentFundingSourceBudget_Detail model)
      {
          if (id != model.AdjustmentFundingSourceBudgetDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingSourceBudget_Detail.AnyAsync(e => e.AdjustmentFundingSourceBudgetDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingsourcebudget-detail/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingSourceBudget_Detail(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceBudget_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingSourceBudget_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingSourceBudget_Header ===
      [HttpGet("plan-adjustmentfundingsourcebudget-header")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingSourceBudget_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingSourceBudget_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingsourcebudget-header/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingSourceBudget_HeaderById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceBudget_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingsourcebudget-header")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingSourceBudget_Header([FromBody] Plan_AdjustmentFundingSourceBudget_Header model)
      {
          _db.Plan_AdjustmentFundingSourceBudget_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingSourceBudget_HeaderById), new { id = model.AdjustmentFundingSourceBudgetHeader_ID }, model);
      }

      [HttpPut("plan-adjustmentfundingsourcebudget-header/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingSourceBudget_Header(int id, [FromBody] Plan_AdjustmentFundingSourceBudget_Header model)
      {
          if (id != model.AdjustmentFundingSourceBudgetHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingSourceBudget_Header.AnyAsync(e => e.AdjustmentFundingSourceBudgetHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingsourcebudget-header/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingSourceBudget_Header(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceBudget_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingSourceBudget_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingSourceChanges ===
      [HttpGet("plan-adjustmentfundingsourcechanges")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingSourceChanges([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingSourceChanges.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingsourcechanges/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingSourceChangesById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceChanges.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingsourcechanges")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingSourceChanges([FromBody] Plan_AdjustmentFundingSourceChanges model)
      {
          _db.Plan_AdjustmentFundingSourceChanges.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingSourceChangesById), new { id = model.PlanAdjustmentFundingSourceChange_ID }, model);
      }

      [HttpPut("plan-adjustmentfundingsourcechanges/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingSourceChanges(int id, [FromBody] Plan_AdjustmentFundingSourceChanges model)
      {
          if (id != model.PlanAdjustmentFundingSourceChange_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingSourceChanges.AnyAsync(e => e.PlanAdjustmentFundingSourceChange_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingsourcechanges/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingSourceChanges(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceChanges.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingSourceChanges.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentFundingSourceDocs ===
      [HttpGet("plan-adjustmentfundingsourcedocs")]
      public async Task<IActionResult> GetAllPlan_AdjustmentFundingSourceDocs([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentFundingSourceDocs.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentfundingsourcedocs/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentFundingSourceDocsById(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceDocs.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentfundingsourcedocs")]
      public async Task<IActionResult> CreatePlan_AdjustmentFundingSourceDocs([FromBody] Plan_AdjustmentFundingSourceDocs model)
      {
          _db.Plan_AdjustmentFundingSourceDocs.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentFundingSourceDocsById), new { id = model.AdjustmentFundingSourceDocs_ID }, model);
      }

      [HttpPut("plan-adjustmentfundingsourcedocs/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentFundingSourceDocs(int id, [FromBody] Plan_AdjustmentFundingSourceDocs model)
      {
          if (id != model.AdjustmentFundingSourceDocs_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentFundingSourceDocs.AnyAsync(e => e.AdjustmentFundingSourceDocs_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentfundingsourcedocs/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentFundingSourceDocs(int id)
      {
          var item = await _db.Plan_AdjustmentFundingSourceDocs.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentFundingSourceDocs.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentPolicyApproval ===
      [HttpGet("plan-adjustmentpolicyapproval")]
      public async Task<IActionResult> GetAllPlan_AdjustmentPolicyApproval([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentPolicyApproval.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentpolicyapproval/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentPolicyApprovalById(long id)
      {
          var item = await _db.Plan_AdjustmentPolicyApproval.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentpolicyapproval")]
      public async Task<IActionResult> CreatePlan_AdjustmentPolicyApproval([FromBody] Plan_AdjustmentPolicyApproval model)
      {
          _db.Plan_AdjustmentPolicyApproval.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentPolicyApprovalById), new { id = model.AdjustmentPolicyApproval_Id }, model);
      }

      [HttpPut("plan-adjustmentpolicyapproval/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentPolicyApproval(long id, [FromBody] Plan_AdjustmentPolicyApproval model)
      {
          if (id != model.AdjustmentPolicyApproval_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentPolicyApproval.AnyAsync(e => e.AdjustmentPolicyApproval_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentpolicyapproval/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentPolicyApproval(long id)
      {
          var item = await _db.Plan_AdjustmentPolicyApproval.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentPolicyApproval.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProject ===
      [HttpGet("plan-adjustmentproject")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProject([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProject.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentproject/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectById(int id)
      {
          var item = await _db.Plan_AdjustmentProject.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentproject")]
      public async Task<IActionResult> CreatePlan_AdjustmentProject([FromBody] Plan_AdjustmentProject model)
      {
          _db.Plan_AdjustmentProject.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectById), new { id = model.AdjustmentProject_ID }, model);
      }

      [HttpPut("plan-adjustmentproject/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProject(int id, [FromBody] Plan_AdjustmentProject model)
      {
          if (id != model.AdjustmentProject_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProject.AnyAsync(e => e.AdjustmentProject_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentproject/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProject(int id)
      {
          var item = await _db.Plan_AdjustmentProject.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProject.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectCosting ===
      [HttpGet("plan-adjustmentprojectcosting")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectCosting([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectCosting.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectcosting/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectCostingById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectCosting.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectcosting")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectCosting([FromBody] Plan_AdjustmentProjectCosting model)
      {
          _db.Plan_AdjustmentProjectCosting.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectCostingById), new { id = model.AdjustmentProjectCosting_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectcosting/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectCosting(int id, [FromBody] Plan_AdjustmentProjectCosting model)
      {
          if (id != model.AdjustmentProjectCosting_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectCosting.AnyAsync(e => e.AdjustmentProjectCosting_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectcosting/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectCosting(int id)
      {
          var item = await _db.Plan_AdjustmentProjectCosting.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectCosting.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectDivisions ===
      [HttpGet("plan-adjustmentprojectdivisions")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectDivisions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectDivisions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectdivisions/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectDivisionsById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectDivisions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectdivisions")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectDivisions([FromBody] Plan_AdjustmentProjectDivisions model)
      {
          _db.Plan_AdjustmentProjectDivisions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectDivisionsById), new { id = model.AdjustmentProjectDivision_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectdivisions/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectDivisions(int id, [FromBody] Plan_AdjustmentProjectDivisions model)
      {
          if (id != model.AdjustmentProjectDivision_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectDivisions.AnyAsync(e => e.AdjustmentProjectDivision_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectdivisions/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectDivisions(int id)
      {
          var item = await _db.Plan_AdjustmentProjectDivisions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectDivisions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectFunctions ===
      [HttpGet("plan-adjustmentprojectfunctions")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectFunctions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectFunctions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectfunctions/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectFunctionsById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFunctions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectfunctions")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectFunctions([FromBody] Plan_AdjustmentProjectFunctions model)
      {
          _db.Plan_AdjustmentProjectFunctions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectFunctionsById), new { id = model.AdjustmentProjectFunction_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectfunctions/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectFunctions(int id, [FromBody] Plan_AdjustmentProjectFunctions model)
      {
          if (id != model.AdjustmentProjectFunction_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectFunctions.AnyAsync(e => e.AdjustmentProjectFunction_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectfunctions/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectFunctions(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFunctions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectFunctions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectFund ===
      [HttpGet("plan-adjustmentprojectfund")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectFund([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectFund.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectfund/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectFundById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFund.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectfund")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectFund([FromBody] Plan_AdjustmentProjectFund model)
      {
          _db.Plan_AdjustmentProjectFund.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectFundById), new { id = model.AdjustmentProjectFund_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectfund/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectFund(int id, [FromBody] Plan_AdjustmentProjectFund model)
      {
          if (id != model.AdjustmentProjectFund_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectFund.AnyAsync(e => e.AdjustmentProjectFund_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectfund/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectFund(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFund.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectFund.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectFundYear ===
      [HttpGet("plan-adjustmentprojectfundyear")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectFundYear([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectFundYear.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectfundyear/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectFundYearById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFundYear.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectfundyear")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectFundYear([FromBody] Plan_AdjustmentProjectFundYear model)
      {
          _db.Plan_AdjustmentProjectFundYear.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectFundYearById), new { id = model.AdjustmentProjectFundYear_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectfundyear/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectFundYear(int id, [FromBody] Plan_AdjustmentProjectFundYear model)
      {
          if (id != model.AdjustmentProjectFundYear_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectFundYear.AnyAsync(e => e.AdjustmentProjectFundYear_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectfundyear/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectFundYear(int id)
      {
          var item = await _db.Plan_AdjustmentProjectFundYear.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectFundYear.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectIDP ===
      [HttpGet("plan-adjustmentprojectidp")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectIDP([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectIDP.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectidp/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectIDPById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectIDP.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectidp")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectIDP([FromBody] Plan_AdjustmentProjectIDP model)
      {
          _db.Plan_AdjustmentProjectIDP.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectIDPById), new { id = model.AdjustmentProjectIDP_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectidp/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectIDP(int id, [FromBody] Plan_AdjustmentProjectIDP model)
      {
          if (id != model.AdjustmentProjectIDP_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectIDP.AnyAsync(e => e.AdjustmentProjectIDP_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectidp/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectIDP(int id)
      {
          var item = await _db.Plan_AdjustmentProjectIDP.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectIDP.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectItem ===
      [HttpGet("plan-adjustmentprojectitem")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectItem([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectItem.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectitem/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectItemById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItem.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectitem")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectItem([FromBody] Plan_AdjustmentProjectItem model)
      {
          _db.Plan_AdjustmentProjectItem.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectItemById), new { id = model.PlanAdjustmentProjectItem_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectitem/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectItem(int id, [FromBody] Plan_AdjustmentProjectItem model)
      {
          if (id != model.PlanAdjustmentProjectItem_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectItem.AnyAsync(e => e.PlanAdjustmentProjectItem_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectitem/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectItem(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItem.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectItem.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectItemDocs ===
      [HttpGet("plan-adjustmentprojectitemdocs")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectItemDocs([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectItemDocs.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectitemdocs/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectItemDocsById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItemDocs.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectitemdocs")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectItemDocs([FromBody] Plan_AdjustmentProjectItemDocs model)
      {
          _db.Plan_AdjustmentProjectItemDocs.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectItemDocsById), new { id = model.AdjustmentProjectItemDocs_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectitemdocs/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectItemDocs(int id, [FromBody] Plan_AdjustmentProjectItemDocs model)
      {
          if (id != model.AdjustmentProjectItemDocs_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectItemDocs.AnyAsync(e => e.AdjustmentProjectItemDocs_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectitemdocs/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectItemDocs(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItemDocs.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectItemDocs.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectItemMonth ===
      [HttpGet("plan-adjustmentprojectitemmonth")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectItemMonth([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectItemMonth.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectitemmonth/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectItemMonthById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItemMonth.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectitemmonth")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectItemMonth([FromBody] Plan_AdjustmentProjectItemMonth model)
      {
          _db.Plan_AdjustmentProjectItemMonth.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectItemMonthById), new { id = model.AdjustmentProjectItemMonth_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectitemmonth/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectItemMonth(int id, [FromBody] Plan_AdjustmentProjectItemMonth model)
      {
          if (id != model.AdjustmentProjectItemMonth_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectItemMonth.AnyAsync(e => e.AdjustmentProjectItemMonth_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectitemmonth/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectItemMonth(int id)
      {
          var item = await _db.Plan_AdjustmentProjectItemMonth.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectItemMonth.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectRecommendation ===
      [HttpGet("plan-adjustmentprojectrecommendation")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectRecommendation([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectRecommendation.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectrecommendation/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectRecommendationById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRecommendation.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectrecommendation")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectRecommendation([FromBody] Plan_AdjustmentProjectRecommendation model)
      {
          _db.Plan_AdjustmentProjectRecommendation.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectRecommendationById), new { id = model.AdjustmentProjectRecommendation_Id }, model);
      }

      [HttpPut("plan-adjustmentprojectrecommendation/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectRecommendation(int id, [FromBody] Plan_AdjustmentProjectRecommendation model)
      {
          if (id != model.AdjustmentProjectRecommendation_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectRecommendation.AnyAsync(e => e.AdjustmentProjectRecommendation_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectrecommendation/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectRecommendation(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRecommendation.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectRecommendation.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectRecommendUsers ===
      [HttpGet("plan-adjustmentprojectrecommendusers")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectRecommendUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectRecommendUsers.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectrecommendusers/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectRecommendUsersById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRecommendUsers.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectrecommendusers")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectRecommendUsers([FromBody] Plan_AdjustmentProjectRecommendUsers model)
      {
          _db.Plan_AdjustmentProjectRecommendUsers.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectRecommendUsersById), new { id = model.AdjustmentProjectRecommendUser_Id }, model);
      }

      [HttpPut("plan-adjustmentprojectrecommendusers/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectRecommendUsers(int id, [FromBody] Plan_AdjustmentProjectRecommendUsers model)
      {
          if (id != model.AdjustmentProjectRecommendUser_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectRecommendUsers.AnyAsync(e => e.AdjustmentProjectRecommendUser_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectrecommendusers/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectRecommendUsers(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRecommendUsers.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectRecommendUsers.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentProjectRegions ===
      [HttpGet("plan-adjustmentprojectregions")]
      public async Task<IActionResult> GetAllPlan_AdjustmentProjectRegions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentProjectRegions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmentprojectregions/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentProjectRegionsById(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRegions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmentprojectregions")]
      public async Task<IActionResult> CreatePlan_AdjustmentProjectRegions([FromBody] Plan_AdjustmentProjectRegions model)
      {
          _db.Plan_AdjustmentProjectRegions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentProjectRegionsById), new { id = model.AdjustmentProjectRegion_ID }, model);
      }

      [HttpPut("plan-adjustmentprojectregions/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentProjectRegions(int id, [FromBody] Plan_AdjustmentProjectRegions model)
      {
          if (id != model.AdjustmentProjectRegion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentProjectRegions.AnyAsync(e => e.AdjustmentProjectRegion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmentprojectregions/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentProjectRegions(int id)
      {
          var item = await _db.Plan_AdjustmentProjectRegions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentProjectRegions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_AdjustmentTrackChanges ===
      [HttpGet("plan-adjustmenttrackchanges")]
      public async Task<IActionResult> GetAllPlan_AdjustmentTrackChanges([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_AdjustmentTrackChanges.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-adjustmenttrackchanges/{id}")]
      public async Task<IActionResult> GetPlan_AdjustmentTrackChangesById(long id)
      {
          var item = await _db.Plan_AdjustmentTrackChanges.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-adjustmenttrackchanges")]
      public async Task<IActionResult> CreatePlan_AdjustmentTrackChanges([FromBody] Plan_AdjustmentTrackChanges model)
      {
          _db.Plan_AdjustmentTrackChanges.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_AdjustmentTrackChangesById), new { id = model.AdjustmentTrackChanges_ID }, model);
      }

      [HttpPut("plan-adjustmenttrackchanges/{id}")]
      public async Task<IActionResult> UpdatePlan_AdjustmentTrackChanges(long id, [FromBody] Plan_AdjustmentTrackChanges model)
      {
          if (id != model.AdjustmentTrackChanges_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_AdjustmentTrackChanges.AnyAsync(e => e.AdjustmentTrackChanges_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-adjustmenttrackchanges/{id}")]
      public async Task<IActionResult> DeletePlan_AdjustmentTrackChanges(long id)
      {
          var item = await _db.Plan_AdjustmentTrackChanges.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_AdjustmentTrackChanges.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_SupplementaryAdjustment ===
      [HttpGet("plan-supplementaryadjustment")]
      public async Task<IActionResult> GetAllPlan_SupplementaryAdjustment([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_SupplementaryAdjustment.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-supplementaryadjustment/{id}")]
      public async Task<IActionResult> GetPlan_SupplementaryAdjustmentById(long id)
      {
          var item = await _db.Plan_SupplementaryAdjustment.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-supplementaryadjustment")]
      public async Task<IActionResult> CreatePlan_SupplementaryAdjustment([FromBody] Plan_SupplementaryAdjustment model)
      {
          _db.Plan_SupplementaryAdjustment.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_SupplementaryAdjustmentById), new { id = model.SupplementaryAdjustment_Id }, model);
      }

      [HttpPut("plan-supplementaryadjustment/{id}")]
      public async Task<IActionResult> UpdatePlan_SupplementaryAdjustment(long id, [FromBody] Plan_SupplementaryAdjustment model)
      {
          if (id != model.SupplementaryAdjustment_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_SupplementaryAdjustment.AnyAsync(e => e.SupplementaryAdjustment_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-supplementaryadjustment/{id}")]
      public async Task<IActionResult> DeletePlan_SupplementaryAdjustment(long id)
      {
          var item = await _db.Plan_SupplementaryAdjustment.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_SupplementaryAdjustment.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  