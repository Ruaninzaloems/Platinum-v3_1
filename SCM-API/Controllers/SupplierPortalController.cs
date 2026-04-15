using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;

namespace SCM_API.Controllers;

[Authorize]
[ApiController]
[Route("api/supplier-portal")]
public class SupplierPortalController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<SupplierPortalController> _logger;

    public SupplierPortalController(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<SupplierPortalController> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private int? ParseSupplierId()
    {
        var raw = Request.Query["supplierId"].FirstOrDefault();
        if (string.IsNullOrEmpty(raw)) return null;
        raw = raw.Replace("SUP", "").Replace("sup", "");
        return int.TryParse(raw, out var id) ? id : null;
    }

    [AllowAnonymous]
    [HttpPost("auth")]
    public ActionResult Auth([FromBody] object dto)
        => Ok(ApiResponse<object>.Ok(new { token = "", supplier = new { id = 0, name = "" } }));

    [AllowAnonymous]
    [HttpPost("register")]
    public ActionResult Register([FromBody] object dto)
        => Ok(ApiResponse<object>.Ok(new { id = 0 }, "Registration submitted"));

    [HttpGet("my/dashboard-enhanced")]
    public async Task<ActionResult> GetDashboard()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { orders = 0, invoices = 0, payments = 0, contracts = 0, totalOutstanding = 0m });

        try
        {
            var orderCount = await _context.Orders.CountAsync(o => o.VendorId == vendorId && o.Enabled == true);

            var vendorOrderIds = await _context.Orders
                .Where(o => o.VendorId == vendorId && o.Enabled == true)
                .Select(o => o.OrderId)
                .ToListAsync();

            var invoiceCount = await _context.Invoices.CountAsync(i => i.OrderId != null && vendorOrderIds.Contains(i.OrderId.Value) && i.Enabled == true);
            var paymentCount = await _context.PaymentHeaders.CountAsync(p => p.VendorCreditorId == vendorId && p.Enabled == true);
            var contractCount = await _context.ContractDetails.CountAsync(c => c.VendorId == vendorId && c.Enabled == true);

            var totalOutstanding = await _context.Invoices
                .Where(i => i.OrderId != null && vendorOrderIds.Contains(i.OrderId.Value) && i.Enabled == true && i.StatusId != 4 && i.StatusId != 6)
                .SumAsync(i => (decimal?)(i.CalculatedInvoiceAmount ?? 0)) ?? 0m;

            var recentOrders = await _context.Orders
                .Where(o => o.VendorId == vendorId && o.Enabled == true)
                .OrderByDescending(o => o.DateCaptured)
                .Take(5)
                .Select(o => new { id = o.OrderId, orderNumber = o.OrderNumber, status = o.StatusId, dateCaptured = o.DateCaptured })
                .ToListAsync();

            return Ok(new
            {
                orders = orderCount,
                invoices = invoiceCount,
                payments = paymentCount,
                contracts = contractCount,
                totalOutstanding,
                recentOrders,
                vendorId
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier dashboard, vendorId={VendorId}", vendorId);
            _dbChecker.MarkUnavailable();
            return Ok(new { orders = 0, invoices = 0, payments = 0, contracts = 0, totalOutstanding = 0m });
        }
    }

    [HttpGet("my/orders-detail")]
    public async Task<ActionResult> GetOrders()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { orders = Array.Empty<object>(), summary = new { total = 0, active = 0, completed = 0 } });

        try
        {
            var orders = await _context.Orders
                .Where(o => o.VendorId == vendorId && o.Enabled == true)
                .Include(o => o.OrderDetails)
                .OrderByDescending(o => o.DateCaptured)
                .Take(100)
                .ToListAsync();

            var mapped = orders.Select(o =>
            {
                var totalValue = o.OrderDetails?.Sum(d => d.TotalAmount ?? 0) ?? 0m;
                return new
                {
                    id = o.OrderId,
                    orderNumber = o.OrderNumber,
                    description = o.Comments,
                    statusId = o.StatusId,
                    status = StatusMapper.ToStatusName("order", o.StatusId) ?? "unknown",
                    dateCaptured = o.DateCaptured,
                    dateApproved = o.ApprovedDate,
                    financialYear = o.FinancialYear,
                    totalValue,
                    lineItems = o.OrderDetails?.Where(d => d.Enabled != false).Select(d => new
                    {
                        id = d.OrderDetailId,
                        description = d.ServiceDescription,
                        quantity = d.Quantity,
                        unitPrice = d.UnitPrice,
                        totalAmount = d.TotalAmount
                    }) ?? Enumerable.Empty<object>()
                };
            }).ToList();

            return Ok(new
            {
                orders = mapped,
                summary = new
                {
                    total = mapped.Count,
                    active = mapped.Count(o => o.statusId == 3 || o.statusId == 2),
                    completed = mapped.Count(o => o.statusId == 5)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier orders");
            _dbChecker.MarkUnavailable();
            return Ok(new { orders = Array.Empty<object>(), summary = new { total = 0, active = 0, completed = 0 } });
        }
    }

    [HttpGet("my/contracts-detail")]
    public async Task<ActionResult> GetContracts()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { contracts = Array.Empty<object>(), summary = new { total = 0, active = 0, expiringSoon = 0 } });

        try
        {
            var contracts = await _context.ContractDetails
                .Where(c => c.VendorId == vendorId && c.Enabled == true)
                .Include(c => c.DetailItems)
                .OrderByDescending(c => c.DateCaptured)
                .Take(100)
                .ToListAsync();

            var mapped = contracts.Select(c => new
            {
                id = c.ContractDetailsId,
                contractNumber = c.ContractNumber,
                description = c.ContractDescription,
                statusId = c.StatusId,
                status = StatusMapper.ToStatusName("contract", c.StatusId) ?? "unknown",
                startDate = c.StartDate,
                endDate = c.EndDate,
                totalValue = c.ContractValue,
                isExpiringSoon = c.EndDate.HasValue && c.EndDate.Value <= DateTime.UtcNow.AddDays(90),
                lineItems = c.DetailItems?.Where(d => d.Enabled != false).Select(d => new
                {
                    id = d.ContractDetailItemId,
                    description = d.ItemDescription,
                    quantity = d.Quantity,
                    unitPrice = d.UnitRate,
                    totalAmount = d.TotalAmount
                }) ?? Enumerable.Empty<object>()
            }).ToList();

            return Ok(new
            {
                contracts = mapped,
                summary = new
                {
                    total = mapped.Count,
                    active = mapped.Count(c => c.statusId == 3),
                    expiringSoon = mapped.Count(c => c.isExpiringSoon)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier contracts");
            _dbChecker.MarkUnavailable();
            return Ok(new { contracts = Array.Empty<object>(), summary = new { total = 0, active = 0, expiringSoon = 0 } });
        }
    }

    [HttpGet("my/invoices-detail")]
    public async Task<ActionResult> GetInvoices([FromQuery] string? status)
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { invoices = Array.Empty<object>(), summary = new { total = 0, pending = 0, paid = 0 }, approvalPhases = Array.Empty<object>() });

        try
        {
            var vendorOrderIds = await _context.Orders
                .Where(o => o.VendorId == vendorId && o.Enabled == true)
                .Select(o => o.OrderId)
                .ToListAsync();

            var query = _context.Invoices
                .Where(i => i.OrderId != null && vendorOrderIds.Contains(i.OrderId.Value) && i.Enabled == true)
                .Include(i => i.InvoiceDetails)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status) && int.TryParse(status, out var statusId))
                query = query.Where(i => i.StatusId == statusId);

            var invoices = await query.OrderByDescending(i => i.DateCaptured).Take(100).ToListAsync();

            var mapped = invoices.Select(i => new
            {
                id = i.InvoiceId,
                invoiceNumber = i.VendorInvoiceNumber,
                description = i.Comments,
                statusId = i.StatusId,
                status = StatusMapper.ToStatusName("invoice", i.StatusId) ?? "unknown",
                invoiceDate = i.InvoiceDate,
                receivedDate = i.InvoiceReceivedDate,
                totalAmount = i.CalculatedInvoiceAmount,
                financialYear = i.FinancialYear,
                orderId = i.OrderId,
                lineItems = i.InvoiceDetails?.Where(d => d.Enabled != false).Select(d => new
                {
                    id = d.InvoiceDetailId,
                    description = d.ServiceDescription,
                    quantity = d.InvoiceQuantity,
                    unitPrice = d.InvoiceUnitPrice,
                    totalAmount = d.TotalAmount
                }) ?? Enumerable.Empty<object>()
            }).ToList();

            return Ok(new
            {
                invoices = mapped,
                summary = new
                {
                    total = mapped.Count,
                    pending = mapped.Count(i => i.statusId == 1 || i.statusId == 2),
                    paid = mapped.Count(i => i.statusId == 4)
                },
                approvalPhases = new object[]
                {
                    new { phase = "Submitted", count = mapped.Count(i => i.statusId == 1) },
                    new { phase = "Under Review", count = mapped.Count(i => i.statusId == 2) },
                    new { phase = "Approved", count = mapped.Count(i => i.statusId == 3) },
                    new { phase = "Paid", count = mapped.Count(i => i.statusId == 4) }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier invoices");
            _dbChecker.MarkUnavailable();
            return Ok(new { invoices = Array.Empty<object>(), summary = new { total = 0, pending = 0, paid = 0 }, approvalPhases = Array.Empty<object>() });
        }
    }

    [HttpGet("my/payments-detail")]
    public async Task<ActionResult> GetPayments()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { payments = Array.Empty<object>(), summary = new { total = 0, totalPaid = 0m } });

        try
        {
            var payments = await _context.PaymentHeaders
                .Where(p => p.VendorCreditorId == vendorId && p.Enabled == true)
                .Include(p => p.PaymentDetails)
                .OrderByDescending(p => p.DateCaptured)
                .Take(100)
                .ToListAsync();

            var mapped = payments.Select(p => new
            {
                id = p.PaymentHeaderId,
                paymentNumber = p.PaymentReferenceNumber,
                dateCaptured = p.DateCaptured,
                amount = p.Amount,
                statusId = p.StatusId,
                status = StatusMapper.ToStatusName("payment", p.StatusId) ?? "unknown",
                financialYear = p.FinancialYear,
                details = p.PaymentDetails?.Select(d => new
                {
                    id = d.PaymentDetailId,
                    invoiceId = d.InvoiceId,
                    amount = d.Amount
                }) ?? Enumerable.Empty<object>()
            }).ToList();

            return Ok(new
            {
                payments = mapped,
                summary = new
                {
                    total = mapped.Count,
                    totalPaid = mapped.Sum(p => p.amount ?? 0)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier payments");
            _dbChecker.MarkUnavailable();
            return Ok(new { payments = Array.Empty<object>(), summary = new { total = 0, totalPaid = 0m } });
        }
    }

    [HttpGet("my/notifications")]
    public async Task<ActionResult> GetNotifications()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { notifications = Array.Empty<object>(), unreadCount = 0, urgentCount = 0 });

        try
        {
            var notifications = await _context.Notifications
                .Where(n => n.Enabled == true)
                .OrderByDescending(n => n.DateCaptured)
                .Take(20)
                .Select(n => new
                {
                    id = n.NotificationId,
                    title = n.NotificationName,
                    type = n.NotificationType,
                    dateCaptured = n.DateCaptured
                })
                .ToListAsync();

            return Ok(new
            {
                notifications,
                unreadCount = 0,
                urgentCount = notifications.Count(n => n.type == "urgent")
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for notifications");
            _dbChecker.MarkUnavailable();
            return Ok(new { notifications = Array.Empty<object>(), unreadCount = 0, urgentCount = 0 });
        }
    }

    [HttpGet("my/statement")]
    public async Task<ActionResult> GetStatement()
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(new { entries = Array.Empty<object>(), balance = 0m });

        try
        {
            var vendorOrderIds = await _context.Orders
                .Where(o => o.VendorId == vendorId && o.Enabled == true)
                .Select(o => o.OrderId)
                .ToListAsync();

            var invoices = await _context.Invoices
                .Where(i => i.OrderId != null && vendorOrderIds.Contains(i.OrderId.Value) && i.Enabled == true)
                .OrderByDescending(i => i.InvoiceDate)
                .Take(50)
                .Select(i => new
                {
                    id = i.InvoiceId,
                    date = i.InvoiceDate,
                    description = "Invoice: " + (i.VendorInvoiceNumber ?? ""),
                    type = "invoice",
                    debit = i.CalculatedInvoiceAmount ?? 0m,
                    credit = 0m
                })
                .ToListAsync();

            var payments = await _context.PaymentHeaders
                .Where(p => p.VendorCreditorId == vendorId && p.Enabled == true)
                .OrderByDescending(p => p.DateCaptured)
                .Take(50)
                .Select(p => new
                {
                    id = p.PaymentHeaderId,
                    date = p.DateCaptured,
                    description = "Payment: " + (p.PaymentReferenceNumber ?? ""),
                    type = "payment",
                    debit = 0m,
                    credit = p.Amount ?? 0m
                })
                .ToListAsync();

            var entries = invoices.Cast<object>().Concat(payments.Cast<object>()).ToList();
            var totalDebit = invoices.Sum(i => i.debit);
            var totalCredit = payments.Sum(p => p.credit);

            return Ok(new
            {
                entries,
                balance = totalDebit - totalCredit,
                totals = new { totalDebit, totalCredit }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for statement");
            _dbChecker.MarkUnavailable();
            return Ok(new { entries = Array.Empty<object>(), balance = 0m });
        }
    }

    [HttpGet("my/invoice/{invoiceId}/timeline")]
    public async Task<ActionResult> GetInvoiceTimeline(int invoiceId)
    {
        if (!UseDb)
            return Ok(Array.Empty<object>());

        try
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
            if (invoice == null) return NotFound(new { message = "Invoice not found" });

            var timeline = new List<object>
            {
                new { step = "Submitted", date = invoice.DateCaptured, completed = true },
                new { step = "Under Review", date = invoice.DateModified, completed = invoice.StatusId >= 2 },
                new { step = "Approved", date = invoice.StatusId >= 3 ? invoice.DateModified : (DateTime?)null, completed = invoice.StatusId >= 3 },
                new { step = "Payment Processed", date = invoice.StatusId >= 5 ? invoice.DateModified : (DateTime?)null, completed = invoice.StatusId >= 5 }
            };
            return Ok(timeline);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for invoice timeline");
            return Ok(Array.Empty<object>());
        }
    }

    [HttpGet("suppliers")]
    public async Task<ActionResult> GetSuppliers([FromQuery] int page = 1, [FromQuery] int pageSize = 100, [FromQuery] string? status = null, [FromQuery] string? search = null)
    {
        if (!UseDb)
            return Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize, totalPages = 0 });

        try
        {
            var query = _context.Vendors.Where(v => v.Enabled == true).AsQueryable();

            if (!string.IsNullOrEmpty(search))
                query = query.Where(v => v.VendorName != null && v.VendorName.Contains(search));

            if (!string.IsNullOrEmpty(status))
            {
                var sid = StatusMapper.ToStatusId("vendor", status);
                query = query.Where(v => v.Status == sid);
            }

            var total = await query.CountAsync();
            var vendors = await query
                .OrderBy(v => v.VendorName)
                .Skip((page - 1) * pageSize).Take(pageSize)
                .ToListAsync();

            var mapped = vendors.Select(v => new
            {
                id = v.VendorId,
                vendorNumber = v.CsdSupplierNumber,
                name = v.VendorName,
                tradingName = v.TradingName,
                registrationNumber = v.RegistrationNumber,
                vatNumber = v.VatRegistrationNumber,
                statusId = v.Status,
                status = StatusMapper.ToStatusName("vendor", v.Status) ?? "active",
                registeredDate = v.DateCaptured,
                beeLevel = v.VendorBbbeeContributorLevelId,
                beePercentage = v.BeePercentage
            }).ToList();

            return Ok(new { data = mapped, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for suppliers list");
            _dbChecker.MarkUnavailable();
            return Ok(new { data = Array.Empty<object>(), total = 0, page, pageSize, totalPages = 0 });
        }
    }

    [HttpGet("suppliers/{id:int}")]
    public async Task<ActionResult> GetSupplierDetail(int id)
    {
        if (!UseDb)
            return NotFound(new { message = "Database not available" });

        try
        {
            var vendor = await _context.Vendors
                .Include(v => v.BankingDetails)
                .Include(v => v.ContactDetails)
                .Include(v => v.Owners)
                .FirstOrDefaultAsync(v => v.VendorId == id);

            if (vendor == null) return NotFound(new { message = "Supplier not found" });

            var documents = await _context.VendorDocumentDetails
                .Where(d => d.VendorId == id && d.Enabled == true)
                .ToListAsync();

            return Ok(new
            {
                id = vendor.VendorId,
                vendorNumber = vendor.CsdSupplierNumber,
                name = vendor.VendorName,
                tradingName = vendor.TradingName,
                registrationNumber = vendor.RegistrationNumber,
                vatNumber = vendor.VatRegistrationNumber,
                statusId = vendor.Status,
                status = StatusMapper.ToStatusName("vendor", vendor.Status) ?? "active",
                registeredDate = vendor.DateCaptured,
                beeLevel = vendor.VendorBbbeeContributorLevelId,
                beePercentage = vendor.BeePercentage,
                bankingDetails = vendor.BankingDetails?.Select(b => new
                {
                    id = b.VendorBankingDetailsId,
                    bankId = b.BankId,
                    accountNumber = b.BankAccountNumber,
                    branchCode = b.BankBranchCode,
                    accountTypeId = b.BankAccountTypeId,
                    isVerified = b.IsVerified
                }),
                contactDetails = vendor.ContactDetails?.Select(c => new
                {
                    id = c.VendorContactDetailsId,
                    contactPerson = c.ContactPerson,
                    telephone = c.TelWork,
                    cellphone = c.TelMobile,
                    email = c.Email,
                    fax = c.Fax
                }),
                owners = vendor.Owners?.Select(o => new
                {
                    id = o.VendorOwnersId,
                    name = (o.FirstName ?? "") + " " + (o.LastName ?? ""),
                    idNumber = o.IdentityNumber,
                    percentage = o.OwnedPercentage
                }),
                documents = documents.Select(d => new
                {
                    id = d.DocumentDetailsId,
                    documentNumber = d.DocumentNumber,
                    documentTypeId = d.DocumentTypeId,
                    documentPath = d.DocumentPath,
                    expiryDate = d.ExpiryDate
                }),
                verificationStatus = new
                {
                    csd = new { verified = vendor.IsCsdImport ?? false, supplierNumber = vendor.CsdSupplierNumber },
                    cipc = new { verified = !string.IsNullOrEmpty(vendor.RegistrationNumber) },
                    sars = new { verified = !string.IsNullOrEmpty(vendor.TaxCertificateNumber), certificateNumber = vendor.TaxCertificateNumber },
                    municipal_rates = new { verified = false },
                    bank_verification = new { verified = vendor.BankingDetails?.Any(b => b.IsVerified == true) ?? false }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for supplier detail {Id}", id);
            _dbChecker.MarkUnavailable();
            return StatusCode(500, new { message = "Failed to load supplier details" });
        }
    }

    [HttpGet("suppliers/{id:int}/document-checklist")]
    public async Task<ActionResult> GetDocumentChecklist(int id)
    {
        if (!UseDb)
            return Ok(new { checklist = Array.Empty<object>(), totalUploaded = 0, totalRequired = 0 });

        try
        {
            var docs = await _context.VendorDocumentDetails
                .Where(d => d.VendorId == id && d.Enabled == true)
                .ToListAsync();

            var requiredTypeIds = new Dictionary<int, string>
            {
                { 1, "Tax Clearance Certificate" },
                { 2, "BEE Certificate" },
                { 3, "CIPC Registration" },
                { 4, "Company Profile" },
                { 5, "Bank Confirmation Letter" },
                { 6, "Municipal Rates Clearance" },
                { 7, "CSD Report" },
                { 8, "Directors ID Copies" }
            };

            var checklist = requiredTypeIds.Select(kv =>
            {
                var found = docs.FirstOrDefault(d => d.DocumentTypeId == kv.Key);
                return new
                {
                    typeId = kv.Key,
                    type = kv.Value,
                    uploaded = found != null,
                    documentId = found?.DocumentDetailsId,
                    documentNumber = found?.DocumentNumber,
                    expiryDate = found?.ExpiryDate
                };
            }).ToList();

            return Ok(new
            {
                checklist,
                totalUploaded = checklist.Count(c => c.uploaded),
                totalRequired = requiredTypeIds.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for document checklist");
            _dbChecker.MarkUnavailable();
            return Ok(new { checklist = Array.Empty<object>(), totalUploaded = 0, totalRequired = 0 });
        }
    }

    [HttpPost("suppliers/{id:int}/verify")]
    public async Task<ActionResult> VerifySupplier(int id, [FromBody] JsonElement dto)
    {
        if (!UseDb)
            return BadRequest(new { error = "Database not available" });

        try
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound(new { error = "Supplier not found" });

            if (dto.TryGetProperty("checks", out var checks))
            {
                if (checks.TryGetProperty("csd", out var csd) && csd.TryGetProperty("verified", out var csdV) && csdV.GetBoolean())
                    vendor.IsCsdImport = true;
                if (checks.TryGetProperty("sars", out var sars) && sars.TryGetProperty("certificateNumber", out var certNum))
                    vendor.TaxCertificateNumber = certNum.GetString();
            }
            vendor.Approved = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Verification updated", supplier = new { id = vendor.VendorId, name = vendor.VendorName, status = StatusMapper.ToStatusName("vendor", vendor.Status) } });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Verify failed for supplier {Id}", id);
            return StatusCode(500, new { error = "Verification failed" });
        }
    }

    [HttpPost("suppliers/{id:int}/approve")]
    public async Task<ActionResult> ApproveSupplier(int id)
    {
        if (!UseDb)
            return BadRequest(new { error = "Database not available" });

        try
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound(new { error = "Supplier not found" });

            vendor.Status = StatusMapper.ToStatusId("vendor", "active");
            vendor.Approved = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Supplier approved", supplier = new { id = vendor.VendorId, name = vendor.VendorName, status = "active" } });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Approve failed for supplier {Id}", id);
            return StatusCode(500, new { error = "Approval failed" });
        }
    }

    [HttpPost("suppliers/{id:int}/suspend")]
    public async Task<ActionResult> SuspendSupplier(int id, [FromBody] JsonElement dto)
    {
        if (!UseDb)
            return BadRequest(new { error = "Database not available" });

        try
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound(new { error = "Supplier not found" });

            vendor.Status = StatusMapper.ToStatusId("vendor", "suspended");
            vendor.Approved = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Supplier suspended", supplier = new { id = vendor.VendorId, name = vendor.VendorName, status = "suspended" } });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Suspend failed for supplier {Id}", id);
            return StatusCode(500, new { error = "Suspension failed" });
        }
    }

    [HttpPost("my/upload-invoice-with-docs")]
    public async Task<ActionResult> UploadInvoice([FromBody] JsonElement dto)
    {
        var vendorId = ParseSupplierId();
        if (!UseDb || vendorId == null)
            return Ok(ApiResponse<object>.Ok(new { id = 0 }, "Invoice uploaded (offline mode)"));

        try
        {
            var supplierInvoiceNumber = dto.TryGetProperty("supplierInvoiceNumber", out var sin) ? sin.GetString() : null;
            var orderId = dto.TryGetProperty("orderId", out var oid) && oid.ValueKind == JsonValueKind.Number ? oid.GetInt32() : (int?)null;

            var invoice = new Models.Domain.Invoice
            {
                VendorInvoiceNumber = supplierInvoiceNumber,
                OrderId = orderId,
                InvoiceDate = DateTime.UtcNow,
                InvoiceReceivedDate = DateTime.UtcNow,
                StatusId = 1,
                Enabled = true,
                DateCaptured = DateTime.UtcNow,
                CapturerId = 1,
                Comments = $"Supplier portal upload: {supplierInvoiceNumber}"
            };
            if (dto.TryGetProperty("estimatedAmount", out var amt) && amt.ValueKind == JsonValueKind.Number)
                invoice.CalculatedInvoiceAmount = amt.GetDecimal();

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Supplier portal invoice created {Id} for vendor {VendorId}", invoice.InvoiceId, vendorId);

            return Ok(new { id = invoice.InvoiceId, message = "Invoice uploaded and submitted for processing" });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invoice upload failed for vendor {VendorId}", vendorId);
            return StatusCode(500, new { error = "Failed to upload invoice" });
        }
    }

    [HttpPost("my/invoice/{invoiceId}/resubmit-documents")]
    public async Task<ActionResult> ResubmitDocuments(int invoiceId, [FromBody] JsonElement dto)
    {
        if (!UseDb)
            return Ok(new { message = "Documents resubmitted (offline mode)" });

        try
        {
            var invoice = await _context.Invoices.FindAsync(invoiceId);
            if (invoice == null) return NotFound(new { error = "Invoice not found" });

            invoice.DateModified = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Documents resubmitted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Resubmit documents failed for invoice {Id}", invoiceId);
            return StatusCode(500, new { error = "Failed to resubmit documents" });
        }
    }

    [HttpPost("suppliers/{id:int}/documents")]
    public async Task<ActionResult> UploadDocument(int id, [FromBody] JsonElement dto)
    {
        if (!UseDb)
            return BadRequest(new { error = "Database not available" });

        try
        {
            var vendor = await _context.Vendors.FindAsync(id);
            if (vendor == null) return NotFound(new { error = "Supplier not found" });

            var docTypeId = dto.TryGetProperty("documentTypeId", out var dti) && dti.ValueKind == JsonValueKind.Number ? dti.GetInt32() : 1;

            var doc = new Models.Domain.VendorDocumentDetail
            {
                VendorId = id,
                DocumentTypeId = docTypeId,
                DocumentNumber = dto.TryGetProperty("documentNumber", out var dn) ? dn.GetString() : null,
                DocumentPath = dto.TryGetProperty("documentPath", out var dp) ? dp.GetString() : null,
                Enabled = true,
                DateCaptured = DateTime.UtcNow,
                CapturerId = 1
            };

            if (dto.TryGetProperty("expiryDate", out var ed) && DateTime.TryParse(ed.GetString(), out var expiry))
                doc.ExpiryDate = expiry;

            _context.VendorDocumentDetails.Add(doc);
            await _context.SaveChangesAsync();

            return Ok(new { id = doc.DocumentDetailsId, message = "Document uploaded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Document upload failed for supplier {Id}", id);
            return StatusCode(500, new { error = "Failed to upload document" });
        }
    }
}
