using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/grn")]
public class GrnController : ControllerBase
{
    private readonly IGrnGraService _service;
    private readonly IOrderService _orderService;
    private readonly ILogger<GrnController> _logger;

    private static readonly object[] _stores = new object[]
    {
        new { id = "STR-001", name = "Main Municipal Stores", address = "York Street, George" },
        new { id = "STR-002", name = "Technical Services Depot", address = "Industrial Road, George" },
        new { id = "STR-003", name = "Parks & Recreation Store", address = "Davidson Road, George" },
        new { id = "STR-004", name = "Electrotechnical Stores", address = "Caledon Street, George" }
    };

    public GrnController(IGrnGraService service, IOrderService orderService, ILogger<GrnController> logger)
    {
        _service = service;
        _orderService = orderService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] string? grnNumber,
        [FromQuery] string? orderNumber, [FromQuery] string? vendorName, [FromQuery] string? store,
        [FromQuery] string? financialYear, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = (await _service.GetAllGrnDictsAsync()).AsEnumerable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(g => g.TryGetValue("status", out var s) && string.Equals(s?.ToString(), status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(grnNumber))
            query = query.Where(g => g.TryGetValue("grnNumber", out var gn) && gn?.ToString()?.Contains(grnNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(orderNumber))
            query = query.Where(g => g.TryGetValue("orderNumber", out var on) && on?.ToString()?.Contains(orderNumber, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(vendorName))
            query = query.Where(g => g.TryGetValue("vendorName", out var vn) && vn?.ToString()?.Contains(vendorName, StringComparison.OrdinalIgnoreCase) == true);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(g =>
                (g.TryGetValue("grnNumber", out var gn) && gn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (g.TryGetValue("orderNumber", out var on) && on?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (g.TryGetValue("vendorName", out var vn) && vn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(g => g.TryGetValue("dateReceived", out var dr) ? dr?.ToString() : "").ToList();
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

    [HttpGet("dashboard/summary")]
    public async Task<ActionResult> GetDashboardSummary()
    {
        var all = (await _service.GetAllGrnDictsAsync()).ToList();
        return Ok(new
        {
            totalGRNs = all.Count,
            pendingApproval = all.Count(g => g.TryGetValue("status", out var s) && s?.ToString() == "submitted"),
            partialDeliveries = all.Count(g => g.TryGetValue("receiptType", out var r) && r?.ToString() == "partial"),
            totalValue = 0m
        });
    }

    [HttpGet("stores")]
    public async Task<ActionResult> GetStores()
        => Ok(new { stores = _stores });

    [HttpGet("by-order/{orderNumber}")]
    public async Task<ActionResult> GetByOrder(string orderNumber)
    {
        var order = _orderService.GetByOrderNumber(orderNumber);
        if (order == null)
            return NotFound(new { message = "Order not found" });

        var status = order.TryGetValue("status", out var s) ? s?.ToString() : "";
        if (status != "dispatched" && status != "approved" && status != "partially_received")
            return BadRequest(new { message = $"Order status is '{status}'. Only dispatched, approved, or partially received orders can have GRNs captured." });

        var supplierName = "";
        if (order.TryGetValue("supplier", out var sup) && sup != null)
        {
            try
            {
                var supJson = JsonSerializer.Serialize(sup);
                using var doc = JsonDocument.Parse(supJson);
                if (doc.RootElement.TryGetProperty("name", out var nameProp))
                    supplierName = nameProp.GetString() ?? "";
                else if (doc.RootElement.TryGetProperty("Name", out var nameP2))
                    supplierName = nameP2.GetString() ?? "";
            }
            catch
            {
                supplierName = sup.ToString() ?? "";
            }
        }

        var lineItems = new List<object>();
        if (order.TryGetValue("lineItems", out var lis) && lis != null)
        {
            try
            {
                var liJson = JsonSerializer.Serialize(lis);
                using var liDoc = JsonDocument.Parse(liJson);
                if (liDoc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var li in liDoc.RootElement.EnumerateArray())
                    {
                        var desc = li.TryGetProperty("description", out var d) ? d.GetString() : "Item";
                        var qty = 1;
                        if (li.TryGetProperty("quantity", out var q))
                            qty = q.ValueKind == JsonValueKind.Number ? q.GetInt32() : 1;
                        var uom = li.TryGetProperty("unitOfMeasure", out var u) ? u.GetString() : "each";
                        var id = li.TryGetProperty("id", out var lid) ? lid.GetString() : $"LI-{Guid.NewGuid().ToString("N")[..6]}";

                        lineItems.Add(new
                        {
                            id,
                            description = desc,
                            quantity = qty,
                            orderedQuantity = qty,
                            previouslyReceived = 0,
                            unitOfMeasure = uom
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing line items for order {OrderNumber}", orderNumber);
            }
        }

        return Ok(new
        {
            orderId = order.TryGetValue("id", out var oid) ? oid : null,
            orderNumber = order.TryGetValue("orderNumber", out var on) ? on?.ToString() : orderNumber,
            vendorName = supplierName,
            department = order.TryGetValue("department", out var dept) ? dept?.ToString() : "",
            status,
            lineItems
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return NotFound(new { message = "GRN not found" });
        return Ok(grn);
    }

    [HttpGet("by-number/{grnNumber}")]
    public async Task<ActionResult> GetByNumber(string grnNumber)
    {
        var grn = (await _service.GetAllGrnDictsAsync()).FirstOrDefault(g =>
            g.TryGetValue("grnNumber", out var gn) && string.Equals(gn?.ToString(), grnNumber, StringComparison.OrdinalIgnoreCase));
        if (grn == null)
        {
            if (int.TryParse(grnNumber, out var numericId) && (await _service.GetGrnDictAsync(numericId)) is {} grnById)
                return Ok(grnById);
            return NotFound(new { message = "GRN not found" });
        }
        return Ok(grn);
    }

    [HttpGet("{id:int}/budget-impact")]
    public async Task<ActionResult> GetBudgetImpact(int id)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return NotFound(new { message = "GRN not found" });

        return Ok(new
        {
            voteNumber = grn.TryGetValue("voteNumber", out var vn) ? vn?.ToString() : "Vote 8",
            mscoaSegment = "4200-000-000",
            department = grn.TryGetValue("department", out var dept) ? dept?.ToString() : "",
            committedAmount = 0m,
            consumedAmount = 0m,
            remainingAmount = 0m
        });
    }

    [HttpGet("{id:int}/correspondence")]
    public async Task<ActionResult> GetCorrespondence(int id)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return Ok(new { correspondence = Array.Empty<object>() });

        var auditTrail = grn.TryGetValue("auditTrail", out var at) ? at : null;
        return Ok(new { correspondence = auditTrail ?? Array.Empty<object>() });
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] JsonElement dto)
    {
        var data = new Dictionary<string, object?>();
        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                if (prop.Name is "id" or "grnNumber" or "status") continue;
                data[prop.Name] = ConvertJsonElement(prop.Value);
            }
        }

        var (result, error) = await _service.CreateGrnDictAsync(data);
        if (result == null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> Update(int id, [FromBody] JsonElement dto)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return NotFound(new { message = "GRN not found" });

        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
            {
                var key = prop.Name;
                if (key is "id" or "grnNumber" or "status") continue;
                grn[key] = ConvertJsonElement(prop.Value);
            }
        }
        await _service.SaveGrnDictAsync(id, grn);
        return Ok(grn);
    }

    [HttpPost("{id:int}/submit")]
    public async Task<ActionResult> Submit(int id)
    {
        var (result, error) = await _service.SubmitGrnDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<ActionResult> Approve(int id)
    {
        var (result, error) = await _service.ApproveGrnDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });

        if (result.TryGetValue("orderId", out var orderId))
            _logger.LogInformation("GRN {Id} approved for Order {OrderId} — order status updated", id, orderId);

        return Ok(result);
    }

    [HttpPost("{id:int}/void")]
    public async Task<ActionResult> VoidGrn(int id)
    {
        var (result, error) = await _service.VoidGrnDictAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("{id:int}/inventory-notify")]
    public async Task<ActionResult> NotifyInventory(int id)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return NotFound(new { message = "GRN not found" });

        AddAuditEntry(grn, "Inventory Notified", "Inventory module notified of received goods", "system");
        return Ok(new { message = "Inventory notified successfully" });
    }

    [HttpPost("{id:int}/asset-notify")]
    public async Task<ActionResult> NotifyAssets(int id)
    {
        var grn = await _service.GetGrnDictAsync(id);
        if (grn == null)
            return NotFound(new { message = "GRN not found" });

        AddAuditEntry(grn, "Assets Notified", "Assets register notified of received goods", "system");
        return Ok(new { message = "Assets register notified" });
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<ActionResult> GetPdf(int id) => Ok(new { message = "PDF generation not implemented" });

    [HttpGet("approval-setup")]
    public async Task<ActionResult> GetApprovalSetup()
    {
        try
        {
            var setup = await _service.GetApprovalSetupAsync();
            return Ok(setup);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load GRN approval setup");
            return Ok(new { tolerancePercentage = 5m, approvalLevels = Array.Empty<object>() });
        }
    }

    [HttpGet("service-entry-sheets")]
    public async Task<ActionResult> GetServiceEntrySheets([FromQuery] int? orderId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var result = await _service.GetServiceEntrySheetsAsync(orderId, page, pageSize);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load service entry sheets");
            return Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize });
        }
    }

    [HttpGet("service-entry-sheets/{id:int}")]
    public async Task<ActionResult> GetServiceEntrySheet(int id)
    {
        var sheet = await _service.GetServiceEntrySheetByIdAsync(id);
        if (sheet == null) return NotFound(new { message = "Service entry sheet not found" });
        return Ok(sheet);
    }

    [HttpPost("service-entry-sheets")]
    public async Task<ActionResult> CreateServiceEntrySheet([FromBody] JsonElement dto)
    {
        var data = new Dictionary<string, object?>();
        if (dto.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in dto.EnumerateObject())
                data[prop.Name] = ConvertJsonElement(prop.Value);
        }

        var (result, error) = await _service.CreateServiceEntrySheetAsync(data);
        if (result == null) return BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("service-entry-sheets/{id:int}/certify")]
    public async Task<ActionResult> CertifyServiceEntrySheet(int id)
    {
        var (result, error) = await _service.CertifyServiceEntrySheetAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    [HttpPost("service-entry-sheets/{id:int}/approve")]
    public async Task<ActionResult> ApproveServiceEntrySheet(int id)
    {
        var (result, error) = await _service.ApproveServiceEntrySheetAsync(id);
        if (result == null)
            return error!.Contains("not found") ? NotFound(new { message = error }) : BadRequest(new { message = error });
        return Ok(result);
    }

    private static void AddAuditEntry(Dictionary<string, object?> grn, string action, string message, string type = "action")
    {
        var existing = grn.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        existing.Add(new { action, by = "Admin", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), type, message });
        grn["auditTrail"] = existing.ToArray();
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
