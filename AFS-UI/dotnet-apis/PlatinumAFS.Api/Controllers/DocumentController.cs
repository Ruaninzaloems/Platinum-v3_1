using Microsoft.AspNetCore.Mvc;
using PlatinumAFS.Api.DTOs;
using PlatinumAFS.Api.Models;
using PlatinumAFS.Api.Services;

namespace PlatinumAFS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DocumentController : ControllerBase
{
    private readonly DocumentService _service;

    public DocumentController(DocumentService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DocumentEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DocumentEntry>>> GetDocumentRegister(
        [FromQuery] string? finYear = null,
        [FromQuery] int? processingMonth = null,
        [FromQuery] string? documentType = null,
        [FromQuery] string? supplierNo = null,
        [FromQuery] string? supplierName = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] string? documentNumber = null,
        [FromQuery] string? referenceNumber = null,
        [FromQuery] string? vendorInvoiceNumber = null,
        [FromQuery] string? orderNumber = null,
        [FromQuery] string? department = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        try
        {
            var (documents, totalCount) = await _service.GetDocumentRegisterAsync(
                finYear: finYear,
                processingMonth: processingMonth,
                documentType: documentType,
                supplierNo: supplierNo,
                supplierName: supplierName,
                minAmount: minAmount,
                maxAmount: maxAmount,
                dateFrom: dateFrom,
                dateTo: dateTo,
                documentNumber: documentNumber,
                referenceNumber: referenceNumber,
                vendorInvoiceNumber: vendorInvoiceNumber,
                orderNumber: orderNumber,
                department: department,
                searchText: search,
                page: page,
                pageSize: pageSize);

            SetPaginationHeaders(totalCount, page, pageSize);
            return Ok(documents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("detail")]
    [ProducesResponseType(typeof(IEnumerable<DocumentLineItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<DocumentLineItem>>> GetDocumentDetailByQuery(
        [FromQuery] string documentNumber,
        [FromQuery] string? finYear = null)
    {
        try
        {
            var lineItems = await _service.GetDocumentDetailAsync(documentNumber, finYear);
            if (lineItems.Count == 0)
                return NotFound(new { message = $"No entries found for document number '{documentNumber}'" });

            return Ok(new
            {
                documentNumber,
                finYear = lineItems.FirstOrDefault()?.FinYear,
                lineItemCount = lineItems.Count,
                totalDebit = lineItems.Sum(li => li.Debit ?? 0),
                totalCredit = lineItems.Sum(li => li.Credit ?? 0),
                netAmount = lineItems.Sum(li => (li.Debit ?? 0) - (li.Credit ?? 0)),
                lineItems
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("{**documentNumber}")]
    [ProducesResponseType(typeof(IEnumerable<DocumentLineItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<DocumentLineItem>>> GetDocumentDetail(
        string documentNumber,
        [FromQuery] string? finYear = null)
    {
        try
        {
            var isRelated = false;
            if (documentNumber.EndsWith("/related"))
            {
                isRelated = true;
                documentNumber = documentNumber[..^"/related".Length];
            }

            if (isRelated)
            {
                var related = await _service.GetRelatedDocumentsAsync(documentNumber, finYear);
                var grouped = related
                    .GroupBy(r => r.DocumentNumber)
                    .Select(g => new
                    {
                        documentNumber = g.Key,
                        lineItemCount = g.Count(),
                        totalDebit = g.Sum(li => li.Debit ?? 0),
                        totalCredit = g.Sum(li => li.Credit ?? 0),
                        transactionType = g.First().TransactionType,
                        postingDate = g.Min(li => li.PostingDate),
                        lineItems = g.ToList()
                    });

                return Ok(new
                {
                    sourceDocument = documentNumber,
                    relatedDocumentCount = grouped.Count(),
                    relatedDocuments = grouped
                });
            }

            var lineItems = await _service.GetDocumentDetailAsync(documentNumber, finYear);
            if (lineItems.Count == 0)
                return NotFound(new { message = $"No entries found for document number '{documentNumber}'" });

            return Ok(new
            {
                documentNumber,
                finYear = lineItems.FirstOrDefault()?.FinYear,
                lineItemCount = lineItems.Count,
                totalDebit = lineItems.Sum(li => li.Debit ?? 0),
                totalCredit = lineItems.Sum(li => li.Credit ?? 0),
                netAmount = lineItems.Sum(li => (li.Debit ?? 0) - (li.Credit ?? 0)),
                lineItems
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("overview")]
    [ProducesResponseType(typeof(DocumentOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DocumentOverviewDto>> GetOverview(
        [FromQuery] string? finYear = null)
    {
        try
        {
            var overview = await _service.GetDocumentOverviewAsync(finYear);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("types")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetDocumentTypes(
        [FromQuery] string? finYear = null)
    {
        try
        {
            var types = await _service.GetDocumentTypesAsync(finYear);
            return Ok(types);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("audit-sample")]
    [ProducesResponseType(typeof(AuditSampleResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuditSampleResult>> GetAuditSample(
        [FromQuery] string? finYear = null,
        [FromQuery] string? documentType = null,
        [FromQuery] string? supplierNo = null,
        [FromQuery] decimal? minAmount = null,
        [FromQuery] decimal? maxAmount = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] int? processingMonth = null,
        [FromQuery] string samplingMethod = "monetary-unit",
        [FromQuery] int sampleSize = 25,
        [FromQuery] int? seed = null)
    {
        try
        {
            if (sampleSize < 1 || sampleSize > 500)
                return BadRequest(new { message = "Sample size must be between 1 and 500" });

            var validMethods = new[] { "monetary-unit", "mus", "top-n", "largest", "random", "stratified" };
            if (!validMethods.Contains(samplingMethod.ToLower()))
                return BadRequest(new { message = $"Invalid sampling method. Valid options: {string.Join(", ", validMethods)}" });

            var result = await _service.GetAuditSampleAsync(
                finYear: finYear,
                documentType: documentType,
                supplierNo: supplierNo,
                minAmount: minAmount,
                maxAmount: maxAmount,
                dateFrom: dateFrom,
                dateTo: dateTo,
                processingMonth: processingMonth,
                samplingMethod: samplingMethod,
                sampleSize: sampleSize,
                seed: seed);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("schema-discovery")]
    [ProducesResponseType(typeof(IEnumerable<DocumentSchemaSummary>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DocumentSchemaSummary>>> DiscoverDocumentTables()
    {
        try
        {
            var tables = await _service.DiscoverDocumentTablesAsync();
            return Ok(new
            {
                message = "Document-related tables discovered in EMS database.",
                tableCount = tables.Count,
                tables
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("health")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> HealthCheck()
    {
        try
        {
            var types = await _service.GetDocumentTypesAsync();
            return Ok(new
            {
                status = "healthy",
                database = "connected",
                documentTypesAvailable = types.Count,
                timestamp = DateTime.UtcNow,
                api = "PlatinumAFS.Api (Document)",
                dataSource = "Direct table access (Led_GeneralLedger aggregated by DocumentNumber)",
                endpoints = new[]
                {
                    "GET /api/Document - Document register with filters",
                    "GET /api/Document/{docNum} - Document detail with line items",
                    "GET /api/Document/{docNum}/related - Related documents",
                    "GET /api/Document/detail?documentNumber=... - Detail via query param",
                    "GET /api/Document/overview - Overview with breakdowns",
                    "GET /api/Document/types - Available document types",
                    "GET /api/Document/audit-sample - Audit sampling",
                    "GET /api/Document/schema-discovery - Discover document tables"
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                status = "unhealthy",
                database = "disconnected",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    private void SetPaginationHeaders(int totalCount, int page, int pageSize)
    {
        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());
    }
}
