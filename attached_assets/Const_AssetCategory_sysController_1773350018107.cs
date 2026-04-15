using AssetManagement.Models;
using AssetManagement.Services;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class Const_AssetCategory_sysController : ControllerBase
    {
        private readonly IConst_AssetCategory_sysService _service;

        public Const_AssetCategory_sysController(IConst_AssetCategory_sysService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Const_AssetCategory_sys model)
        {
            var result = await _service.CreateAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = result.AssetCategoryID }, result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var results = await _service.GetAllAsync();
            return Ok(results);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Const_AssetCategory_sys model)
        {
            if (id != model.AssetCategoryID) return BadRequest();

            var success = await _service.UpdateAsync(model);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
