using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SCM_API.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repository;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<PaymentService> _logger;
    private readonly IInvoiceService _invoiceService;
    private readonly ApplicationDbContext _context;

    private static readonly ConcurrentDictionary<string, Dictionary<string, object?>> _batches = new();
    private static readonly ConcurrentDictionary<string, List<Dictionary<string, object?>>> _batchDocuments = new();
    private static readonly ConcurrentDictionary<string, Dictionary<string, object?>> _remittances = new();
    private static readonly ConcurrentDictionary<string, Dictionary<string, object?>> _reconMatches = new();
    private static int _nextBatchId = 2;
    private static int _nextBatchSeq = 100;
    private static int _nextRemittanceId = 2;
    private static int _nextDocId = 1;

    private static readonly Dictionary<string, object?> _bankConfig = new()
    {
        ["defaultBank"] = "standard_bank",
        ["branchCode"] = "051001",
        ["accountNumber"] = "0412345678",
        ["accountName"] = "George Municipality SCM",
        ["generatedFiles"] = new List<Dictionary<string, object?>>()
    };

    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public PaymentService(IPaymentRepository repository, DbAvailabilityChecker dbChecker, ILogger<PaymentService> logger, IInvoiceService invoiceService, ApplicationDbContext context)
    {
        _repository = repository;
        _dbChecker = dbChecker;
        _logger = logger;
        _invoiceService = invoiceService;
        _context = context;
        EnsureSeeded();
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private static bool ShouldSeedMockData =>
        string.Equals(Environment.GetEnvironmentVariable("USE_MOCK_DATA"), "true", StringComparison.OrdinalIgnoreCase);

    private void EnsureSeeded()
    {
        if (_seeded) return;
        lock (_seedLock)
        {
            if (_seeded) return;
            if (ShouldSeedMockData || !UseDb)
                SeedData();
            _seeded = true;
        }
    }

    private void SeedData()
    {
        var seedItems = new List<Dictionary<string, object?>>
        {
            new()
            {
                ["invoiceId"] = 801,
                ["invoiceNumber"] = "INV-2026-801",
                ["supplierName"] = "Cape IT Solutions CC",
                ["supplierId"] = "SUP-001",
                ["amount"] = new { amount = 10120m, currency = "ZAR" },
                ["bankName"] = "Standard Bank",
                ["branchCode"] = "051001",
                ["accountNumber"] = "0412345678",
                ["remittanceSent"] = true
            }
        };

        _batches["1"] = new Dictionary<string, object?>
        {
            ["id"] = "1",
            ["referenceNumber"] = "PAY-2026-0001",
            ["batchDate"] = "2026-03-15",
            ["status"] = "processed",
            ["paymentMethod"] = "EFT",
            ["totalAmountValue"] = 10120m,
            ["totalAmount"] = new { amount = 10120m, currency = "ZAR" },
            ["itemCount"] = 1,
            ["items"] = seedItems,
            ["notes"] = "IT equipment payment — Cape IT Solutions",
            ["createdBy"] = "admin",
            ["createdByName"] = "System Administrator",
            ["createdDate"] = "2026-03-15T09:00:00Z",
            ["eftFileReference"] = "EFT-20260315-1",
            ["eftFileName"] = "EFT_PAY-2026-0001_20260315090000.txt",
            ["eftGeneratedDate"] = "2026-03-15T10:30:00Z",
            ["processedDate"] = "2026-03-15T14:00:00Z",
            ["approvedDate"] = "2026-03-15T10:00:00Z",
            ["approvalChain"] = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["level"] = 1,
                    ["userId"] = "admin",
                    ["userName"] = "System Administrator",
                    ["role"] = "CFO",
                    ["status"] = "Approved",
                    ["date"] = "2026-03-15T10:00:00Z",
                    ["comments"] = "Approved — Cape IT Solutions equipment"
                }
            },
            ["auditTrail"] = new List<Dictionary<string, object?>>
            {
                new() { ["action"] = "Batch Created", ["details"] = "Payment batch PAY-2026-0001 created with 1 invoice totalling R10,120.00", ["userId"] = "admin", ["timestamp"] = "2026-03-15T09:00:00Z" },
                new() { ["action"] = "Batch Submitted", ["details"] = "Payment batch submitted for approval", ["userId"] = "admin", ["timestamp"] = "2026-03-15T09:15:00Z" },
                new() { ["action"] = "Batch Approved", ["details"] = "Payment batch approved by CFO", ["userId"] = "admin", ["timestamp"] = "2026-03-15T10:00:00Z" },
                new() { ["action"] = "EFT File Generated", ["details"] = "EFT file EFT_PAY-2026-0001_20260315090000.txt generated", ["userId"] = "admin", ["timestamp"] = "2026-03-15T10:30:00Z" },
                new() { ["action"] = "Batch Processed", ["details"] = "Payment batch processed. 1 invoice marked as paid.", ["userId"] = "admin", ["timestamp"] = "2026-03-15T14:00:00Z" }
            }
        };

        Task.Run(async () =>
        {
            var inv = await _invoiceService.GetInvoiceDictAsync(801);
            if (inv != null)
            {
                inv["status"] = "paid";
                inv["paidDate"] = "2026-03-15T14:00:00Z";
            }
        }).GetAwaiter().GetResult();

        var bankFiles = _bankConfig["generatedFiles"] as List<Dictionary<string, object?>> ?? new();
        bankFiles.Add(new Dictionary<string, object?>
        {
            ["fileId"] = "BF-001",
            ["fileName"] = "EFT_PAY-2026-0001_20260315090000.txt",
            ["format"] = "NAEDO",
            ["formatName"] = "Standard Bank ACB",
            ["batchReference"] = "PAY-2026-0001",
            ["recordCount"] = 1,
            ["totalAmount"] = new { amount = 10120m, currency = "ZAR" },
            ["generatedDate"] = "2026-03-15T10:30:00Z"
        });
        _bankConfig["generatedFiles"] = bankFiles;

        _remittances["REM-0001"] = new Dictionary<string, object?>
        {
            ["id"] = "REM-0001",
            ["paymentBatchId"] = "1",
            ["batchReference"] = "PAY-2026-0001",
            ["supplierName"] = "Cape IT Solutions CC",
            ["supplierId"] = "SUP-001",
            ["amount"] = new { amount = 10120m, currency = "ZAR" },
            ["status"] = "sent",
            ["generatedDate"] = "2026-03-15T14:30:00Z",
            ["sentDate"] = "2026-03-15T14:35:00Z",
            ["invoices"] = new List<string> { "INV-2026-801" }
        };

        _reconMatches["1"] = new Dictionary<string, object?>
        {
            ["paymentId"] = "1",
            ["reconciliationStatus"] = "matched",
            ["bankStatementRef"] = "BSR-20260316-001",
            ["matchedDate"] = "2026-03-16T09:00:00Z",
            ["matchedAmount"] = 10120m
        };
    }

    public async Task<Dictionary<string, object?>?> GetBatchDictAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var intId))
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(intId);
                if (entity != null)
                {
                    var dict = MapPaymentEntityToDict(entity);
                    _batches[id] = dict;
                    return dict;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for batch {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return _batches.TryGetValue(id, out var cached) ? cached : null;
    }

    public async Task<ICollection<Dictionary<string, object?>>> GetAllBatchDictsAsync()
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(null, null, null, 1, 1000);
                var dbIds = new HashSet<string>();
                foreach (var entity in result.Items)
                {
                    var key = entity.PaymentHeaderId.ToString();
                    var dict = MapPaymentEntityToDict(entity);
                    _batches[key] = dict;
                    dbIds.Add(key);
                }
                foreach (var key in _batches.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _batches.TryRemove(key, out _);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for batches");
                _dbChecker.MarkUnavailable();
            }
        }
        return _batches.Values;
    }

    public async Task SaveBatchDictAsync(string id, Dictionary<string, object?> batch)
    {
        _batches[id] = batch;

        if (UseDb && int.TryParse(id, out var intId))
        {
            try
            {
                var entity = await _repository.GetByIdAsync(intId);
                if (entity != null)
                {
                    if (batch.TryGetValue("status", out var s))
                        entity.StatusId = StatusMapper.ToStatusId("payment", s?.ToString());
                    if (batch.TryGetValue("totalAmountValue", out var ta) && ta != null)
                        entity.Amount = Convert.ToDecimal(ta);
                    if (batch.TryGetValue("referenceNumber", out var rn) && rn != null)
                        entity.PaymentReferenceNumber = rn.ToString();
                    if (batch.TryGetValue("financialYear", out var fy) && fy != null)
                        entity.FinancialYear = fy.ToString();
                    if (batch.TryGetValue("supervisorApproved", out var sa) && sa is bool saBool)
                        entity.SupervisorApproved = saBool;
                    if (batch.TryGetValue("hodApproved", out var ha) && ha is bool haBool)
                        entity.HodApproved = haBool;
                    entity.IsVoid = batch.TryGetValue("status", out var vs) && vs?.ToString() == "voided";
                    _repository.Update(entity);
                    await _repository.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB save failed for batch {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task AddInvoiceDetailAsync(string batchId, int invoiceId, decimal amount)
    {
        if (UseDb && int.TryParse(batchId, out var intId))
        {
            try
            {
                var entity = await _repository.GetByIdAsync(intId);
                if (entity != null)
                {
                    var detail = new PaymentDetail
                    {
                        InvoiceId = invoiceId,
                        Amount = amount,
                        VatAmount = amount * 0.15m,
                        Enabled = true
                    };
                    entity.PaymentDetails.Add(detail);
                    entity.Amount = (entity.Amount ?? 0m) + amount;
                    _repository.Update(entity);
                    await _repository.SaveChangesAsync();
                    _logger.LogInformation("Added PaymentDetail for invoice {InvId} to batch {BatchId}", invoiceId, batchId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB add detail failed for batch {Id}", batchId);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task RemoveInvoiceDetailAsync(string batchId, int invoiceId)
    {
        if (UseDb && int.TryParse(batchId, out var intId))
        {
            try
            {
                var entity = await _repository.GetByIdAsync(intId);
                if (entity != null)
                {
                    var detail = entity.PaymentDetails.FirstOrDefault(d => d.InvoiceId == invoiceId && d.Enabled != false);
                    if (detail != null)
                    {
                        detail.Enabled = false;
                        entity.Amount = (entity.Amount ?? 0m) - (detail.Amount ?? 0m);
                        _repository.Update(entity);
                        await _repository.SaveChangesAsync();
                        _logger.LogInformation("Removed PaymentDetail for invoice {InvId} from batch {BatchId}", invoiceId, batchId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB remove detail failed for batch {Id}", batchId);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task<bool> DeleteBatchDictAsync(string id)
    {
        var removed = _batches.TryRemove(id, out _);
        if (UseDb && int.TryParse(id, out var intId))
        {
            try
            {
                var entity = await _repository.GetByIdAsync(intId);
                if (entity != null) { entity.Enabled = false; _repository.Update(entity); await _repository.SaveChangesAsync(); }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB delete failed for batch {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return removed;
    }

    public string AllocateNextBatchId()
        => Interlocked.Increment(ref _nextBatchId).ToString();

    public int AllocateNextBatchSeq()
        => Interlocked.Increment(ref _nextBatchSeq);

    public Task<Dictionary<string, object?>> GetBankConfigAsync()
        => Task.FromResult(_bankConfig);

    public Task<Dictionary<string, object?>?> GetRemittanceDictAsync(string id)
    {
        _remittances.TryGetValue(id, out var rem);
        return Task.FromResult(rem);
    }

    public Task<ICollection<Dictionary<string, object?>>> GetAllRemittanceDictsAsync()
        => Task.FromResult<ICollection<Dictionary<string, object?>>>(_remittances.Values);

    public Task SaveRemittanceDictAsync(string id, Dictionary<string, object?> rem)
    {
        _remittances[id] = rem;
        return Task.CompletedTask;
    }

    public Task<Dictionary<string, object?>?> GetReconMatchDictAsync(string id)
    {
        _reconMatches.TryGetValue(id, out var match);
        return Task.FromResult(match);
    }

    public Task SaveReconMatchDictAsync(string id, Dictionary<string, object?> match)
    {
        _reconMatches[id] = match;
        return Task.CompletedTask;
    }

    public Task<List<Dictionary<string, object?>>?> GetBatchDocumentsDictAsync(string batchId)
    {
        _batchDocuments.TryGetValue(batchId, out var docs);
        return Task.FromResult(docs);
    }

    public Task SaveBatchDocumentsDictAsync(string batchId, List<Dictionary<string, object?>> docs)
    {
        _batchDocuments[batchId] = docs;
        return Task.CompletedTask;
    }

    public int AllocateNextRemittanceId() => Interlocked.Increment(ref _nextRemittanceId);
    public int AllocateNextDocId() => Interlocked.Increment(ref _nextDocId);

    public async Task<object?> GetByIdAsync(int id)
    {
        return await GetBatchDictAsync(id.ToString());
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Select(MapPaymentEntityToDict).Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB query failed for payments"); _dbChecker.MarkUnavailable(); }
        }
        var all = await GetAllBatchDictsAsync();
        return new PagedResult<object> { Items = all.Cast<object>(), Page = page, PageSize = pageSize, TotalCount = all.Count };
    }

    public async Task<object> CreateAsync(object dto)
    {
        var data = ConvertToDict(dto);
        if (!data.ContainsKey("status"))
            data["status"] = "draft";
        if (!data.ContainsKey("createdDate"))
            data["createdDate"] = DateTime.UtcNow.ToString("o");

        if (UseDb)
        {
            try
            {
                var memId = AllocateNextBatchId();
                var refNum = data.GetValueOrDefault("referenceNumber")?.ToString() ?? $"PAY-{DateTime.UtcNow:yyyy}-{Interlocked.Increment(ref _nextBatchSeq):D4}";
                var entity = new PaymentHeader
                {
                    PaymentReferenceNumber = refNum,
                    StatusId = StatusMapper.ToStatusId("payment", data.GetValueOrDefault("status")?.ToString()),
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString()
                };
                object[]? invoices = null;
                if (data.TryGetValue("invoices", out var invObj) && invObj is object[] inv1)
                    invoices = inv1;
                else if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] inv2)
                    invoices = inv2;
                else if (data.TryGetValue("items", out var itObj) && itObj is object[] inv3)
                    invoices = inv3;
                if (invoices != null)
                {
                    foreach (var inv in invoices)
                    {
                        if (inv is Dictionary<string, object?> invDict)
                        {
                            var detail = new PaymentDetail
                            {
                                Enabled = true
                            };
                            if (invDict.TryGetValue("invoiceId", out var iid) && iid != null)
                                detail.InvoiceId = Convert.ToInt32(iid);
                            if (invDict.TryGetValue("amount", out var amt) && amt is Dictionary<string, object?> amtd && amtd.TryGetValue("amount", out var amtv))
                                detail.Amount = Convert.ToDecimal(amtv);
                            else if (invDict.TryGetValue("amount", out var amt2) && amt2 != null)
                                detail.Amount = Convert.ToDecimal(amt2);
                            detail.VatAmount = (detail.Amount ?? 0) * 0.15m;
                            entity.PaymentDetails.Add(detail);
                        }
                    }
                }
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.PaymentHeaderId.ToString();
                data["id"] = dbId;
                data["referenceNumber"] = refNum;
                _batches[dbId] = data;
                _logger.LogInformation("Created payment batch {Id} in DB with {DetailCount} detail rows", dbId, entity.PaymentDetails.Count);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for payment batch, continuing with in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextBatchId();
        data["id"] = id;
        if (!data.ContainsKey("referenceNumber"))
            data["referenceNumber"] = $"PAY-{DateTime.UtcNow:yyyy}-{Interlocked.Increment(ref _nextBatchSeq):D4}";
        _batches[id] = data;
        return data;
    }

    public async Task<bool> ApproveAsync(int id, object dto)
    {
        var batch = await GetBatchDictAsync(id.ToString());
        if (batch == null) return false;
        batch["status"] = "approved";
        await SaveBatchDictAsync(id.ToString(), batch);
        return true;
    }

    public async Task<object> GetPaymentBatchesAsync(string? financialYear, int page, int pageSize)
    {
        if (UseDb)
        {
            try { return await _repository.GetBatchesAsync(financialYear, page, pageSize); }
            catch (Exception ex) { _logger.LogWarning(ex, "DB query failed for payment batches"); _dbChecker.MarkUnavailable(); }
        }
        var all = await GetAllBatchDictsAsync();
        return new PagedResult<object> { Items = all.Cast<object>(), Page = page, PageSize = pageSize, TotalCount = all.Count };
    }

    public async Task<object> GetPaymentDetailsAsync(int paymentId)
    {
        var batch = await GetBatchDictAsync(paymentId.ToString());
        return batch ?? new object();
    }

    public async Task<bool> ProcessBatchAsync(int batchId)
    {
        var batchKey = batchId.ToString();
        var batch = await GetBatchDictAsync(batchKey);

        if (batch != null)
        {
            batch["status"] = "processed";
            batch["processedDate"] = DateTime.UtcNow.ToString("o");

            var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
            foreach (var item in items)
            {
                if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
                {
                    var invId = Convert.ToInt32(invIdObj);
                    var inv = await _invoiceService.GetInvoiceDictAsync(invId);
                    if (inv != null)
                    {
                        inv["status"] = "paid";
                        inv["paidDate"] = DateTime.UtcNow.ToString("o");
                        await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                    }
                }
                item["remittanceSent"] = false;
            }

            await SaveBatchDictAsync(batchKey, batch);
        }

        return true;
    }

    public async Task<bool> SubmitAsync(int id)
    {
        var batch = await GetBatchDictAsync(id.ToString());
        if (batch == null) return false;
        batch["status"] = "pending_approval";
        await SaveBatchDictAsync(id.ToString(), batch);
        return true;
    }

    private string? ResolveVendorName(int? vendorId)
    {
        if (!vendorId.HasValue) return null;
        try
        {
            return _context.Vendors
                .Where(v => v.VendorId == vendorId.Value)
                .Select(v => v.VendorName ?? v.TradingName)
                .FirstOrDefault();
        }
        catch { return null; }
    }

    private Dictionary<string, object?> MapPaymentEntityToDict(PaymentHeader entity)
    {
        var totalAmount = entity.Amount ?? 0m;
        var vatAmount = entity.VatAmount ?? 0m;

        var items = entity.PaymentDetails.Where(d => d.Enabled != false).Select(d => new Dictionary<string, object?>
        {
            ["invoiceId"] = d.InvoiceId,
            ["invoiceNumber"] = d.InvoiceId.HasValue ? $"INV-{d.InvoiceId}" : null,
            ["amount"] = new Dictionary<string, object?> { ["amount"] = d.Amount ?? 0m, ["currency"] = "ZAR" },
            ["vatAmount"] = d.VatAmount ?? 0m,
            ["settlementDiscount"] = d.SettlementDiscount ?? 0m,
            ["paymentDueDate"] = d.PaymentDueDate?.ToString("yyyy-MM-dd"),
            ["latePaymentReason"] = d.LatePaymentReason,
            ["remittanceSent"] = false
        }).ToList();

        var vendorName = ResolveVendorName(entity.VendorCreditorId);

        return new Dictionary<string, object?>
        {
            ["id"] = entity.PaymentHeaderId.ToString(),
            ["referenceNumber"] = entity.PaymentReferenceNumber,
            ["status"] = StatusMapper.ToStatusName("payment", entity.StatusId),
            ["statusId"] = entity.StatusId,
            ["vendorCreditorId"] = entity.VendorCreditorId,
            ["supplierName"] = vendorName,
            ["paymentTypeId"] = entity.PaymentTypeId,
            ["allocationStatusId"] = entity.AllocationStatusId,
            ["enabled"] = entity.Enabled,
            ["paymentMethod"] = "EFT",
            ["totalAmountValue"] = totalAmount,
            ["totalAmount"] = new Dictionary<string, object?> { ["amount"] = totalAmount, ["currency"] = "ZAR" },
            ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = vatAmount, ["currency"] = "ZAR" },
            ["itemCount"] = items.Count,
            ["items"] = items,
            ["batchDate"] = entity.DateCaptured?.ToString("yyyy-MM-dd"),
            ["createdDate"] = entity.DateCaptured?.ToString("o"),
            ["createdBy"] = "admin",
            ["createdByName"] = "System Administrator",
            ["financialYear"] = entity.FinancialYear ?? "2025/2026",
            ["supervisorApproved"] = entity.SupervisorApproved,
            ["hodApproved"] = entity.HodApproved,
            ["isVoid"] = entity.IsVoid,
            ["notes"] = "",
            ["approvalChain"] = new List<Dictionary<string, object?>>(),
            ["auditTrail"] = new List<Dictionary<string, object?>>(),
            ["documents"] = Array.Empty<object>()
        };
    }

    private Dictionary<string, object?> ConvertToDict(object obj)
    {
        if (obj is Dictionary<string, object?> d) return d;
        try
        {
            var json = JsonSerializer.Serialize(obj);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.EnumerateObject()
                .ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value));
        }
        catch { return new Dictionary<string, object?>(); }
    }

    private static object? ConvertJsonElement(JsonElement el) => el.ValueKind switch
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

    private static string GetStr(Dictionary<string, object?> d, string k)
        => d.TryGetValue(k, out var v) && v != null ? v.ToString()! : "";

    private static decimal GetDec(Dictionary<string, object?> d, string k)
    {
        if (!d.TryGetValue(k, out var v) || v == null) return 0;
        if (v is decimal dec) return dec;
        if (decimal.TryParse(v.ToString(), out var parsed)) return parsed;
        return 0;
    }

    private static void AddAuditEntry(Dictionary<string, object?> batch, string action, string details)
    {
        var trail = batch["auditTrail"] as List<Dictionary<string, object?>> ?? new();
        trail.Add(new Dictionary<string, object?>
        {
            ["action"] = action,
            ["details"] = details,
            ["userId"] = "admin",
            ["timestamp"] = DateTime.Now.ToString("o")
        });
        batch["auditTrail"] = trail;
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> SubmitBatchDictAsync(string id)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (status != "draft")
            return (null, $"Cannot submit batch in '{status}' status. Must be 'draft'.");
        batch["status"] = "pending_approval";
        AddAuditEntry(batch, "Batch Submitted", "Payment batch submitted for approval");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ApproveBatchDictAsync(string id, string? comments)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (status != "pending_approval" && status != "submitted")
            return (null, $"Cannot approve batch in '{status}' status. Must be 'pending_approval'.");
        batch["status"] = "approved";
        batch["approvedDate"] = DateTime.Now.ToString("o");
        var chain = batch["approvalChain"] as List<Dictionary<string, object?>> ?? new();
        chain.Add(new Dictionary<string, object?>
        {
            ["level"] = chain.Count + 1,
            ["userId"] = "admin",
            ["userName"] = "System Administrator",
            ["role"] = "CFO",
            ["status"] = "Approved",
            ["date"] = DateTime.Now.ToString("o"),
            ["comments"] = comments ?? ""
        });
        batch["approvalChain"] = chain;
        AddAuditEntry(batch, "Batch Approved", $"Payment batch approved by CFO. {comments ?? ""}".Trim());
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ProcessBatchDictAsync(string id)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (status != "approved" && status != "eft_generated")
            return (null, $"Cannot process batch in '{status}' status. Must be 'approved' or 'eft_generated'.");
        batch["status"] = "processed";
        batch["processedDate"] = DateTime.Now.ToString("o");

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        int invoicesPaid = 0;
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                var inv = await _invoiceService.GetInvoiceDictAsync(invId);
                if (inv != null)
                {
                    inv["status"] = "paid";
                    inv["paidDate"] = DateTime.Now.ToString("o");
                    await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                    invoicesPaid++;
                }
            }
            item["remittanceSent"] = false;
        }
        AddAuditEntry(batch, "Batch Processed", $"Payment batch processed. {invoicesPaid} invoices marked as paid.");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> VoidBatchDictAsync(string id)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (new[] { "processed", "voided", "reversed" }.Contains(status))
            return (null, $"Cannot void batch in '{status}' status.");
        batch["status"] = "voided";
        await ReleaseInvoicesAsync(batch);
        AddAuditEntry(batch, "Batch Voided", "Payment batch voided. Invoices released back to approved status.");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ReverseBatchDictAsync(string id, string? reason, string? reversalDate)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (status != "processed")
            return (null, $"Cannot reverse batch in '{status}' status. Must be 'processed'.");
        batch["status"] = "reversed";
        batch["reversalDate"] = reversalDate ?? DateTime.Now.ToString("o");
        batch["reversalReason"] = reason ?? "Reversed";

        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                var inv = await _invoiceService.GetInvoiceDictAsync(invId);
                if (inv != null)
                {
                    inv["status"] = "approved";
                    inv.Remove("paidDate");
                    await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                }
            }
        }
        AddAuditEntry(batch, "Batch Reversed", $"Payment reversed. Reason: {reason ?? "Not specified"}");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> CancelBatchDictAsync(string id, string? reason)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (new[] { "processed", "voided", "reversed", "cancelled" }.Contains(status))
            return (null, $"Cannot cancel batch in '{status}' status.");
        batch["status"] = "cancelled";
        await ReleaseInvoicesAsync(batch);
        AddAuditEntry(batch, "Batch Cancelled", $"Payment cancelled. Reason: {reason ?? "Cancelled by user"}");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> GenerateEftDictAsync(string id)
    {
        var batch = await GetBatchDictAsync(id);
        if (batch == null) return (null, "Batch not found");
        var status = GetStr(batch, "status");
        if (status != "approved")
            return (null, $"Cannot generate EFT for batch in '{status}' status. Must be 'approved'.");

        var refNum = GetStr(batch, "referenceNumber");
        var eftRef = $"EFT-{DateTime.Now:yyyyMMdd}-{id}";
        var eftFileName = $"EFT_{refNum}_{DateTime.Now:yyyyMMddHHmmss}.txt";

        batch["status"] = "eft_generated";
        batch["eftFileReference"] = eftRef;
        batch["eftFileName"] = eftFileName;
        batch["eftGeneratedDate"] = DateTime.Now.ToString("o");

        var bankCfg = await GetBankConfigAsync();
        var bankFiles = bankCfg["generatedFiles"] as List<Dictionary<string, object?>> ?? new();
        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        bankFiles.Add(new Dictionary<string, object?>
        {
            ["fileId"] = $"BF-{bankFiles.Count + 1:D3}",
            ["fileName"] = eftFileName,
            ["format"] = "NAEDO",
            ["formatName"] = "Standard Bank ACB",
            ["batchReference"] = refNum,
            ["recordCount"] = items.Count,
            ["totalAmount"] = batch["totalAmount"],
            ["generatedDate"] = DateTime.Now.ToString("o")
        });
        bankCfg["generatedFiles"] = bankFiles;

        AddAuditEntry(batch, "EFT File Generated", $"EFT file {eftFileName} generated with reference {eftRef}");
        await SaveBatchDictAsync(id, batch);
        return (batch, null);
    }

    private async Task ReleaseInvoicesAsync(Dictionary<string, object?> batch)
    {
        var items = batch["items"] as List<Dictionary<string, object?>> ?? new();
        foreach (var item in items)
        {
            if (item.TryGetValue("invoiceId", out var invIdObj) && invIdObj != null)
            {
                var invId = Convert.ToInt32(invIdObj);
                var inv = await _invoiceService.GetInvoiceDictAsync(invId);
                if (inv != null && GetStr(inv, "status") == "payment_batched")
                {
                    inv["status"] = "approved";
                    await _invoiceService.SaveInvoiceDictAsync(invId, inv);
                }
            }
        }
    }
}
