using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/plan-budget")]
  public class EmsPlanBudgetController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsPlanBudgetController(BudgetDbContext db) => _db = db;
  
      // === Plan_BudgetAdjustmentExportImportVersion_Header ===
      [HttpGet("plan-budgetadjustmentexportimportversion-header")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentExportImportVersion_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentExportImportVersion_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentexportimportversion-header/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentExportImportVersion_HeaderById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentExportImportVersion_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentexportimportversion-header")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentExportImportVersion_Header([FromBody] Plan_BudgetAdjustmentExportImportVersion_Header model)
      {
          _db.Plan_BudgetAdjustmentExportImportVersion_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentExportImportVersion_HeaderById), new { id = model.BudgetAdjustmentExportImportVersionHeader_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentexportimportversion-header/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentExportImportVersion_Header(int id, [FromBody] Plan_BudgetAdjustmentExportImportVersion_Header model)
      {
          if (id != model.BudgetAdjustmentExportImportVersionHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentExportImportVersion_Header.AnyAsync(e => e.BudgetAdjustmentExportImportVersionHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentexportimportversion-header/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentExportImportVersion_Header(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentExportImportVersion_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentExportImportVersion_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetAdjustmentExportVersion_Detail ===
      [HttpGet("plan-budgetadjustmentexportversion-detail")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentExportVersion_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentExportVersion_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentexportversion-detail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentExportVersion_DetailById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentExportVersion_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentexportversion-detail")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentExportVersion_Detail([FromBody] Plan_BudgetAdjustmentExportVersion_Detail model)
      {
          _db.Plan_BudgetAdjustmentExportVersion_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentExportVersion_DetailById), new { id = model.BudgetAdjustmentExportVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentexportversion-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentExportVersion_Detail(int id, [FromBody] Plan_BudgetAdjustmentExportVersion_Detail model)
      {
          if (id != model.BudgetAdjustmentExportVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentExportVersion_Detail.AnyAsync(e => e.BudgetAdjustmentExportVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentexportversion-detail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentExportVersion_Detail(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentExportVersion_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentExportVersion_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetAdjustmentImportVersion_Detail ===
      [HttpGet("plan-budgetadjustmentimportversion-detail")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentImportVersion_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentImportVersion_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentimportversion-detail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentImportVersion_DetailById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentimportversion-detail")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentImportVersion_Detail([FromBody] Plan_BudgetAdjustmentImportVersion_Detail model)
      {
          _db.Plan_BudgetAdjustmentImportVersion_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentImportVersion_DetailById), new { id = model.BudgetAdjustmentImportVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentimportversion-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentImportVersion_Detail(int id, [FromBody] Plan_BudgetAdjustmentImportVersion_Detail model)
      {
          if (id != model.BudgetAdjustmentImportVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentImportVersion_Detail.AnyAsync(e => e.BudgetAdjustmentImportVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentimportversion-detail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentImportVersion_Detail(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentImportVersion_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetAdjustmentImportVersion_DetailException ===
      [HttpGet("plan-budgetadjustmentimportversion-detailexception")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentImportVersion_DetailException([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentImportVersion_DetailException.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentimportversion-detailexception/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentImportVersion_DetailExceptionById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_DetailException.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentimportversion-detailexception")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentImportVersion_DetailException([FromBody] Plan_BudgetAdjustmentImportVersion_DetailException model)
      {
          _db.Plan_BudgetAdjustmentImportVersion_DetailException.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentImportVersion_DetailExceptionById), new { id = model.BudgetAdjustmentImportVersionException_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentimportversion-detailexception/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentImportVersion_DetailException(int id, [FromBody] Plan_BudgetAdjustmentImportVersion_DetailException model)
      {
          if (id != model.BudgetAdjustmentImportVersionException_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentImportVersion_DetailException.AnyAsync(e => e.BudgetAdjustmentImportVersionException_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentimportversion-detailexception/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentImportVersion_DetailException(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_DetailException.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentImportVersion_DetailException.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetAdjustmentImportVersion_File ===
      [HttpGet("plan-budgetadjustmentimportversion-file")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentImportVersion_File([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentImportVersion_File.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentimportversion-file/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentImportVersion_FileById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_File.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentimportversion-file")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentImportVersion_File([FromBody] Plan_BudgetAdjustmentImportVersion_File model)
      {
          _db.Plan_BudgetAdjustmentImportVersion_File.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentImportVersion_FileById), new { id = model.BudgetAdjustmentImportVersionFile_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentimportversion-file/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentImportVersion_File(int id, [FromBody] Plan_BudgetAdjustmentImportVersion_File model)
      {
          if (id != model.BudgetAdjustmentImportVersionFile_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentImportVersion_File.AnyAsync(e => e.BudgetAdjustmentImportVersionFile_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentimportversion-file/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentImportVersion_File(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_File.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentImportVersion_File.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetAdjustmentImportVersion_OverallException ===
      [HttpGet("plan-budgetadjustmentimportversion-overallexception")]
      public async Task<IActionResult> GetAllPlan_BudgetAdjustmentImportVersion_OverallException([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetAdjustmentImportVersion_OverallException.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetadjustmentimportversion-overallexception/{id}")]
      public async Task<IActionResult> GetPlan_BudgetAdjustmentImportVersion_OverallExceptionById(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_OverallException.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetadjustmentimportversion-overallexception")]
      public async Task<IActionResult> CreatePlan_BudgetAdjustmentImportVersion_OverallException([FromBody] Plan_BudgetAdjustmentImportVersion_OverallException model)
      {
          _db.Plan_BudgetAdjustmentImportVersion_OverallException.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetAdjustmentImportVersion_OverallExceptionById), new { id = model.BudgetAdjustmentImportVersionException_ID }, model);
      }

      [HttpPut("plan-budgetadjustmentimportversion-overallexception/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetAdjustmentImportVersion_OverallException(int id, [FromBody] Plan_BudgetAdjustmentImportVersion_OverallException model)
      {
          if (id != model.BudgetAdjustmentImportVersionException_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetAdjustmentImportVersion_OverallException.AnyAsync(e => e.BudgetAdjustmentImportVersionException_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetadjustmentimportversion-overallexception/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetAdjustmentImportVersion_OverallException(int id)
      {
          var item = await _db.Plan_BudgetAdjustmentImportVersion_OverallException.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetAdjustmentImportVersion_OverallException.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetConsumption ===
      [HttpGet("plan-budgetconsumption")]
      public async Task<IActionResult> GetAllPlan_BudgetConsumption([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetConsumption.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetconsumption/{id}")]
      public async Task<IActionResult> GetPlan_BudgetConsumptionById(long id)
      {
          var item = await _db.Plan_BudgetConsumption.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetconsumption")]
      public async Task<IActionResult> CreatePlan_BudgetConsumption([FromBody] Plan_BudgetConsumption model)
      {
          _db.Plan_BudgetConsumption.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetConsumptionById), new { id = model.BudgetConsumption_ID }, model);
      }

      [HttpPut("plan-budgetconsumption/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetConsumption(long id, [FromBody] Plan_BudgetConsumption model)
      {
          if (id != model.BudgetConsumption_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetConsumption.AnyAsync(e => e.BudgetConsumption_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetconsumption/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetConsumption(long id)
      {
          var item = await _db.Plan_BudgetConsumption.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetConsumption.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetConsumption_Import ===
      [HttpGet("plan-budgetconsumption-import")]
      public async Task<IActionResult> GetAllPlan_BudgetConsumption_Import([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetConsumption_Import.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetconsumption-import/{id}")]
      public async Task<IActionResult> GetPlan_BudgetConsumption_ImportById(long id)
      {
          var item = await _db.Plan_BudgetConsumption_Import.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetconsumption-import")]
      public async Task<IActionResult> CreatePlan_BudgetConsumption_Import([FromBody] Plan_BudgetConsumption_Import model)
      {
          _db.Plan_BudgetConsumption_Import.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetConsumption_ImportById), new { id = model.BudgetConsumption_ID }, model);
      }

      [HttpPut("plan-budgetconsumption-import/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetConsumption_Import(long id, [FromBody] Plan_BudgetConsumption_Import model)
      {
          if (id != model.BudgetConsumption_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetConsumption_Import.AnyAsync(e => e.BudgetConsumption_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetconsumption-import/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetConsumption_Import(long id)
      {
          var item = await _db.Plan_BudgetConsumption_Import.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetConsumption_Import.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetMigration ===
      [HttpGet("plan-budgetmigration")]
      public async Task<IActionResult> GetAllPlan_BudgetMigration([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetMigration.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetmigration/{id}")]
      public async Task<IActionResult> GetPlan_BudgetMigrationById(int id)
      {
          var item = await _db.Plan_BudgetMigration.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetmigration")]
      public async Task<IActionResult> CreatePlan_BudgetMigration([FromBody] Plan_BudgetMigration model)
      {
          _db.Plan_BudgetMigration.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetMigrationById), new { id = model.BudgetMigration_Id }, model);
      }

      [HttpPut("plan-budgetmigration/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetMigration(int id, [FromBody] Plan_BudgetMigration model)
      {
          if (id != model.BudgetMigration_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetMigration.AnyAsync(e => e.BudgetMigration_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetmigration/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetMigration(int id)
      {
          var item = await _db.Plan_BudgetMigration.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetMigration.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalExportImportVersion_Header ===
      [HttpGet("plan-budgetoriginalexportimportversion-header")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalExportImportVersion_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalExportImportVersion_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalexportimportversion-header/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalExportImportVersion_HeaderById(int id)
      {
          var item = await _db.Plan_BudgetOriginalExportImportVersion_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalexportimportversion-header")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalExportImportVersion_Header([FromBody] Plan_BudgetOriginalExportImportVersion_Header model)
      {
          _db.Plan_BudgetOriginalExportImportVersion_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalExportImportVersion_HeaderById), new { id = model.BudgetOriginalExportImportVersionHeader_ID }, model);
      }

      [HttpPut("plan-budgetoriginalexportimportversion-header/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalExportImportVersion_Header(int id, [FromBody] Plan_BudgetOriginalExportImportVersion_Header model)
      {
          if (id != model.BudgetOriginalExportImportVersionHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalExportImportVersion_Header.AnyAsync(e => e.BudgetOriginalExportImportVersionHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalexportimportversion-header/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalExportImportVersion_Header(int id)
      {
          var item = await _db.Plan_BudgetOriginalExportImportVersion_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalExportImportVersion_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalExportVersion_Detail ===
      [HttpGet("plan-budgetoriginalexportversion-detail")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalExportVersion_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalExportVersion_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalexportversion-detail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalExportVersion_DetailById(int id)
      {
          var item = await _db.Plan_BudgetOriginalExportVersion_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalexportversion-detail")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalExportVersion_Detail([FromBody] Plan_BudgetOriginalExportVersion_Detail model)
      {
          _db.Plan_BudgetOriginalExportVersion_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalExportVersion_DetailById), new { id = model.BudgetOriginalExportVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetoriginalexportversion-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalExportVersion_Detail(int id, [FromBody] Plan_BudgetOriginalExportVersion_Detail model)
      {
          if (id != model.BudgetOriginalExportVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalExportVersion_Detail.AnyAsync(e => e.BudgetOriginalExportVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalexportversion-detail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalExportVersion_Detail(int id)
      {
          var item = await _db.Plan_BudgetOriginalExportVersion_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalExportVersion_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalImportVersion_Detail ===
      [HttpGet("plan-budgetoriginalimportversion-detail")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalImportVersion_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalImportVersion_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalimportversion-detail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalImportVersion_DetailById(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalimportversion-detail")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalImportVersion_Detail([FromBody] Plan_BudgetOriginalImportVersion_Detail model)
      {
          _db.Plan_BudgetOriginalImportVersion_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalImportVersion_DetailById), new { id = model.BudgetOriginalImportVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetoriginalimportversion-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalImportVersion_Detail(int id, [FromBody] Plan_BudgetOriginalImportVersion_Detail model)
      {
          if (id != model.BudgetOriginalImportVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalImportVersion_Detail.AnyAsync(e => e.BudgetOriginalImportVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalimportversion-detail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalImportVersion_Detail(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalImportVersion_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalImportVersion_DetailException ===
      [HttpGet("plan-budgetoriginalimportversion-detailexception")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalImportVersion_DetailException([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalImportVersion_DetailException.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalimportversion-detailexception/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalImportVersion_DetailExceptionById(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_DetailException.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalimportversion-detailexception")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalImportVersion_DetailException([FromBody] Plan_BudgetOriginalImportVersion_DetailException model)
      {
          _db.Plan_BudgetOriginalImportVersion_DetailException.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalImportVersion_DetailExceptionById), new { id = model.BudgetOriginalImportVersionException_ID }, model);
      }

      [HttpPut("plan-budgetoriginalimportversion-detailexception/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalImportVersion_DetailException(int id, [FromBody] Plan_BudgetOriginalImportVersion_DetailException model)
      {
          if (id != model.BudgetOriginalImportVersionException_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalImportVersion_DetailException.AnyAsync(e => e.BudgetOriginalImportVersionException_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalimportversion-detailexception/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalImportVersion_DetailException(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_DetailException.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalImportVersion_DetailException.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalImportVersion_File ===
      [HttpGet("plan-budgetoriginalimportversion-file")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalImportVersion_File([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalImportVersion_File.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalimportversion-file/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalImportVersion_FileById(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_File.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalimportversion-file")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalImportVersion_File([FromBody] Plan_BudgetOriginalImportVersion_File model)
      {
          _db.Plan_BudgetOriginalImportVersion_File.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalImportVersion_FileById), new { id = model.BudgetOriginalImportVersionFile_ID }, model);
      }

      [HttpPut("plan-budgetoriginalimportversion-file/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalImportVersion_File(int id, [FromBody] Plan_BudgetOriginalImportVersion_File model)
      {
          if (id != model.BudgetOriginalImportVersionFile_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalImportVersion_File.AnyAsync(e => e.BudgetOriginalImportVersionFile_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalimportversion-file/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalImportVersion_File(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_File.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalImportVersion_File.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetOriginalImportVersion_OverallException ===
      [HttpGet("plan-budgetoriginalimportversion-overallexception")]
      public async Task<IActionResult> GetAllPlan_BudgetOriginalImportVersion_OverallException([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetOriginalImportVersion_OverallException.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetoriginalimportversion-overallexception/{id}")]
      public async Task<IActionResult> GetPlan_BudgetOriginalImportVersion_OverallExceptionById(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_OverallException.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetoriginalimportversion-overallexception")]
      public async Task<IActionResult> CreatePlan_BudgetOriginalImportVersion_OverallException([FromBody] Plan_BudgetOriginalImportVersion_OverallException model)
      {
          _db.Plan_BudgetOriginalImportVersion_OverallException.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetOriginalImportVersion_OverallExceptionById), new { id = model.BudgetOriginalImportVersionException_ID }, model);
      }

      [HttpPut("plan-budgetoriginalimportversion-overallexception/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetOriginalImportVersion_OverallException(int id, [FromBody] Plan_BudgetOriginalImportVersion_OverallException model)
      {
          if (id != model.BudgetOriginalImportVersionException_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetOriginalImportVersion_OverallException.AnyAsync(e => e.BudgetOriginalImportVersionException_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetoriginalimportversion-overallexception/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetOriginalImportVersion_OverallException(int id)
      {
          var item = await _db.Plan_BudgetOriginalImportVersion_OverallException.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetOriginalImportVersion_OverallException.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetRegister ===
      [HttpGet("plan-budgetregister")]
      public async Task<IActionResult> GetAllPlan_BudgetRegister([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetRegister.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetregister/{id}")]
      public async Task<IActionResult> GetPlan_BudgetRegisterById(long id)
      {
          var item = await _db.Plan_BudgetRegister.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetregister")]
      public async Task<IActionResult> CreatePlan_BudgetRegister([FromBody] Plan_BudgetRegister model)
      {
          _db.Plan_BudgetRegister.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetRegisterById), new { id = model.BudgetRegister_ID }, model);
      }

      [HttpPut("plan-budgetregister/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetRegister(long id, [FromBody] Plan_BudgetRegister model)
      {
          if (id != model.BudgetRegister_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetRegister.AnyAsync(e => e.BudgetRegister_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetregister/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetRegister(long id)
      {
          var item = await _db.Plan_BudgetRegister.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetRegister.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetRegisterBackup ===
      [HttpGet("plan-budgetregisterbackup")]
      public async Task<IActionResult> GetAllPlan_BudgetRegisterBackup([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetRegisterBackup.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetregisterbackup/{id}")]
      public async Task<IActionResult> GetPlan_BudgetRegisterBackupById(long id)
      {
          var item = await _db.Plan_BudgetRegisterBackup.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetregisterbackup")]
      public async Task<IActionResult> CreatePlan_BudgetRegisterBackup([FromBody] Plan_BudgetRegisterBackup model)
      {
          _db.Plan_BudgetRegisterBackup.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetRegisterBackupById), new { id = model.BudgetRegister_ID }, model);
      }

      [HttpPut("plan-budgetregisterbackup/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetRegisterBackup(long id, [FromBody] Plan_BudgetRegisterBackup model)
      {
          if (id != model.BudgetRegister_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetRegisterBackup.AnyAsync(e => e.BudgetRegister_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetregisterbackup/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetRegisterBackup(long id)
      {
          var item = await _db.Plan_BudgetRegisterBackup.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetRegisterBackup.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetRollover ===
      [HttpGet("plan-budgetrollover")]
      public async Task<IActionResult> GetAllPlan_BudgetRollover([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetRollover.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetrollover/{id}")]
      public async Task<IActionResult> GetPlan_BudgetRolloverById(int id)
      {
          var item = await _db.Plan_BudgetRollover.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetrollover")]
      public async Task<IActionResult> CreatePlan_BudgetRollover([FromBody] Plan_BudgetRollover model)
      {
          _db.Plan_BudgetRollover.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetRolloverById), new { id = model.BudgetRollOver_Id }, model);
      }

      [HttpPut("plan-budgetrollover/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetRollover(int id, [FromBody] Plan_BudgetRollover model)
      {
          if (id != model.BudgetRollOver_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetRollover.AnyAsync(e => e.BudgetRollOver_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetrollover/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetRollover(int id)
      {
          var item = await _db.Plan_BudgetRollover.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetRollover.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetVersion ===
      [HttpGet("plan-budgetversion")]
      public async Task<IActionResult> GetAllPlan_BudgetVersion([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetVersion.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetversion/{id}")]
      public async Task<IActionResult> GetPlan_BudgetVersionById(int id)
      {
          var item = await _db.Plan_BudgetVersion.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetversion")]
      public async Task<IActionResult> CreatePlan_BudgetVersion([FromBody] Plan_BudgetVersion model)
      {
          _db.Plan_BudgetVersion.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetVersionById), new { id = model.BudgetVersion_ID }, model);
      }

      [HttpPut("plan-budgetversion/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetVersion(int id, [FromBody] Plan_BudgetVersion model)
      {
          if (id != model.BudgetVersion_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetVersion.AnyAsync(e => e.BudgetVersion_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetversion/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetVersion(int id)
      {
          var item = await _db.Plan_BudgetVersion.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetVersion.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetVersionDetail ===
      [HttpGet("plan-budgetversiondetail")]
      public async Task<IActionResult> GetAllPlan_BudgetVersionDetail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetVersionDetail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetversiondetail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetVersionDetailById(int id)
      {
          var item = await _db.Plan_BudgetVersionDetail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetversiondetail")]
      public async Task<IActionResult> CreatePlan_BudgetVersionDetail([FromBody] Plan_BudgetVersionDetail model)
      {
          _db.Plan_BudgetVersionDetail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetVersionDetailById), new { id = model.BudgetVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetversiondetail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetVersionDetail(int id, [FromBody] Plan_BudgetVersionDetail model)
      {
          if (id != model.BudgetVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetVersionDetail.AnyAsync(e => e.BudgetVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetversiondetail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetVersionDetail(int id)
      {
          var item = await _db.Plan_BudgetVersionDetail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetVersionDetail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetVersionMonths ===
      [HttpGet("plan-budgetversionmonths")]
      public async Task<IActionResult> GetAllPlan_BudgetVersionMonths([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetVersionMonths.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetversionmonths/{id}")]
      public async Task<IActionResult> GetPlan_BudgetVersionMonthsById(int id)
      {
          var item = await _db.Plan_BudgetVersionMonths.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetversionmonths")]
      public async Task<IActionResult> CreatePlan_BudgetVersionMonths([FromBody] Plan_BudgetVersionMonths model)
      {
          _db.Plan_BudgetVersionMonths.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetVersionMonthsById), new { id = model.BudgetVersionMonth_ID }, model);
      }

      [HttpPut("plan-budgetversionmonths/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetVersionMonths(int id, [FromBody] Plan_BudgetVersionMonths model)
      {
          if (id != model.BudgetVersionMonth_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetVersionMonths.AnyAsync(e => e.BudgetVersionMonth_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetversionmonths/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetVersionMonths(int id)
      {
          var item = await _db.Plan_BudgetVersionMonths.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetVersionMonths.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetZeroExportImportVersion_Header ===
      [HttpGet("plan-budgetzeroexportimportversion-header")]
      public async Task<IActionResult> GetAllPlan_BudgetZeroExportImportVersion_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetZeroExportImportVersion_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetzeroexportimportversion-header/{id}")]
      public async Task<IActionResult> GetPlan_BudgetZeroExportImportVersion_HeaderById(int id)
      {
          var item = await _db.Plan_BudgetZeroExportImportVersion_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetzeroexportimportversion-header")]
      public async Task<IActionResult> CreatePlan_BudgetZeroExportImportVersion_Header([FromBody] Plan_BudgetZeroExportImportVersion_Header model)
      {
          _db.Plan_BudgetZeroExportImportVersion_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetZeroExportImportVersion_HeaderById), new { id = model.BudgetZeroExportImportVersionHeader_ID }, model);
      }

      [HttpPut("plan-budgetzeroexportimportversion-header/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetZeroExportImportVersion_Header(int id, [FromBody] Plan_BudgetZeroExportImportVersion_Header model)
      {
          if (id != model.BudgetZeroExportImportVersionHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetZeroExportImportVersion_Header.AnyAsync(e => e.BudgetZeroExportImportVersionHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetzeroexportimportversion-header/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetZeroExportImportVersion_Header(int id)
      {
          var item = await _db.Plan_BudgetZeroExportImportVersion_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetZeroExportImportVersion_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetZeroImportVersion_Detail ===
      [HttpGet("plan-budgetzeroimportversion-detail")]
      public async Task<IActionResult> GetAllPlan_BudgetZeroImportVersion_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetZeroImportVersion_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetzeroimportversion-detail/{id}")]
      public async Task<IActionResult> GetPlan_BudgetZeroImportVersion_DetailById(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetzeroimportversion-detail")]
      public async Task<IActionResult> CreatePlan_BudgetZeroImportVersion_Detail([FromBody] Plan_BudgetZeroImportVersion_Detail model)
      {
          _db.Plan_BudgetZeroImportVersion_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetZeroImportVersion_DetailById), new { id = model.BudgetZeroImportVersionDetail_ID }, model);
      }

      [HttpPut("plan-budgetzeroimportversion-detail/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetZeroImportVersion_Detail(int id, [FromBody] Plan_BudgetZeroImportVersion_Detail model)
      {
          if (id != model.BudgetZeroImportVersionDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetZeroImportVersion_Detail.AnyAsync(e => e.BudgetZeroImportVersionDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetzeroimportversion-detail/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetZeroImportVersion_Detail(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetZeroImportVersion_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetZeroImportVersion_DetailException ===
      [HttpGet("plan-budgetzeroimportversion-detailexception")]
      public async Task<IActionResult> GetAllPlan_BudgetZeroImportVersion_DetailException([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetZeroImportVersion_DetailException.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetzeroimportversion-detailexception/{id}")]
      public async Task<IActionResult> GetPlan_BudgetZeroImportVersion_DetailExceptionById(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_DetailException.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetzeroimportversion-detailexception")]
      public async Task<IActionResult> CreatePlan_BudgetZeroImportVersion_DetailException([FromBody] Plan_BudgetZeroImportVersion_DetailException model)
      {
          _db.Plan_BudgetZeroImportVersion_DetailException.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetZeroImportVersion_DetailExceptionById), new { id = model.BudgetZeroImportVersionException_ID }, model);
      }

      [HttpPut("plan-budgetzeroimportversion-detailexception/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetZeroImportVersion_DetailException(int id, [FromBody] Plan_BudgetZeroImportVersion_DetailException model)
      {
          if (id != model.BudgetZeroImportVersionException_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetZeroImportVersion_DetailException.AnyAsync(e => e.BudgetZeroImportVersionException_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetzeroimportversion-detailexception/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetZeroImportVersion_DetailException(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_DetailException.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetZeroImportVersion_DetailException.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Plan_BudgetZeroImportVersion_File ===
      [HttpGet("plan-budgetzeroimportversion-file")]
      public async Task<IActionResult> GetAllPlan_BudgetZeroImportVersion_File([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Plan_BudgetZeroImportVersion_File.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("plan-budgetzeroimportversion-file/{id}")]
      public async Task<IActionResult> GetPlan_BudgetZeroImportVersion_FileById(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_File.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("plan-budgetzeroimportversion-file")]
      public async Task<IActionResult> CreatePlan_BudgetZeroImportVersion_File([FromBody] Plan_BudgetZeroImportVersion_File model)
      {
          _db.Plan_BudgetZeroImportVersion_File.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetPlan_BudgetZeroImportVersion_FileById), new { id = model.BudgetZeroImportVersionFile_ID }, model);
      }

      [HttpPut("plan-budgetzeroimportversion-file/{id}")]
      public async Task<IActionResult> UpdatePlan_BudgetZeroImportVersion_File(int id, [FromBody] Plan_BudgetZeroImportVersion_File model)
      {
          if (id != model.BudgetZeroImportVersionFile_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Plan_BudgetZeroImportVersion_File.AnyAsync(e => e.BudgetZeroImportVersionFile_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("plan-budgetzeroimportversion-file/{id}")]
      public async Task<IActionResult> DeletePlan_BudgetZeroImportVersion_File(int id)
      {
          var item = await _db.Plan_BudgetZeroImportVersion_File.FindAsync(id);
          if (item == null) return NotFound();
          _db.Plan_BudgetZeroImportVersion_File.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  