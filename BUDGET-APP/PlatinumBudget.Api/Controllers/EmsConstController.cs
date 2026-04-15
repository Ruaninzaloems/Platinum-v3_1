using Microsoft.AspNetCore.Mvc;
  using Microsoft.EntityFrameworkCore;
  using PlatinumBudget.Api.Data;
  using PlatinumBudget.Api.Models;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/ems/const")]
  public class EmsConstController : ControllerBase
  {
      private readonly BudgetDbContext _db;
      public EmsConstController(BudgetDbContext db) => _db = db;
  
      // === Const_BudgetAdjustmentType_Sys ===
      [HttpGet("const-budgetadjustmenttype-sys")]
      public async Task<IActionResult> GetAllConst_BudgetAdjustmentType_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetAdjustmentType_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgetadjustmenttype-sys/{id}")]
      public async Task<IActionResult> GetConst_BudgetAdjustmentType_SysById(int id)
      {
          var item = await _db.Const_BudgetAdjustmentType_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgetadjustmenttype-sys")]
      public async Task<IActionResult> CreateConst_BudgetAdjustmentType_Sys([FromBody] Const_BudgetAdjustmentType_Sys model)
      {
          _db.Const_BudgetAdjustmentType_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetAdjustmentType_SysById), new { id = model.AdjustmentType_ID }, model);
      }

      [HttpPut("const-budgetadjustmenttype-sys/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetAdjustmentType_Sys(int id, [FromBody] Const_BudgetAdjustmentType_Sys model)
      {
          if (id != model.AdjustmentType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetAdjustmentType_Sys.AnyAsync(e => e.AdjustmentType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgetadjustmenttype-sys/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetAdjustmentType_Sys(int id)
      {
          var item = await _db.Const_BudgetAdjustmentType_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetAdjustmentType_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_BudgetConsumptionProcess_Sys ===
      [HttpGet("const-budgetconsumptionprocess-sys")]
      public async Task<IActionResult> GetAllConst_BudgetConsumptionProcess_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetConsumptionProcess_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgetconsumptionprocess-sys/{id}")]
      public async Task<IActionResult> GetConst_BudgetConsumptionProcess_SysById(int id)
      {
          var item = await _db.Const_BudgetConsumptionProcess_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgetconsumptionprocess-sys")]
      public async Task<IActionResult> CreateConst_BudgetConsumptionProcess_Sys([FromBody] Const_BudgetConsumptionProcess_Sys model)
      {
          _db.Const_BudgetConsumptionProcess_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetConsumptionProcess_SysById), new { id = model.BudgetConsumptionProcess_ID }, model);
      }

      [HttpPut("const-budgetconsumptionprocess-sys/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetConsumptionProcess_Sys(int id, [FromBody] Const_BudgetConsumptionProcess_Sys model)
      {
          if (id != model.BudgetConsumptionProcess_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetConsumptionProcess_Sys.AnyAsync(e => e.BudgetConsumptionProcess_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgetconsumptionprocess-sys/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetConsumptionProcess_Sys(int id)
      {
          var item = await _db.Const_BudgetConsumptionProcess_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetConsumptionProcess_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_BudgetLayout_Sys ===
      [HttpGet("const-budgetlayout-sys")]
      public async Task<IActionResult> GetAllConst_BudgetLayout_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetLayout_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgetlayout-sys/{id}")]
      public async Task<IActionResult> GetConst_BudgetLayout_SysById(int id)
      {
          var item = await _db.Const_BudgetLayout_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgetlayout-sys")]
      public async Task<IActionResult> CreateConst_BudgetLayout_Sys([FromBody] Const_BudgetLayout_Sys model)
      {
          _db.Const_BudgetLayout_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetLayout_SysById), new { id = model.BudgetLayout_ID }, model);
      }

      [HttpPut("const-budgetlayout-sys/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetLayout_Sys(int id, [FromBody] Const_BudgetLayout_Sys model)
      {
          if (id != model.BudgetLayout_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetLayout_Sys.AnyAsync(e => e.BudgetLayout_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgetlayout-sys/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetLayout_Sys(int id)
      {
          var item = await _db.Const_BudgetLayout_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetLayout_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_BudgetSplitOptions ===
      [HttpGet("const-budgetsplitoptions")]
      public async Task<IActionResult> GetAllConst_BudgetSplitOptions([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetSplitOptions.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgetsplitoptions/{id}")]
      public async Task<IActionResult> GetConst_BudgetSplitOptionsById(int id)
      {
          var item = await _db.Const_BudgetSplitOptions.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgetsplitoptions")]
      public async Task<IActionResult> CreateConst_BudgetSplitOptions([FromBody] Const_BudgetSplitOptions model)
      {
          _db.Const_BudgetSplitOptions.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetSplitOptionsById), new { id = model.BudgetSplit_ID }, model);
      }

      [HttpPut("const-budgetsplitoptions/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetSplitOptions(int id, [FromBody] Const_BudgetSplitOptions model)
      {
          if (id != model.BudgetSplit_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetSplitOptions.AnyAsync(e => e.BudgetSplit_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgetsplitoptions/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetSplitOptions(int id)
      {
          var item = await _db.Const_BudgetSplitOptions.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetSplitOptions.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_BudgetTransactionType_sys ===
      [HttpGet("const-budgettransactiontype-sys")]
      public async Task<IActionResult> GetAllConst_BudgetTransactionType_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetTransactionType_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgettransactiontype-sys/{id}")]
      public async Task<IActionResult> GetConst_BudgetTransactionType_sysById(int id)
      {
          var item = await _db.Const_BudgetTransactionType_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgettransactiontype-sys")]
      public async Task<IActionResult> CreateConst_BudgetTransactionType_sys([FromBody] Const_BudgetTransactionType_sys model)
      {
          _db.Const_BudgetTransactionType_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetTransactionType_sysById), new { id = model.BudgetTransactionType_ID }, model);
      }

      [HttpPut("const-budgettransactiontype-sys/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetTransactionType_sys(int id, [FromBody] Const_BudgetTransactionType_sys model)
      {
          if (id != model.BudgetTransactionType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetTransactionType_sys.AnyAsync(e => e.BudgetTransactionType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgettransactiontype-sys/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetTransactionType_sys(int id)
      {
          var item = await _db.Const_BudgetTransactionType_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetTransactionType_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_BudgetValidationRule_Sys ===
      [HttpGet("const-budgetvalidationrule-sys")]
      public async Task<IActionResult> GetAllConst_BudgetValidationRule_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_BudgetValidationRule_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-budgetvalidationrule-sys/{id}")]
      public async Task<IActionResult> GetConst_BudgetValidationRule_SysById(int id)
      {
          var item = await _db.Const_BudgetValidationRule_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-budgetvalidationrule-sys")]
      public async Task<IActionResult> CreateConst_BudgetValidationRule_Sys([FromBody] Const_BudgetValidationRule_Sys model)
      {
          _db.Const_BudgetValidationRule_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_BudgetValidationRule_SysById), new { id = model.BudgetValidationRule_ID }, model);
      }

      [HttpPut("const-budgetvalidationrule-sys/{id}")]
      public async Task<IActionResult> UpdateConst_BudgetValidationRule_Sys(int id, [FromBody] Const_BudgetValidationRule_Sys model)
      {
          if (id != model.BudgetValidationRule_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_BudgetValidationRule_Sys.AnyAsync(e => e.BudgetValidationRule_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-budgetvalidationrule-sys/{id}")]
      public async Task<IActionResult> DeleteConst_BudgetValidationRule_Sys(int id)
      {
          var item = await _db.Const_BudgetValidationRule_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_BudgetValidationRule_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_Department ===
      [HttpGet("const-department")]
      public async Task<IActionResult> GetAllConst_Department([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_Department.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-department/{id}")]
      public async Task<IActionResult> GetConst_DepartmentById(int id)
      {
          var item = await _db.Const_Department.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-department")]
      public async Task<IActionResult> CreateConst_Department([FromBody] Const_Department model)
      {
          _db.Const_Department.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_DepartmentById), new { id = model.Department_ID }, model);
      }

      [HttpPut("const-department/{id}")]
      public async Task<IActionResult> UpdateConst_Department(int id, [FromBody] Const_Department model)
      {
          if (id != model.Department_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_Department.AnyAsync(e => e.Department_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-department/{id}")]
      public async Task<IActionResult> DeleteConst_Department(int id)
      {
          var item = await _db.Const_Department.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_Department.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_Division ===
      [HttpGet("const-division")]
      public async Task<IActionResult> GetAllConst_Division([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_Division.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-division/{id}")]
      public async Task<IActionResult> GetConst_DivisionById(int id)
      {
          var item = await _db.Const_Division.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-division")]
      public async Task<IActionResult> CreateConst_Division([FromBody] Const_Division model)
      {
          _db.Const_Division.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_DivisionById), new { id = model.Division_ID }, model);
      }

      [HttpPut("const-division/{id}")]
      public async Task<IActionResult> UpdateConst_Division(int id, [FromBody] Const_Division model)
      {
          if (id != model.Division_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_Division.AnyAsync(e => e.Division_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-division/{id}")]
      public async Task<IActionResult> DeleteConst_Division(int id)
      {
          var item = await _db.Const_Division.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_Division.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_FunderType ===
      [HttpGet("const-fundertype")]
      public async Task<IActionResult> GetAllConst_FunderType([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_FunderType.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-fundertype/{id}")]
      public async Task<IActionResult> GetConst_FunderTypeById(int id)
      {
          var item = await _db.Const_FunderType.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-fundertype")]
      public async Task<IActionResult> CreateConst_FunderType([FromBody] Const_FunderType model)
      {
          _db.Const_FunderType.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_FunderTypeById), new { id = model.Funder_ID }, model);
      }

      [HttpPut("const-fundertype/{id}")]
      public async Task<IActionResult> UpdateConst_FunderType(int id, [FromBody] Const_FunderType model)
      {
          if (id != model.Funder_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_FunderType.AnyAsync(e => e.Funder_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-fundertype/{id}")]
      public async Task<IActionResult> DeleteConst_FunderType(int id)
      {
          var item = await _db.Const_FunderType.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_FunderType.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_FundingSource ===
      [HttpGet("const-fundingsource")]
      public async Task<IActionResult> GetAllConst_FundingSource([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_FundingSource.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-fundingsource/{id}")]
      public async Task<IActionResult> GetConst_FundingSourceById(int id)
      {
          var item = await _db.Const_FundingSource.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-fundingsource")]
      public async Task<IActionResult> CreateConst_FundingSource([FromBody] Const_FundingSource model)
      {
          _db.Const_FundingSource.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_FundingSourceById), new { id = model.FundingSource_ID }, model);
      }

      [HttpPut("const-fundingsource/{id}")]
      public async Task<IActionResult> UpdateConst_FundingSource(int id, [FromBody] Const_FundingSource model)
      {
          if (id != model.FundingSource_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_FundingSource.AnyAsync(e => e.FundingSource_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-fundingsource/{id}")]
      public async Task<IActionResult> DeleteConst_FundingSource(int id)
      {
          var item = await _db.Const_FundingSource.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_FundingSource.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_FundManagement ===
      [HttpGet("const-fundmanagement")]
      public async Task<IActionResult> GetAllConst_FundManagement([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_FundManagement.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-fundmanagement/{id}")]
      public async Task<IActionResult> GetConst_FundManagementById(int id)
      {
          var item = await _db.Const_FundManagement.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-fundmanagement")]
      public async Task<IActionResult> CreateConst_FundManagement([FromBody] Const_FundManagement model)
      {
          _db.Const_FundManagement.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_FundManagementById), new { id = model.DocumentType_ID }, model);
      }

      [HttpPut("const-fundmanagement/{id}")]
      public async Task<IActionResult> UpdateConst_FundManagement(int id, [FromBody] Const_FundManagement model)
      {
          if (id != model.DocumentType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_FundManagement.AnyAsync(e => e.DocumentType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-fundmanagement/{id}")]
      public async Task<IActionResult> DeleteConst_FundManagement(int id)
      {
          var item = await _db.Const_FundManagement.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_FundManagement.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_FundSourceChange ===
      [HttpGet("const-fundsourcechange")]
      public async Task<IActionResult> GetAllConst_FundSourceChange([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_FundSourceChange.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-fundsourcechange/{id}")]
      public async Task<IActionResult> GetConst_FundSourceChangeById(int id)
      {
          var item = await _db.Const_FundSourceChange.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-fundsourcechange")]
      public async Task<IActionResult> CreateConst_FundSourceChange([FromBody] Const_FundSourceChange model)
      {
          _db.Const_FundSourceChange.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_FundSourceChangeById), new { id = model.FundSourceChange_ID }, model);
      }

      [HttpPut("const-fundsourcechange/{id}")]
      public async Task<IActionResult> UpdateConst_FundSourceChange(int id, [FromBody] Const_FundSourceChange model)
      {
          if (id != model.FundSourceChange_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_FundSourceChange.AnyAsync(e => e.FundSourceChange_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-fundsourcechange/{id}")]
      public async Task<IActionResult> DeleteConst_FundSourceChange(int id)
      {
          var item = await _db.Const_FundSourceChange.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_FundSourceChange.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_GrantType ===
      [HttpGet("const-granttype")]
      public async Task<IActionResult> GetAllConst_GrantType([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_GrantType.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-granttype/{id}")]
      public async Task<IActionResult> GetConst_GrantTypeById(int id)
      {
          var item = await _db.Const_GrantType.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-granttype")]
      public async Task<IActionResult> CreateConst_GrantType([FromBody] Const_GrantType model)
      {
          _db.Const_GrantType.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_GrantTypeById), new { id = model.GrantTypeID }, model);
      }

      [HttpPut("const-granttype/{id}")]
      public async Task<IActionResult> UpdateConst_GrantType(int id, [FromBody] Const_GrantType model)
      {
          if (id != model.GrantTypeID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_GrantType.AnyAsync(e => e.GrantTypeID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-granttype/{id}")]
      public async Task<IActionResult> DeleteConst_GrantType(int id)
      {
          var item = await _db.Const_GrantType.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_GrantType.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_KPIGroup ===
      [HttpGet("const-kpigroup")]
      public async Task<IActionResult> GetAllConst_KPIGroup([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_KPIGroup.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-kpigroup/{id}")]
      public async Task<IActionResult> GetConst_KPIGroupById(int id)
      {
          var item = await _db.Const_KPIGroup.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-kpigroup")]
      public async Task<IActionResult> CreateConst_KPIGroup([FromBody] Const_KPIGroup model)
      {
          _db.Const_KPIGroup.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_KPIGroupById), new { id = model.KPIGroup_ID }, model);
      }

      [HttpPut("const-kpigroup/{id}")]
      public async Task<IActionResult> UpdateConst_KPIGroup(int id, [FromBody] Const_KPIGroup model)
      {
          if (id != model.KPIGroup_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_KPIGroup.AnyAsync(e => e.KPIGroup_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-kpigroup/{id}")]
      public async Task<IActionResult> DeleteConst_KPIGroup(int id)
      {
          var item = await _db.Const_KPIGroup.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_KPIGroup.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_KPIGroupDetail ===
      [HttpGet("const-kpigroupdetail")]
      public async Task<IActionResult> GetAllConst_KPIGroupDetail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_KPIGroupDetail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-kpigroupdetail/{id}")]
      public async Task<IActionResult> GetConst_KPIGroupDetailById(int id)
      {
          var item = await _db.Const_KPIGroupDetail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-kpigroupdetail")]
      public async Task<IActionResult> CreateConst_KPIGroupDetail([FromBody] Const_KPIGroupDetail model)
      {
          _db.Const_KPIGroupDetail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_KPIGroupDetailById), new { id = model.KPIGroupDetail_ID }, model);
      }

      [HttpPut("const-kpigroupdetail/{id}")]
      public async Task<IActionResult> UpdateConst_KPIGroupDetail(int id, [FromBody] Const_KPIGroupDetail model)
      {
          if (id != model.KPIGroupDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_KPIGroupDetail.AnyAsync(e => e.KPIGroupDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-kpigroupdetail/{id}")]
      public async Task<IActionResult> DeleteConst_KPIGroupDetail(int id)
      {
          var item = await _db.Const_KPIGroupDetail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_KPIGroupDetail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_NationalKPA_Sys ===
      [HttpGet("const-nationalkpa-sys")]
      public async Task<IActionResult> GetAllConst_NationalKPA_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_NationalKPA_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-nationalkpa-sys/{id}")]
      public async Task<IActionResult> GetConst_NationalKPA_SysById(int id)
      {
          var item = await _db.Const_NationalKPA_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-nationalkpa-sys")]
      public async Task<IActionResult> CreateConst_NationalKPA_Sys([FromBody] Const_NationalKPA_Sys model)
      {
          _db.Const_NationalKPA_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_NationalKPA_SysById), new { id = model.NKPA_ID }, model);
      }

      [HttpPut("const-nationalkpa-sys/{id}")]
      public async Task<IActionResult> UpdateConst_NationalKPA_Sys(int id, [FromBody] Const_NationalKPA_Sys model)
      {
          if (id != model.NKPA_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_NationalKPA_Sys.AnyAsync(e => e.NKPA_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-nationalkpa-sys/{id}")]
      public async Task<IActionResult> DeleteConst_NationalKPA_Sys(int id)
      {
          var item = await _db.Const_NationalKPA_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_NationalKPA_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanAdjustmentReason_sys ===
      [HttpGet("const-planadjustmentreason-sys")]
      public async Task<IActionResult> GetAllConst_PlanAdjustmentReason_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanAdjustmentReason_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planadjustmentreason-sys/{id}")]
      public async Task<IActionResult> GetConst_PlanAdjustmentReason_sysById(int id)
      {
          var item = await _db.Const_PlanAdjustmentReason_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planadjustmentreason-sys")]
      public async Task<IActionResult> CreateConst_PlanAdjustmentReason_sys([FromBody] Const_PlanAdjustmentReason_sys model)
      {
          _db.Const_PlanAdjustmentReason_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanAdjustmentReason_sysById), new { id = model.AdjustmentReason_ID }, model);
      }

      [HttpPut("const-planadjustmentreason-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PlanAdjustmentReason_sys(int id, [FromBody] Const_PlanAdjustmentReason_sys model)
      {
          if (id != model.AdjustmentReason_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanAdjustmentReason_sys.AnyAsync(e => e.AdjustmentReason_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planadjustmentreason-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PlanAdjustmentReason_sys(int id)
      {
          var item = await _db.Const_PlanAdjustmentReason_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanAdjustmentReason_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanAdjustmentType_sys ===
      [HttpGet("const-planadjustmenttype-sys")]
      public async Task<IActionResult> GetAllConst_PlanAdjustmentType_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanAdjustmentType_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planadjustmenttype-sys/{id}")]
      public async Task<IActionResult> GetConst_PlanAdjustmentType_sysById(int id)
      {
          var item = await _db.Const_PlanAdjustmentType_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planadjustmenttype-sys")]
      public async Task<IActionResult> CreateConst_PlanAdjustmentType_sys([FromBody] Const_PlanAdjustmentType_sys model)
      {
          _db.Const_PlanAdjustmentType_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanAdjustmentType_sysById), new { id = model.AdjustmentType_ID }, model);
      }

      [HttpPut("const-planadjustmenttype-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PlanAdjustmentType_sys(int id, [FromBody] Const_PlanAdjustmentType_sys model)
      {
          if (id != model.AdjustmentType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanAdjustmentType_sys.AnyAsync(e => e.AdjustmentType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planadjustmenttype-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PlanAdjustmentType_sys(int id)
      {
          var item = await _db.Const_PlanAdjustmentType_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanAdjustmentType_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanCapitalOperationalTypes_sys ===
      [HttpGet("const-plancapitaloperationaltypes-sys")]
      public async Task<IActionResult> GetAllConst_PlanCapitalOperationalTypes_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanCapitalOperationalTypes_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-plancapitaloperationaltypes-sys/{id}")]
      public async Task<IActionResult> GetConst_PlanCapitalOperationalTypes_sysById(int id)
      {
          var item = await _db.Const_PlanCapitalOperationalTypes_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-plancapitaloperationaltypes-sys")]
      public async Task<IActionResult> CreateConst_PlanCapitalOperationalTypes_sys([FromBody] Const_PlanCapitalOperationalTypes_sys model)
      {
          _db.Const_PlanCapitalOperationalTypes_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanCapitalOperationalTypes_sysById), new { id = model.Type_ID }, model);
      }

      [HttpPut("const-plancapitaloperationaltypes-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PlanCapitalOperationalTypes_sys(int id, [FromBody] Const_PlanCapitalOperationalTypes_sys model)
      {
          if (id != model.Type_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanCapitalOperationalTypes_sys.AnyAsync(e => e.Type_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-plancapitaloperationaltypes-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PlanCapitalOperationalTypes_sys(int id)
      {
          var item = await _db.Const_PlanCapitalOperationalTypes_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanCapitalOperationalTypes_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanNetAssetItems ===
      [HttpGet("const-plannetassetitems")]
      public async Task<IActionResult> GetAllConst_PlanNetAssetItems([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanNetAssetItems.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-plannetassetitems/{id}")]
      public async Task<IActionResult> GetConst_PlanNetAssetItemsById(int id)
      {
          var item = await _db.Const_PlanNetAssetItems.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-plannetassetitems")]
      public async Task<IActionResult> CreateConst_PlanNetAssetItems([FromBody] Const_PlanNetAssetItems model)
      {
          _db.Const_PlanNetAssetItems.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanNetAssetItemsById), new { id = model.NetAssetItems_ID }, model);
      }

      [HttpPut("const-plannetassetitems/{id}")]
      public async Task<IActionResult> UpdateConst_PlanNetAssetItems(int id, [FromBody] Const_PlanNetAssetItems model)
      {
          if (id != model.NetAssetItems_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanNetAssetItems.AnyAsync(e => e.NetAssetItems_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-plannetassetitems/{id}")]
      public async Task<IActionResult> DeleteConst_PlanNetAssetItems(int id)
      {
          var item = await _db.Const_PlanNetAssetItems.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanNetAssetItems.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanNTValidations ===
      [HttpGet("const-planntvalidations")]
      public async Task<IActionResult> GetAllConst_PlanNTValidations([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanNTValidations.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planntvalidations/{id}")]
      public async Task<IActionResult> GetConst_PlanNTValidationsById(int id)
      {
          var item = await _db.Const_PlanNTValidations.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planntvalidations")]
      public async Task<IActionResult> CreateConst_PlanNTValidations([FromBody] Const_PlanNTValidations model)
      {
          _db.Const_PlanNTValidations.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanNTValidationsById), new { id = model.NTValidation_Id }, model);
      }

      [HttpPut("const-planntvalidations/{id}")]
      public async Task<IActionResult> UpdateConst_PlanNTValidations(int id, [FromBody] Const_PlanNTValidations model)
      {
          if (id != model.NTValidation_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanNTValidations.AnyAsync(e => e.NTValidation_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planntvalidations/{id}")]
      public async Task<IActionResult> DeleteConst_PlanNTValidations(int id)
      {
          var item = await _db.Const_PlanNTValidations.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanNTValidations.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAFundCapital ===
      [HttpGet("const-planscoafundcapital")]
      public async Task<IActionResult> GetAllConst_PlanSCOAFundCapital([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAFundCapital.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoafundcapital/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAFundCapitalById(int id)
      {
          var item = await _db.Const_PlanSCOAFundCapital.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoafundcapital")]
      public async Task<IActionResult> CreateConst_PlanSCOAFundCapital([FromBody] Const_PlanSCOAFundCapital model)
      {
          _db.Const_PlanSCOAFundCapital.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAFundCapitalById), new { id = model.SCOAFundCapital_Id }, model);
      }

      [HttpPut("const-planscoafundcapital/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAFundCapital(int id, [FromBody] Const_PlanSCOAFundCapital model)
      {
          if (id != model.SCOAFundCapital_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAFundCapital.AnyAsync(e => e.SCOAFundCapital_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoafundcapital/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAFundCapital(int id)
      {
          var item = await _db.Const_PlanSCOAFundCapital.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAFundCapital.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAFundOperational ===
      [HttpGet("const-planscoafundoperational")]
      public async Task<IActionResult> GetAllConst_PlanSCOAFundOperational([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAFundOperational.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoafundoperational/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAFundOperationalById(int id)
      {
          var item = await _db.Const_PlanSCOAFundOperational.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoafundoperational")]
      public async Task<IActionResult> CreateConst_PlanSCOAFundOperational([FromBody] Const_PlanSCOAFundOperational model)
      {
          _db.Const_PlanSCOAFundOperational.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAFundOperationalById), new { id = model.SCOAFundOperational_Id }, model);
      }

      [HttpPut("const-planscoafundoperational/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAFundOperational(int id, [FromBody] Const_PlanSCOAFundOperational model)
      {
          if (id != model.SCOAFundOperational_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAFundOperational.AnyAsync(e => e.SCOAFundOperational_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoafundoperational/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAFundOperational(int id)
      {
          var item = await _db.Const_PlanSCOAFundOperational.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAFundOperational.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAItemAssetFBS ===
      [HttpGet("const-planscoaitemassetfbs")]
      public async Task<IActionResult> GetAllConst_PlanSCOAItemAssetFBS([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAItemAssetFBS.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoaitemassetfbs/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAItemAssetFBSById(int id)
      {
          var item = await _db.Const_PlanSCOAItemAssetFBS.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoaitemassetfbs")]
      public async Task<IActionResult> CreateConst_PlanSCOAItemAssetFBS([FromBody] Const_PlanSCOAItemAssetFBS model)
      {
          _db.Const_PlanSCOAItemAssetFBS.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAItemAssetFBSById), new { id = model.SCOAItemAssetFBS_Id }, model);
      }

      [HttpPut("const-planscoaitemassetfbs/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAItemAssetFBS(int id, [FromBody] Const_PlanSCOAItemAssetFBS model)
      {
          if (id != model.SCOAItemAssetFBS_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAItemAssetFBS.AnyAsync(e => e.SCOAItemAssetFBS_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoaitemassetfbs/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAItemAssetFBS(int id)
      {
          var item = await _db.Const_PlanSCOAItemAssetFBS.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAItemAssetFBS.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAItemGainOR ===
      [HttpGet("const-planscoaitemgainor")]
      public async Task<IActionResult> GetAllConst_PlanSCOAItemGainOR([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAItemGainOR.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoaitemgainor/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAItemGainORById(int id)
      {
          var item = await _db.Const_PlanSCOAItemGainOR.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoaitemgainor")]
      public async Task<IActionResult> CreateConst_PlanSCOAItemGainOR([FromBody] Const_PlanSCOAItemGainOR model)
      {
          _db.Const_PlanSCOAItemGainOR.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAItemGainORById), new { id = model.SCOAItemGainOR_Id }, model);
      }

      [HttpPut("const-planscoaitemgainor/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAItemGainOR(int id, [FromBody] Const_PlanSCOAItemGainOR model)
      {
          if (id != model.SCOAItemGainOR_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAItemGainOR.AnyAsync(e => e.SCOAItemGainOR_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoaitemgainor/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAItemGainOR(int id)
      {
          var item = await _db.Const_PlanSCOAItemGainOR.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAItemGainOR.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAItemLossOE ===
      [HttpGet("const-planscoaitemlossoe")]
      public async Task<IActionResult> GetAllConst_PlanSCOAItemLossOE([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAItemLossOE.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoaitemlossoe/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAItemLossOEById(int id)
      {
          var item = await _db.Const_PlanSCOAItemLossOE.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoaitemlossoe")]
      public async Task<IActionResult> CreateConst_PlanSCOAItemLossOE([FromBody] Const_PlanSCOAItemLossOE model)
      {
          _db.Const_PlanSCOAItemLossOE.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAItemLossOEById), new { id = model.SCOAItemLossOE_Id }, model);
      }

      [HttpPut("const-planscoaitemlossoe/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAItemLossOE(int id, [FromBody] Const_PlanSCOAItemLossOE model)
      {
          if (id != model.SCOAItemLossOE_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAItemLossOE.AnyAsync(e => e.SCOAItemLossOE_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoaitemlossoe/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAItemLossOE(int id)
      {
          var item = await _db.Const_PlanSCOAItemLossOE.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAItemLossOE.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAItemRevenueFBS ===
      [HttpGet("const-planscoaitemrevenuefbs")]
      public async Task<IActionResult> GetAllConst_PlanSCOAItemRevenueFBS([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAItemRevenueFBS.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoaitemrevenuefbs/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAItemRevenueFBSById(int id)
      {
          var item = await _db.Const_PlanSCOAItemRevenueFBS.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoaitemrevenuefbs")]
      public async Task<IActionResult> CreateConst_PlanSCOAItemRevenueFBS([FromBody] Const_PlanSCOAItemRevenueFBS model)
      {
          _db.Const_PlanSCOAItemRevenueFBS.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAItemRevenueFBSById), new { id = model.SCOAItemRevenueFBS_Id }, model);
      }

      [HttpPut("const-planscoaitemrevenuefbs/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAItemRevenueFBS(int id, [FromBody] Const_PlanSCOAItemRevenueFBS model)
      {
          if (id != model.SCOAItemRevenueFBS_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAItemRevenueFBS.AnyAsync(e => e.SCOAItemRevenueFBS_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoaitemrevenuefbs/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAItemRevenueFBS(int id)
      {
          var item = await _db.Const_PlanSCOAItemRevenueFBS.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAItemRevenueFBS.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanSCOAProjectFBS ===
      [HttpGet("const-planscoaprojectfbs")]
      public async Task<IActionResult> GetAllConst_PlanSCOAProjectFBS([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanSCOAProjectFBS.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planscoaprojectfbs/{id}")]
      public async Task<IActionResult> GetConst_PlanSCOAProjectFBSById(int id)
      {
          var item = await _db.Const_PlanSCOAProjectFBS.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planscoaprojectfbs")]
      public async Task<IActionResult> CreateConst_PlanSCOAProjectFBS([FromBody] Const_PlanSCOAProjectFBS model)
      {
          _db.Const_PlanSCOAProjectFBS.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanSCOAProjectFBSById), new { id = model.SCOAProjectFBS_Id }, model);
      }

      [HttpPut("const-planscoaprojectfbs/{id}")]
      public async Task<IActionResult> UpdateConst_PlanSCOAProjectFBS(int id, [FromBody] Const_PlanSCOAProjectFBS model)
      {
          if (id != model.SCOAProjectFBS_Id) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanSCOAProjectFBS.AnyAsync(e => e.SCOAProjectFBS_Id == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planscoaprojectfbs/{id}")]
      public async Task<IActionResult> DeleteConst_PlanSCOAProjectFBS(int id)
      {
          var item = await _db.Const_PlanSCOAProjectFBS.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanSCOAProjectFBS.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PlanVirementRules_sys ===
      [HttpGet("const-planvirementrules-sys")]
      public async Task<IActionResult> GetAllConst_PlanVirementRules_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PlanVirementRules_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-planvirementrules-sys/{id}")]
      public async Task<IActionResult> GetConst_PlanVirementRules_sysById(int id)
      {
          var item = await _db.Const_PlanVirementRules_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-planvirementrules-sys")]
      public async Task<IActionResult> CreateConst_PlanVirementRules_sys([FromBody] Const_PlanVirementRules_sys model)
      {
          _db.Const_PlanVirementRules_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PlanVirementRules_sysById), new { id = model.VirementRule_ID }, model);
      }

      [HttpPut("const-planvirementrules-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PlanVirementRules_sys(int id, [FromBody] Const_PlanVirementRules_sys model)
      {
          if (id != model.VirementRule_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PlanVirementRules_sys.AnyAsync(e => e.VirementRule_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-planvirementrules-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PlanVirementRules_sys(int id)
      {
          var item = await _db.Const_PlanVirementRules_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PlanVirementRules_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSAnnualField_Detail ===
      [HttpGet("const-pmsannualfield-detail")]
      public async Task<IActionResult> GetAllConst_PMSAnnualField_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSAnnualField_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsannualfield-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSAnnualField_DetailById(int id)
      {
          var item = await _db.Const_PMSAnnualField_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsannualfield-detail")]
      public async Task<IActionResult> CreateConst_PMSAnnualField_Detail([FromBody] Const_PMSAnnualField_Detail model)
      {
          _db.Const_PMSAnnualField_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSAnnualField_DetailById), new { id = model.AnnualFieldDetail_ID }, model);
      }

      [HttpPut("const-pmsannualfield-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSAnnualField_Detail(int id, [FromBody] Const_PMSAnnualField_Detail model)
      {
          if (id != model.AnnualFieldDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSAnnualField_Detail.AnyAsync(e => e.AnnualFieldDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsannualfield-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSAnnualField_Detail(int id)
      {
          var item = await _db.Const_PMSAnnualField_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSAnnualField_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSAnnualField_Header ===
      [HttpGet("const-pmsannualfield-header")]
      public async Task<IActionResult> GetAllConst_PMSAnnualField_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSAnnualField_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsannualfield-header/{id}")]
      public async Task<IActionResult> GetConst_PMSAnnualField_HeaderById(int id)
      {
          var item = await _db.Const_PMSAnnualField_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsannualfield-header")]
      public async Task<IActionResult> CreateConst_PMSAnnualField_Header([FromBody] Const_PMSAnnualField_Header model)
      {
          _db.Const_PMSAnnualField_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSAnnualField_HeaderById), new { id = model.AnnualFieldHeader_ID }, model);
      }

      [HttpPut("const-pmsannualfield-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSAnnualField_Header(int id, [FromBody] Const_PMSAnnualField_Header model)
      {
          if (id != model.AnnualFieldHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSAnnualField_Header.AnyAsync(e => e.AnnualFieldHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsannualfield-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSAnnualField_Header(int id)
      {
          var item = await _db.Const_PMSAnnualField_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSAnnualField_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSCoreCompetencyRequirement ===
      [HttpGet("const-pmscorecompetencyrequirement")]
      public async Task<IActionResult> GetAllConst_PMSCoreCompetencyRequirement([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSCoreCompetencyRequirement.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmscorecompetencyrequirement/{id}")]
      public async Task<IActionResult> GetConst_PMSCoreCompetencyRequirementById(int id)
      {
          var item = await _db.Const_PMSCoreCompetencyRequirement.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmscorecompetencyrequirement")]
      public async Task<IActionResult> CreateConst_PMSCoreCompetencyRequirement([FromBody] Const_PMSCoreCompetencyRequirement model)
      {
          _db.Const_PMSCoreCompetencyRequirement.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSCoreCompetencyRequirementById), new { id = model.CoreCompetencyRequirement_ID }, model);
      }

      [HttpPut("const-pmscorecompetencyrequirement/{id}")]
      public async Task<IActionResult> UpdateConst_PMSCoreCompetencyRequirement(int id, [FromBody] Const_PMSCoreCompetencyRequirement model)
      {
          if (id != model.CoreCompetencyRequirement_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSCoreCompetencyRequirement.AnyAsync(e => e.CoreCompetencyRequirement_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmscorecompetencyrequirement/{id}")]
      public async Task<IActionResult> DeleteConst_PMSCoreCompetencyRequirement(int id)
      {
          var item = await _db.Const_PMSCoreCompetencyRequirement.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSCoreCompetencyRequirement.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSCoreCompetencyRequirementType_sys ===
      [HttpGet("const-pmscorecompetencyrequirementtype-sys")]
      public async Task<IActionResult> GetAllConst_PMSCoreCompetencyRequirementType_sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSCoreCompetencyRequirementType_sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmscorecompetencyrequirementtype-sys/{id}")]
      public async Task<IActionResult> GetConst_PMSCoreCompetencyRequirementType_sysById(int id)
      {
          var item = await _db.Const_PMSCoreCompetencyRequirementType_sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmscorecompetencyrequirementtype-sys")]
      public async Task<IActionResult> CreateConst_PMSCoreCompetencyRequirementType_sys([FromBody] Const_PMSCoreCompetencyRequirementType_sys model)
      {
          _db.Const_PMSCoreCompetencyRequirementType_sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSCoreCompetencyRequirementType_sysById), new { id = model.CoreCompetencyRequirementType_ID }, model);
      }

      [HttpPut("const-pmscorecompetencyrequirementtype-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PMSCoreCompetencyRequirementType_sys(int id, [FromBody] Const_PMSCoreCompetencyRequirementType_sys model)
      {
          if (id != model.CoreCompetencyRequirementType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSCoreCompetencyRequirementType_sys.AnyAsync(e => e.CoreCompetencyRequirementType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmscorecompetencyrequirementtype-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PMSCoreCompetencyRequirementType_sys(int id)
      {
          var item = await _db.Const_PMSCoreCompetencyRequirementType_sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSCoreCompetencyRequirementType_sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSDataType_Sys ===
      [HttpGet("const-pmsdatatype-sys")]
      public async Task<IActionResult> GetAllConst_PMSDataType_Sys([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSDataType_Sys.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsdatatype-sys/{id}")]
      public async Task<IActionResult> GetConst_PMSDataType_SysById(int id)
      {
          var item = await _db.Const_PMSDataType_Sys.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsdatatype-sys")]
      public async Task<IActionResult> CreateConst_PMSDataType_Sys([FromBody] Const_PMSDataType_Sys model)
      {
          _db.Const_PMSDataType_Sys.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSDataType_SysById), new { id = model.DataType_ID }, model);
      }

      [HttpPut("const-pmsdatatype-sys/{id}")]
      public async Task<IActionResult> UpdateConst_PMSDataType_Sys(int id, [FromBody] Const_PMSDataType_Sys model)
      {
          if (id != model.DataType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSDataType_Sys.AnyAsync(e => e.DataType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsdatatype-sys/{id}")]
      public async Task<IActionResult> DeleteConst_PMSDataType_Sys(int id)
      {
          var item = await _db.Const_PMSDataType_Sys.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSDataType_Sys.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSDepartmentNKPAWeighting_Detail ===
      [HttpGet("const-pmsdepartmentnkpaweighting-detail")]
      public async Task<IActionResult> GetAllConst_PMSDepartmentNKPAWeighting_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSDepartmentNKPAWeighting_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsdepartmentnkpaweighting-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSDepartmentNKPAWeighting_DetailById(int id)
      {
          var item = await _db.Const_PMSDepartmentNKPAWeighting_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsdepartmentnkpaweighting-detail")]
      public async Task<IActionResult> CreateConst_PMSDepartmentNKPAWeighting_Detail([FromBody] Const_PMSDepartmentNKPAWeighting_Detail model)
      {
          _db.Const_PMSDepartmentNKPAWeighting_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSDepartmentNKPAWeighting_DetailById), new { id = model.DepartmentNKPAWeightingDetail_ID }, model);
      }

      [HttpPut("const-pmsdepartmentnkpaweighting-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSDepartmentNKPAWeighting_Detail(int id, [FromBody] Const_PMSDepartmentNKPAWeighting_Detail model)
      {
          if (id != model.DepartmentNKPAWeightingDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSDepartmentNKPAWeighting_Detail.AnyAsync(e => e.DepartmentNKPAWeightingDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsdepartmentnkpaweighting-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSDepartmentNKPAWeighting_Detail(int id)
      {
          var item = await _db.Const_PMSDepartmentNKPAWeighting_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSDepartmentNKPAWeighting_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSDepartmentNKPAWeighting_Header ===
      [HttpGet("const-pmsdepartmentnkpaweighting-header")]
      public async Task<IActionResult> GetAllConst_PMSDepartmentNKPAWeighting_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSDepartmentNKPAWeighting_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsdepartmentnkpaweighting-header/{id}")]
      public async Task<IActionResult> GetConst_PMSDepartmentNKPAWeighting_HeaderById(int id)
      {
          var item = await _db.Const_PMSDepartmentNKPAWeighting_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsdepartmentnkpaweighting-header")]
      public async Task<IActionResult> CreateConst_PMSDepartmentNKPAWeighting_Header([FromBody] Const_PMSDepartmentNKPAWeighting_Header model)
      {
          _db.Const_PMSDepartmentNKPAWeighting_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSDepartmentNKPAWeighting_HeaderById), new { id = model.DepartmentNKPAWeightingHeader_ID }, model);
      }

      [HttpPut("const-pmsdepartmentnkpaweighting-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSDepartmentNKPAWeighting_Header(int id, [FromBody] Const_PMSDepartmentNKPAWeighting_Header model)
      {
          if (id != model.DepartmentNKPAWeightingHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSDepartmentNKPAWeighting_Header.AnyAsync(e => e.DepartmentNKPAWeightingHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsdepartmentnkpaweighting-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSDepartmentNKPAWeighting_Header(int id)
      {
          var item = await _db.Const_PMSDepartmentNKPAWeighting_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSDepartmentNKPAWeighting_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSIndicatorCustomField_Detail ===
      [HttpGet("const-pmsindicatorcustomfield-detail")]
      public async Task<IActionResult> GetAllConst_PMSIndicatorCustomField_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSIndicatorCustomField_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsindicatorcustomfield-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSIndicatorCustomField_DetailById(int id)
      {
          var item = await _db.Const_PMSIndicatorCustomField_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsindicatorcustomfield-detail")]
      public async Task<IActionResult> CreateConst_PMSIndicatorCustomField_Detail([FromBody] Const_PMSIndicatorCustomField_Detail model)
      {
          _db.Const_PMSIndicatorCustomField_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSIndicatorCustomField_DetailById), new { id = model.CustomFieldDetail_ID }, model);
      }

      [HttpPut("const-pmsindicatorcustomfield-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSIndicatorCustomField_Detail(int id, [FromBody] Const_PMSIndicatorCustomField_Detail model)
      {
          if (id != model.CustomFieldDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSIndicatorCustomField_Detail.AnyAsync(e => e.CustomFieldDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsindicatorcustomfield-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSIndicatorCustomField_Detail(int id)
      {
          var item = await _db.Const_PMSIndicatorCustomField_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSIndicatorCustomField_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSIndicatorCustomField_Header ===
      [HttpGet("const-pmsindicatorcustomfield-header")]
      public async Task<IActionResult> GetAllConst_PMSIndicatorCustomField_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSIndicatorCustomField_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsindicatorcustomfield-header/{id}")]
      public async Task<IActionResult> GetConst_PMSIndicatorCustomField_HeaderById(int id)
      {
          var item = await _db.Const_PMSIndicatorCustomField_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsindicatorcustomfield-header")]
      public async Task<IActionResult> CreateConst_PMSIndicatorCustomField_Header([FromBody] Const_PMSIndicatorCustomField_Header model)
      {
          _db.Const_PMSIndicatorCustomField_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSIndicatorCustomField_HeaderById), new { id = model.CustomFieldHeader_ID }, model);
      }

      [HttpPut("const-pmsindicatorcustomfield-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSIndicatorCustomField_Header(int id, [FromBody] Const_PMSIndicatorCustomField_Header model)
      {
          if (id != model.CustomFieldHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSIndicatorCustomField_Header.AnyAsync(e => e.CustomFieldHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsindicatorcustomfield-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSIndicatorCustomField_Header(int id)
      {
          var item = await _db.Const_PMSIndicatorCustomField_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSIndicatorCustomField_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSIndicatorProgress ===
      [HttpGet("const-pmsindicatorprogress")]
      public async Task<IActionResult> GetAllConst_PMSIndicatorProgress([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSIndicatorProgress.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsindicatorprogress/{id}")]
      public async Task<IActionResult> GetConst_PMSIndicatorProgressById(int id)
      {
          var item = await _db.Const_PMSIndicatorProgress.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsindicatorprogress")]
      public async Task<IActionResult> CreateConst_PMSIndicatorProgress([FromBody] Const_PMSIndicatorProgress model)
      {
          _db.Const_PMSIndicatorProgress.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSIndicatorProgressById), new { id = model.Progress_ID }, model);
      }

      [HttpPut("const-pmsindicatorprogress/{id}")]
      public async Task<IActionResult> UpdateConst_PMSIndicatorProgress(int id, [FromBody] Const_PMSIndicatorProgress model)
      {
          if (id != model.Progress_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSIndicatorProgress.AnyAsync(e => e.Progress_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsindicatorprogress/{id}")]
      public async Task<IActionResult> DeleteConst_PMSIndicatorProgress(int id)
      {
          var item = await _db.Const_PMSIndicatorProgress.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSIndicatorProgress.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSIndicatorQuarterlySubmissionDeadline ===
      [HttpGet("const-pmsindicatorquarterlysubmissiondeadline")]
      public async Task<IActionResult> GetAllConst_PMSIndicatorQuarterlySubmissionDeadline([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSIndicatorQuarterlySubmissionDeadline.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsindicatorquarterlysubmissiondeadline/{id}")]
      public async Task<IActionResult> GetConst_PMSIndicatorQuarterlySubmissionDeadlineById(int id)
      {
          var item = await _db.Const_PMSIndicatorQuarterlySubmissionDeadline.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsindicatorquarterlysubmissiondeadline")]
      public async Task<IActionResult> CreateConst_PMSIndicatorQuarterlySubmissionDeadline([FromBody] Const_PMSIndicatorQuarterlySubmissionDeadline model)
      {
          _db.Const_PMSIndicatorQuarterlySubmissionDeadline.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSIndicatorQuarterlySubmissionDeadlineById), new { id = model.KpiSubmissionDeadline_ID }, model);
      }

      [HttpPut("const-pmsindicatorquarterlysubmissiondeadline/{id}")]
      public async Task<IActionResult> UpdateConst_PMSIndicatorQuarterlySubmissionDeadline(int id, [FromBody] Const_PMSIndicatorQuarterlySubmissionDeadline model)
      {
          if (id != model.KpiSubmissionDeadline_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSIndicatorQuarterlySubmissionDeadline.AnyAsync(e => e.KpiSubmissionDeadline_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsindicatorquarterlysubmissiondeadline/{id}")]
      public async Task<IActionResult> DeleteConst_PMSIndicatorQuarterlySubmissionDeadline(int id)
      {
          var item = await _db.Const_PMSIndicatorQuarterlySubmissionDeadline.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSIndicatorQuarterlySubmissionDeadline.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSIndicatorUnitMeasure ===
      [HttpGet("const-pmsindicatorunitmeasure")]
      public async Task<IActionResult> GetAllConst_PMSIndicatorUnitMeasure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSIndicatorUnitMeasure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsindicatorunitmeasure/{id}")]
      public async Task<IActionResult> GetConst_PMSIndicatorUnitMeasureById(int id)
      {
          var item = await _db.Const_PMSIndicatorUnitMeasure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsindicatorunitmeasure")]
      public async Task<IActionResult> CreateConst_PMSIndicatorUnitMeasure([FromBody] Const_PMSIndicatorUnitMeasure model)
      {
          _db.Const_PMSIndicatorUnitMeasure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSIndicatorUnitMeasureById), new { id = model.UnitMeasure_ID }, model);
      }

      [HttpPut("const-pmsindicatorunitmeasure/{id}")]
      public async Task<IActionResult> UpdateConst_PMSIndicatorUnitMeasure(int id, [FromBody] Const_PMSIndicatorUnitMeasure model)
      {
          if (id != model.UnitMeasure_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSIndicatorUnitMeasure.AnyAsync(e => e.UnitMeasure_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsindicatorunitmeasure/{id}")]
      public async Task<IActionResult> DeleteConst_PMSIndicatorUnitMeasure(int id)
      {
          var item = await _db.Const_PMSIndicatorUnitMeasure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSIndicatorUnitMeasure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSMidYearField_Detail ===
      [HttpGet("const-pmsmidyearfield-detail")]
      public async Task<IActionResult> GetAllConst_PMSMidYearField_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSMidYearField_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsmidyearfield-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSMidYearField_DetailById(int id)
      {
          var item = await _db.Const_PMSMidYearField_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsmidyearfield-detail")]
      public async Task<IActionResult> CreateConst_PMSMidYearField_Detail([FromBody] Const_PMSMidYearField_Detail model)
      {
          _db.Const_PMSMidYearField_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSMidYearField_DetailById), new { id = model.MidYearFieldDetail_ID }, model);
      }

      [HttpPut("const-pmsmidyearfield-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSMidYearField_Detail(int id, [FromBody] Const_PMSMidYearField_Detail model)
      {
          if (id != model.MidYearFieldDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSMidYearField_Detail.AnyAsync(e => e.MidYearFieldDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsmidyearfield-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSMidYearField_Detail(int id)
      {
          var item = await _db.Const_PMSMidYearField_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSMidYearField_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSMidYearField_Header ===
      [HttpGet("const-pmsmidyearfield-header")]
      public async Task<IActionResult> GetAllConst_PMSMidYearField_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSMidYearField_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsmidyearfield-header/{id}")]
      public async Task<IActionResult> GetConst_PMSMidYearField_HeaderById(int id)
      {
          var item = await _db.Const_PMSMidYearField_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsmidyearfield-header")]
      public async Task<IActionResult> CreateConst_PMSMidYearField_Header([FromBody] Const_PMSMidYearField_Header model)
      {
          _db.Const_PMSMidYearField_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSMidYearField_HeaderById), new { id = model.MidYearFieldHeader_ID }, model);
      }

      [HttpPut("const-pmsmidyearfield-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSMidYearField_Header(int id, [FromBody] Const_PMSMidYearField_Header model)
      {
          if (id != model.MidYearFieldHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSMidYearField_Header.AnyAsync(e => e.MidYearFieldHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsmidyearfield-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSMidYearField_Header(int id)
      {
          var item = await _db.Const_PMSMidYearField_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSMidYearField_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSOrganisationNKPAWeighting_Detail ===
      [HttpGet("const-pmsorganisationnkpaweighting-detail")]
      public async Task<IActionResult> GetAllConst_PMSOrganisationNKPAWeighting_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSOrganisationNKPAWeighting_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsorganisationnkpaweighting-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSOrganisationNKPAWeighting_DetailById(int id)
      {
          var item = await _db.Const_PMSOrganisationNKPAWeighting_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsorganisationnkpaweighting-detail")]
      public async Task<IActionResult> CreateConst_PMSOrganisationNKPAWeighting_Detail([FromBody] Const_PMSOrganisationNKPAWeighting_Detail model)
      {
          _db.Const_PMSOrganisationNKPAWeighting_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSOrganisationNKPAWeighting_DetailById), new { id = model.OrganisationNKPAWeightingDetail_ID }, model);
      }

      [HttpPut("const-pmsorganisationnkpaweighting-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSOrganisationNKPAWeighting_Detail(int id, [FromBody] Const_PMSOrganisationNKPAWeighting_Detail model)
      {
          if (id != model.OrganisationNKPAWeightingDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSOrganisationNKPAWeighting_Detail.AnyAsync(e => e.OrganisationNKPAWeightingDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsorganisationnkpaweighting-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSOrganisationNKPAWeighting_Detail(int id)
      {
          var item = await _db.Const_PMSOrganisationNKPAWeighting_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSOrganisationNKPAWeighting_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSOrganisationNKPAWeighting_Header ===
      [HttpGet("const-pmsorganisationnkpaweighting-header")]
      public async Task<IActionResult> GetAllConst_PMSOrganisationNKPAWeighting_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSOrganisationNKPAWeighting_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsorganisationnkpaweighting-header/{id}")]
      public async Task<IActionResult> GetConst_PMSOrganisationNKPAWeighting_HeaderById(int id)
      {
          var item = await _db.Const_PMSOrganisationNKPAWeighting_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsorganisationnkpaweighting-header")]
      public async Task<IActionResult> CreateConst_PMSOrganisationNKPAWeighting_Header([FromBody] Const_PMSOrganisationNKPAWeighting_Header model)
      {
          _db.Const_PMSOrganisationNKPAWeighting_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSOrganisationNKPAWeighting_HeaderById), new { id = model.OrganisationNKPAWeightingHeader_ID }, model);
      }

      [HttpPut("const-pmsorganisationnkpaweighting-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSOrganisationNKPAWeighting_Header(int id, [FromBody] Const_PMSOrganisationNKPAWeighting_Header model)
      {
          if (id != model.OrganisationNKPAWeightingHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSOrganisationNKPAWeighting_Header.AnyAsync(e => e.OrganisationNKPAWeightingHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsorganisationnkpaweighting-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSOrganisationNKPAWeighting_Header(int id)
      {
          var item = await _db.Const_PMSOrganisationNKPAWeighting_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSOrganisationNKPAWeighting_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSPostCoreCompetencyRequirement_Detail ===
      [HttpGet("const-pmspostcorecompetencyrequirement-detail")]
      public async Task<IActionResult> GetAllConst_PMSPostCoreCompetencyRequirement_Detail([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSPostCoreCompetencyRequirement_Detail.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmspostcorecompetencyrequirement-detail/{id}")]
      public async Task<IActionResult> GetConst_PMSPostCoreCompetencyRequirement_DetailById(int id)
      {
          var item = await _db.Const_PMSPostCoreCompetencyRequirement_Detail.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmspostcorecompetencyrequirement-detail")]
      public async Task<IActionResult> CreateConst_PMSPostCoreCompetencyRequirement_Detail([FromBody] Const_PMSPostCoreCompetencyRequirement_Detail model)
      {
          _db.Const_PMSPostCoreCompetencyRequirement_Detail.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSPostCoreCompetencyRequirement_DetailById), new { id = model.PostCoreCompetencyRequirementDetail_ID }, model);
      }

      [HttpPut("const-pmspostcorecompetencyrequirement-detail/{id}")]
      public async Task<IActionResult> UpdateConst_PMSPostCoreCompetencyRequirement_Detail(int id, [FromBody] Const_PMSPostCoreCompetencyRequirement_Detail model)
      {
          if (id != model.PostCoreCompetencyRequirementDetail_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSPostCoreCompetencyRequirement_Detail.AnyAsync(e => e.PostCoreCompetencyRequirementDetail_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmspostcorecompetencyrequirement-detail/{id}")]
      public async Task<IActionResult> DeleteConst_PMSPostCoreCompetencyRequirement_Detail(int id)
      {
          var item = await _db.Const_PMSPostCoreCompetencyRequirement_Detail.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSPostCoreCompetencyRequirement_Detail.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSPostCoreCompetencyRequirement_Header ===
      [HttpGet("const-pmspostcorecompetencyrequirement-header")]
      public async Task<IActionResult> GetAllConst_PMSPostCoreCompetencyRequirement_Header([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSPostCoreCompetencyRequirement_Header.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmspostcorecompetencyrequirement-header/{id}")]
      public async Task<IActionResult> GetConst_PMSPostCoreCompetencyRequirement_HeaderById(int id)
      {
          var item = await _db.Const_PMSPostCoreCompetencyRequirement_Header.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmspostcorecompetencyrequirement-header")]
      public async Task<IActionResult> CreateConst_PMSPostCoreCompetencyRequirement_Header([FromBody] Const_PMSPostCoreCompetencyRequirement_Header model)
      {
          _db.Const_PMSPostCoreCompetencyRequirement_Header.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSPostCoreCompetencyRequirement_HeaderById), new { id = model.PostCoreCompetencyRequirementHeader_ID }, model);
      }

      [HttpPut("const-pmspostcorecompetencyrequirement-header/{id}")]
      public async Task<IActionResult> UpdateConst_PMSPostCoreCompetencyRequirement_Header(int id, [FromBody] Const_PMSPostCoreCompetencyRequirement_Header model)
      {
          if (id != model.PostCoreCompetencyRequirementHeader_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSPostCoreCompetencyRequirement_Header.AnyAsync(e => e.PostCoreCompetencyRequirementHeader_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmspostcorecompetencyrequirement-header/{id}")]
      public async Task<IActionResult> DeleteConst_PMSPostCoreCompetencyRequirement_Header(int id)
      {
          var item = await _db.Const_PMSPostCoreCompetencyRequirement_Header.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSPostCoreCompetencyRequirement_Header.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_PMSScorecardType ===
      [HttpGet("const-pmsscorecardtype")]
      public async Task<IActionResult> GetAllConst_PMSScorecardType([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_PMSScorecardType.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-pmsscorecardtype/{id}")]
      public async Task<IActionResult> GetConst_PMSScorecardTypeById(int id)
      {
          var item = await _db.Const_PMSScorecardType.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-pmsscorecardtype")]
      public async Task<IActionResult> CreateConst_PMSScorecardType([FromBody] Const_PMSScorecardType model)
      {
          _db.Const_PMSScorecardType.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_PMSScorecardTypeById), new { id = model.ScorecardType_ID }, model);
      }

      [HttpPut("const-pmsscorecardtype/{id}")]
      public async Task<IActionResult> UpdateConst_PMSScorecardType(int id, [FromBody] Const_PMSScorecardType model)
      {
          if (id != model.ScorecardType_ID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_PMSScorecardType.AnyAsync(e => e.ScorecardType_ID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-pmsscorecardtype/{id}")]
      public async Task<IActionResult> DeleteConst_PMSScorecardType(int id)
      {
          var item = await _db.Const_PMSScorecardType.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_PMSScorecardType.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Costing_Structure ===
      [HttpGet("const-scoa-costing-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Costing_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Costing_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-costing-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_Costing_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Costing_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-costing-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Costing_Structure([FromBody] Const_SCOA_Costing_Structure model)
      {
          _db.Const_SCOA_Costing_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_Costing_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-costing-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Costing_Structure(int id, [FromBody] Const_SCOA_Costing_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Costing_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-costing-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Costing_Structure(int id)
      {
          var item = await _db.Const_SCOA_Costing_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Costing_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Function_Structure ===
      [HttpGet("const-scoa-function-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Function_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Function_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-function-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_Function_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Function_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-function-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Function_Structure([FromBody] Const_SCOA_Function_Structure model)
      {
          _db.Const_SCOA_Function_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_Function_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-function-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Function_Structure(int id, [FromBody] Const_SCOA_Function_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Function_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-function-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Function_Structure(int id)
      {
          var item = await _db.Const_SCOA_Function_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Function_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Funds_Structure ===
      [HttpGet("const-scoa-funds-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Funds_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Funds_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-funds-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_Funds_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Funds_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-funds-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Funds_Structure([FromBody] Const_SCOA_Funds_Structure model)
      {
          _db.Const_SCOA_Funds_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_Funds_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-funds-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Funds_Structure(int id, [FromBody] Const_SCOA_Funds_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Funds_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-funds-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Funds_Structure(int id)
      {
          var item = await _db.Const_SCOA_Funds_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Funds_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Project_Structure ===
      [HttpGet("const-scoa-project-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Project_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Project_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-project-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_Project_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Project_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-project-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Project_Structure([FromBody] Const_SCOA_Project_Structure model)
      {
          _db.Const_SCOA_Project_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_Project_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-project-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Project_Structure(int id, [FromBody] Const_SCOA_Project_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Project_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-project-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Project_Structure(int id)
      {
          var item = await _db.Const_SCOA_Project_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Project_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Regional_Structure ===
      [HttpGet("const-scoa-regional-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Regional_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Regional_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-regional-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_Regional_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Regional_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-regional-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Regional_Structure([FromBody] Const_SCOA_Regional_Structure model)
      {
          _db.Const_SCOA_Regional_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_Regional_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-regional-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Regional_Structure(int id, [FromBody] Const_SCOA_Regional_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Regional_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-regional-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Regional_Structure(int id)
      {
          var item = await _db.Const_SCOA_Regional_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Regional_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }

      // === Const_SCOA_Structure ===
      [HttpGet("const-scoa-structure")]
      public async Task<IActionResult> GetAllConst_SCOA_Structure([FromQuery] int page = 1, [FromQuery] int pageSize = 200)
      {
          var q = _db.Const_SCOA_Structure.AsQueryable();
          var total = await q.CountAsync();
          var items = await q.Skip((page-1)*pageSize).Take(pageSize).ToListAsync();
          Response.Headers["X-Total-Count"] = total.ToString();
          return Ok(items);
      }

      [HttpGet("const-scoa-structure/{id}")]
      public async Task<IActionResult> GetConst_SCOA_StructureById(int id)
      {
          var item = await _db.Const_SCOA_Structure.FindAsync(id);
          return item == null ? NotFound() : Ok(item);
      }

      [HttpPost("const-scoa-structure")]
      public async Task<IActionResult> CreateConst_SCOA_Structure([FromBody] Const_SCOA_Structure model)
      {
          _db.Const_SCOA_Structure.Add(model);
          await _db.SaveChangesAsync();
          return CreatedAtAction(nameof(GetConst_SCOA_StructureById), new { id = model.ScoaID }, model);
      }

      [HttpPut("const-scoa-structure/{id}")]
      public async Task<IActionResult> UpdateConst_SCOA_Structure(int id, [FromBody] Const_SCOA_Structure model)
      {
          if (id != model.ScoaID) return BadRequest("ID mismatch");
          _db.Entry(model).State = EntityState.Modified;
          try { await _db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!await _db.Const_SCOA_Structure.AnyAsync(e => e.ScoaID == id)) return NotFound(); throw; }
          return NoContent();
      }

      [HttpDelete("const-scoa-structure/{id}")]
      public async Task<IActionResult> DeleteConst_SCOA_Structure(int id)
      {
          var item = await _db.Const_SCOA_Structure.FindAsync(id);
          if (item == null) return NotFound();
          _db.Const_SCOA_Structure.Remove(item);
          await _db.SaveChangesAsync();
          return NoContent();
      }
  }
  