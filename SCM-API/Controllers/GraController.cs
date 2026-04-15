using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/gra")]
public class GraController : ControllerBase
{
    private readonly IGrnGraService _service;
    private readonly ILogger<GraController> _logger;

    public GraController(IGrnGraService service, ILogger<GraController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? search, [FromQuery] string? graNumber, [FromQuery] string? returnNumber,
        [FromQuery] string? debitNoteNumber, [FromQuery] string? financialYear,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = (await _service.GetAllGraDictsAsync()).AsEnumerable();

        if (!string.IsNullOrEmpty(graNumber))
            query = query.Where(g => g.TryGetValue("graNumber", out var gn) && gn?.ToString()?.Contains(graNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(returnNumber))
            query = query.Where(g => g.TryGetValue("returnNumber", out var rn) && rn?.ToString()?.Contains(returnNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(debitNoteNumber))
            query = query.Where(g => g.TryGetValue("debitNoteNumber", out var dn) && dn?.ToString()?.Contains(debitNoteNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(g =>
                (g.TryGetValue("graNumber", out var gn) && gn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (g.TryGetValue("vendorName", out var vn) && vn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (g.TryGetValue("debitNoteNumber", out var dn) && dn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(g => g.TryGetValue("createdDate", out var cd) ? cd?.ToString() : "").ToList();
        var totalCount = items.Count;
        var paged = items.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new
        {
            data = paged,
            total = totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            page,
            pageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var gra = await _service.GetGraDictAsync(id);
        if (gra == null)
            return NotFound(new { message = "GRA not found" });
        return Ok(gra);
    }

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var allReturns = (await _service.GetAllReturnDictsAsync()).ToList();
        var allGras = (await _service.GetAllGraDictsAsync()).ToList();

        return Ok(new
        {
            totalReturns = allReturns.Count,
            pendingReturns = allReturns.Count(r => GetStatus(r) == "pending_approval"),
            approvedReturns = allReturns.Count(r => GetStatus(r) == "approved" || GetStatus(r) == "gra_created"),
            totalReturnValue = allReturns.Sum(r => GetBudgetImpact(r)),
            activeGRAs = allGras.Count
        });
    }

    [HttpGet("returns")]
    public async Task<ActionResult> GetReturns(
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? returnNumber,
        [FromQuery] string? grnNumber, [FromQuery] string? orderNumber, [FromQuery] string? vendorName,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = (await _service.GetAllReturnDictsAsync()).AsEnumerable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => string.Equals(GetStatus(r), status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(returnNumber))
            query = query.Where(r => r.TryGetValue("returnNumber", out var rn) && rn?.ToString()?.Contains(returnNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(grnNumber))
            query = query.Where(r => r.TryGetValue("grnNumber", out var gn) && gn?.ToString()?.Contains(grnNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(orderNumber))
            query = query.Where(r => r.TryGetValue("orderNumber", out var on) && on?.ToString()?.Contains(orderNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(vendorName))
            query = query.Where(r => r.TryGetValue("vendorName", out var vn) && vn?.ToString()?.Contains(vendorName, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(r =>
                (r.TryGetValue("returnNumber", out var rn) && rn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (r.TryGetValue("vendorName", out var vn) && vn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (r.TryGetValue("grnNumber", out var gn) && gn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(r => r.TryGetValue("returnDate", out var rd) ? rd?.ToString() : "").ToList();
        var totalCount = items.Count;
        var paged = items.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new
        {
            data = paged,
            total = totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            page,
            pageSize
        });
    }

    [HttpGet("returns/{id:int}")]
    public async Task<ActionResult> GetReturnById(int id)
    {
        var ret = await _service.GetReturnDictAsync(id);
        if (ret == null)
            return NotFound(new { message = "Return not found" });
        return Ok(ret);
    }

    [HttpPost("returns")]
    public async Task<ActionResult> CreateReturn([FromBody] JsonElement dto)
    {
        int grnId = 0;
        if (dto.ValueKind == JsonValueKind.Object && dto.TryGetProperty("grnId", out var grnIdProp))
            grnId = grnIdProp.ValueKind == JsonValueKind.Number ? grnIdProp.GetInt32() : int.TryParse(grnIdProp.GetString(), out var p) ? p : 0;

        if (grnId <= 0)
            return BadRequest(new { message = "GRN ID is required. Load an approved GRN first." });

        var data = new Dictionary<string, object?>();
        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                if (prop.Name is "id" or "returnNumber" or "status") continue;
                data[prop.Name] = ConvertJsonElement(prop.Value);
            }
        }

        if (data.TryGetValue("lineItems", out var liObj) && liObj is object?[] lines)
        {
            decimal totalValue = 0;
            foreach (var lineRaw in lines)
            {
                if (lineRaw is Dictionary<string, object?> line && line.TryGetValue("returnQuantity", out var rq))
                    totalValue += Convert.ToInt32(rq ?? 0) * 100m;
            }
            data["budgetImpact"] = totalValue;
        }

        var (result, error) = await _service.CreateReturnDictAsync(grnId, data);
        if (result == null)
            return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("returns/{id:int}/submit")]
    public async Task<ActionResult> SubmitReturn(int id)
    {
        var (result, error) = await _service.SubmitReturnDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("returns/{id:int}/approve")]
    public async Task<ActionResult> ApproveReturn(int id)
    {
        var (result, error) = await _service.ApproveReturnDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("returns/{id:int}/decline")]
    public async Task<ActionResult> DeclineReturn(int id, [FromBody] JsonElement dto)
    {
        var comment = "";
        if (dto.ValueKind == JsonValueKind.Object && dto.TryGetProperty("comment", out var cp))
            comment = cp.GetString() ?? "";

        var (result, error) = await _service.DeclineReturnDictAsync(id, comment);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("returns/{id:int}")]
    public async Task<ActionResult> UpdateReturn(int id, [FromBody] JsonElement dto)
    {
        var ret = await _service.GetReturnDictAsync(id);
        if (ret == null)
            return NotFound(new { message = "Return not found" });

        var currentStatus = GetStatus(ret);
        if (currentStatus != "draft")
            return BadRequest(new { message = $"Cannot edit return in '{currentStatus}' status. Only draft returns can be edited." });

        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                var key = prop.Name;
                if (key == "id" || key == "returnNumber" || key == "status") continue;
                ret[key] = ConvertJsonElement(prop.Value);
            }
        }

        if (ret.TryGetValue("lineItems", out var liObj) && liObj is object?[] lines)
        {
            decimal totalValue = 0;
            foreach (var lineRaw in lines)
            {
                if (lineRaw is Dictionary<string, object?> line)
                {
                    var returnQty = 0;
                    if (line.TryGetValue("returnQuantity", out var rq))
                        returnQty = Convert.ToInt32(rq ?? 0);
                    totalValue += returnQty * 100m;
                }
            }
            ret["budgetImpact"] = totalValue;
        }

        AddAuditEntry(ret, "Updated", "Return details updated");
        return Ok(ret);
    }

    [HttpDelete("returns/{id:int}")]
    public async Task<ActionResult> DeleteReturn(int id)
    {
        var ret = await _service.GetReturnDictAsync(id);
        if (ret == null)
            return NotFound(new { message = "Return not found" });

        var currentStatus = GetStatus(ret);
        if (currentStatus != "draft")
            return BadRequest(new { message = $"Cannot delete return in '{currentStatus}' status. Only draft returns can be deleted." });

        await _service.DeleteReturnDictAsync(id);
        return Ok(new { message = "Return deleted successfully" });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateGra(int id, [FromBody] JsonElement dto)
    {
        var gra = await _service.GetGraDictAsync(id);
        if (gra == null)
            return NotFound(new { message = "GRA not found" });

        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                var key = prop.Name;
                if (key == "id" || key == "graNumber" || key == "debitNoteNumber") continue;
                gra[key] = ConvertJsonElement(prop.Value);
            }
        }

        return Ok(gra);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteGra(int id)
    {
        var gra = await _service.GetGraDictAsync(id);
        if (gra == null)
            return NotFound(new { message = "GRA not found" });

        await _service.DeleteGraDictAsync(id);
        return Ok(new { message = "GRA deleted successfully" });
    }

    [HttpPost]
    public async Task<ActionResult> CreateGra([FromBody] JsonElement dto)
    {
        int returnId = 0;
        string description = "";

        if (dto.ValueKind == JsonValueKind.Object)
        {
            if (dto.TryGetProperty("returnId", out var ridProp))
                returnId = ridProp.ValueKind == JsonValueKind.Number ? ridProp.GetInt32() : int.TryParse(ridProp.GetString(), out var parsed) ? parsed : 0;
            if (dto.TryGetProperty("description", out var descProp))
                description = descProp.GetString() ?? "";
        }

        var (result, error) = await _service.CreateGraDictAsync(returnId, description);
        if (result == null)
            return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<ActionResult> GetPdf(int id) => Ok(new { message = "PDF generation not implemented" });

    [HttpGet("{id:int}/debit-note")]
    public async Task<ActionResult> GetDebitNote(int id) => Ok(new { message = "Debit note generation not implemented" });

    private static string GetStatus(Dictionary<string, object?> item)
        => item.TryGetValue("status", out var s) ? s?.ToString() ?? "" : "";

    private static decimal GetBudgetImpact(Dictionary<string, object?> item)
    {
        if (!item.TryGetValue("budgetImpact", out var bi) || bi == null) return 0m;
        if (bi is decimal d) return d;
        if (bi is long l) return l;
        if (bi is int i) return i;
        if (decimal.TryParse(bi.ToString(), out var parsed)) return parsed;
        return 0m;
    }

    private static void AddAuditEntry(Dictionary<string, object?> item, string action, string message, string type = "action")
    {
        var existing = item.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        existing.Add(new { action, by = "Admin", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), type, message });
        item["auditTrail"] = existing.ToArray();
    }

    private static object? ConvertJsonElement(JsonElement el)
    {
        return el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number => el.TryGetInt64(out var l) ? (object)l : el.GetDecimal(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            JsonValueKind.Array => el.EnumerateArray().Select(ConvertJsonElement).ToArray(),
            JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
            _ => el.ToString()
        };
    }
}
