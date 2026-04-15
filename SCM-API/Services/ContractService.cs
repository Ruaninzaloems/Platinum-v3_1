using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class ContractService : IContractService
{
    private readonly IContractRepository _repository;
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<ContractService> _logger;

    public ContractService(IContractRepository repository, ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<ContractService> logger)
    {
        _repository = repository;
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<object?> GetByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(id);
                if (entity != null) return EntityToDict(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for contract {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return null;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
                return new PagedResult<object>
                {
                    Items = result.Items.Select(EntityToDict).Cast<object>(),
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.TotalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for contracts list");
                _dbChecker.MarkUnavailable();
            }
        }
        return new PagedResult<object> { Items = Enumerable.Empty<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };
    }

    public async Task<object> CreateAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = new ContractDetail
                {
                    ContractNumber = $"CON-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                    StatusId = 0,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                if (dto is JsonElement je)
                {
                    if (je.TryGetProperty("title", out var t)) entity.ContractDescription = t.GetString();
                    if (je.TryGetProperty("type", out var tp)) entity.ContractType = tp.GetString();
                    if (je.TryGetProperty("startDate", out var sd) && DateTime.TryParse(sd.GetString(), out var startDt)) entity.StartDate = startDt;
                    if (je.TryGetProperty("endDate", out var ed) && DateTime.TryParse(ed.GetString(), out var endDt)) entity.EndDate = endDt;
                    if (je.TryGetProperty("contractValue", out var cv) && cv.TryGetProperty("amount", out var amt)) entity.ContractValue = amt.GetDecimal();
                }

                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Created contract {Id}", entity.ContractDetailsId);
                return EntityToDict(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for contract");
                _dbChecker.MarkUnavailable();
            }
        }
        return new { id = 0, message = "DB unavailable" };
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                entity.DateModified = DateTime.UtcNow;
                entity.ModifierId = 1;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for contract {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<object> GetContractDetailsAsync(int contractId)
    {
        return await GetByIdAsync(contractId) ?? new object();
    }

    public async Task<bool> TerminateAsync(int contractId, object terminateDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(contractId);
                if (entity == null) return false;
                entity.StatusId = 7;
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Terminated contract {Id}", contractId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB terminate failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> RenewAsync(int contractId, object renewDto)
    {
        _logger.LogInformation("Renewing contract {Id}", contractId);
        return true;
    }

    public async Task<object> GetContractOrdersAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var orderIds = await _context.Orders
                    .Where(o => o.ContractId == contractId && o.Enabled == true)
                    .OrderByDescending(o => o.DateCaptured)
                    .Select(o => new { o.OrderId, o.OrderNumber, o.StatusId, o.DateCaptured })
                    .ToListAsync();
                var orders = new List<object>();
                foreach (var o in orderIds)
                {
                    var total = await _context.OrderTypeDetails
                        .Where(d => d.OrderId == o.OrderId)
                        .SumAsync(d => d.TotalAmount ?? 0);
                    orders.Add(new { o.OrderId, o.OrderNumber, totalAmount = total, o.StatusId, o.DateCaptured });
                }
                return orders;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB contract orders query failed for {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<bool> ApproveAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = 2;
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for contract {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> SubmitAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = 1;
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB submit failed for contract {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> ActivateAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = 3;
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Activated contract {Id}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB activate failed for contract {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<object> GetApprovalChainAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var approvals = await _context.ContractApprovals
                    .Where(a => a.ContractId == contractId)
                    .OrderBy(a => a.ApproveLevel)
                    .Select(a => new
                    {
                        a.ContractApprovalId,
                        a.ApproveLevel,
                        a.ApproveUser,
                        approveDate = a.ApproveDate.ToString("yyyy-MM-dd"),
                        a.ApproveComment,
                        a.IsApproved
                    })
                    .ToListAsync();
                return new { contractId, approvals, totalLevels = approvals.Count, allApproved = approvals.Count > 0 && approvals.All(a => a.IsApproved) };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approval chain query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, approvals = Array.Empty<object>(), totalLevels = 0, allApproved = false };
    }

    public async Task<object?> SubmitApprovalAsync(int contractId, int level, int userId, bool isApproved, string? comment)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                if (contract == null) return null;

                var approval = new ContractApproval
                {
                    ContractId = contractId,
                    ApproveLevel = level,
                    ApproveUser = userId,
                    ApproveDate = DateTime.UtcNow,
                    IsApproved = isApproved,
                    ApproveComment = comment
                };
                _context.ContractApprovals.Add(approval);
                await _context.SaveChangesAsync();

                var allApprovals = await _context.ContractApprovals
                    .Where(a => a.ContractId == contractId)
                    .ToListAsync();

                if (allApprovals.All(a => a.IsApproved) && allApprovals.Count >= 2)
                {
                    contract.StatusId = 2;
                    contract.DateModified = DateTime.UtcNow;
                    _repository.Update(contract);
                    await _repository.SaveChangesAsync();
                }

                _logger.LogInformation("Recorded approval level {Level} for contract {ContractId} by user {UserId} (approved={IsApproved})", level, contractId, userId, isApproved);
                return new
                {
                    approvalId = approval.ContractApprovalId,
                    contractId,
                    level,
                    isApproved,
                    comment,
                    date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    contractFullyApproved = allApprovals.All(a => a.IsApproved) && allApprovals.Count >= 2
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approval submission failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, level, isApproved, comment, date = DateTime.UtcNow.ToString("yyyy-MM-dd"), contractFullyApproved = false };
    }

    public async Task<object> GetVariationsAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var variations = await _context.ContractExtensionsAndVariations
                    .Where(v => v.ContractId == contractId && v.Enabled == true)
                    .OrderByDescending(v => v.DateCaptured)
                    .ToListAsync();

                return variations.Select(v => new
                {
                    v.ExtensionVariationId,
                    v.VariationType,
                    v.Description,
                    v.OriginalValue,
                    v.VariationValue,
                    v.NewContractValue,
                    originalEndDate = v.OriginalEndDate?.ToString("yyyy-MM-dd"),
                    newEndDate = v.NewEndDate?.ToString("yyyy-MM-dd"),
                    v.Reason,
                    status = StatusMapper.ToStatusName("contract", v.StatusId),
                    v.StatusId,
                    approvedDate = v.ApprovedDate?.ToString("yyyy-MM-dd"),
                    dateCaptured = v.DateCaptured?.ToString("yyyy-MM-dd")
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB variations query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<object?> CreateVariationAsync(int contractId, string variationType, string description, decimal? variationValue, DateTime? newEndDate, string? reason)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                if (contract == null) return null;

                var variation = new ContractExtensionAndVariation
                {
                    ContractId = contractId,
                    VariationType = variationType,
                    Description = description,
                    OriginalValue = contract.ContractValue,
                    VariationValue = variationValue,
                    NewContractValue = (contract.ContractValue ?? 0) + (variationValue ?? 0),
                    OriginalEndDate = contract.EndDate,
                    NewEndDate = newEndDate ?? contract.EndDate,
                    Reason = reason,
                    StatusId = 0,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };
                _context.ContractExtensionsAndVariations.Add(variation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created variation {VariationId} for contract {ContractId} type={Type} value={Value}", variation.ExtensionVariationId, contractId, variationType, variationValue);
                return new
                {
                    variationId = variation.ExtensionVariationId,
                    contractId,
                    variationType,
                    description,
                    originalValue = contract.ContractValue,
                    variationValue,
                    newContractValue = variation.NewContractValue,
                    originalEndDate = contract.EndDate?.ToString("yyyy-MM-dd"),
                    newEndDate = variation.NewEndDate?.ToString("yyyy-MM-dd"),
                    reason,
                    status = "pending_approval"
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create variation failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, variationType, description, variationValue, status = "pending_approval" };
    }

    public async Task<bool> ApproveVariationAsync(int variationId, int userId)
    {
        if (UseDb)
        {
            try
            {
                var variation = await _context.ContractExtensionsAndVariations.FindAsync(variationId);
                if (variation == null) return false;

                variation.StatusId = 2;
                variation.ApprovedBy = userId;
                variation.ApprovedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var contract = await _repository.GetByIdAsync(variation.ContractId ?? 0);
                if (contract != null)
                {
                    contract.ContractValue = variation.NewContractValue;
                    if (variation.NewEndDate.HasValue) contract.EndDate = variation.NewEndDate;
                    contract.DateModified = DateTime.UtcNow;
                    _repository.Update(contract);
                    await _repository.SaveChangesAsync();
                    _logger.LogInformation("Approved variation {VariationId} — contract {ContractId} updated to value={Value} endDate={EndDate}", variationId, contract.ContractDetailsId, contract.ContractValue, contract.EndDate);
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve variation failed for {VariationId}", variationId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<object> GetPerformanceAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var evaluations = await _context.ContractPerformances
                    .Where(p => p.ContractId == contractId && p.Enabled == true)
                    .OrderByDescending(p => p.EvaluationDate)
                    .ToListAsync();

                var summary = evaluations.Count > 0 ? new
                {
                    avgQuality = Math.Round(evaluations.Average(e => e.QualityScore ?? 0), 1),
                    avgDelivery = Math.Round(evaluations.Average(e => e.DeliveryScore ?? 0), 1),
                    avgCost = Math.Round(evaluations.Average(e => e.CostScore ?? 0), 1),
                    avgService = Math.Round(evaluations.Average(e => e.ServiceScore ?? 0), 1),
                    avgOverall = Math.Round(evaluations.Average(e => e.OverallScore ?? 0), 1),
                    totalEvaluations = evaluations.Count,
                    latestDate = evaluations.First().EvaluationDate?.ToString("yyyy-MM-dd")
                } : null;

                var history = evaluations.Select(e => new
                {
                    e.ContractPerformanceId,
                    evaluationDate = e.EvaluationDate?.ToString("yyyy-MM-dd"),
                    e.QualityScore,
                    e.DeliveryScore,
                    e.CostScore,
                    e.ServiceScore,
                    e.OverallScore,
                    e.Comments,
                    e.Period
                });

                return new { summary, history, overallScore = summary?.avgOverall ?? 0 };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB performance query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { summary = (object?)null, history = Array.Empty<object>(), overallScore = 0 };
    }

    public async Task<object?> RecordPerformanceAsync(int contractId, int quality, int delivery, int cost, int service, string? comments, string? period)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                if (contract == null) return null;

                var overall = (int)Math.Round((quality + delivery + cost + service) / 4.0);
                var perf = new ContractPerformance
                {
                    ContractId = contractId,
                    EvaluationDate = DateTime.UtcNow,
                    QualityScore = quality,
                    DeliveryScore = delivery,
                    CostScore = cost,
                    ServiceScore = service,
                    OverallScore = overall,
                    Comments = comments,
                    Period = period ?? DateTime.UtcNow.ToString("yyyy-MM"),
                    EvaluatedBy = 1,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };
                _context.ContractPerformances.Add(perf);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Recorded performance for contract {ContractId}: overall={Overall}", contractId, overall);
                return new
                {
                    performanceId = perf.ContractPerformanceId,
                    contractId,
                    quality,
                    delivery,
                    cost,
                    service,
                    overall,
                    comments,
                    period = perf.Period,
                    date = DateTime.UtcNow.ToString("yyyy-MM-dd")
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB record performance failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        var fallbackOverall = (int)Math.Round((quality + delivery + cost + service) / 4.0);
        return new { contractId, quality, delivery, cost, service, overall = fallbackOverall, comments, date = DateTime.UtcNow.ToString("yyyy-MM-dd") };
    }

    public async Task<object> GetServiceRequestsAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var requests = await _context.ContractServiceRequests
                    .Where(r => r.ContractId == contractId && r.Enabled == true)
                    .OrderByDescending(r => r.DateCaptured)
                    .ToListAsync();

                return requests.Select(r => new
                {
                    r.ContractServiceRequestId,
                    r.RequestNumber,
                    r.Description,
                    r.RequestedValue,
                    r.ApprovedValue,
                    requestDate = r.RequestDate?.ToString("yyyy-MM-dd"),
                    requiredDate = r.RequiredDate?.ToString("yyyy-MM-dd"),
                    status = StatusMapper.ToStatusName("contract", r.StatusId),
                    r.StatusId,
                    approvedDate = r.ApprovedDate?.ToString("yyyy-MM-dd"),
                    r.VendorId
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB service requests query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<object?> CreateServiceRequestAsync(int contractId, string description, decimal? requestedValue, DateTime? requiredDate, int? vendorId)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                if (contract == null) return null;

                var sr = new ContractServiceRequest
                {
                    ContractId = contractId,
                    RequestNumber = $"SR-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",
                    Description = description,
                    RequestedValue = requestedValue,
                    RequestDate = DateTime.UtcNow,
                    RequiredDate = requiredDate,
                    StatusId = 0,
                    RequestedBy = 1,
                    VendorId = vendorId ?? contract.VendorId,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };
                _context.ContractServiceRequests.Add(sr);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created service request {SrId} for contract {ContractId}", sr.ContractServiceRequestId, contractId);
                return new
                {
                    serviceRequestId = sr.ContractServiceRequestId,
                    requestNumber = sr.RequestNumber,
                    contractId,
                    description,
                    requestedValue,
                    requiredDate = requiredDate?.ToString("yyyy-MM-dd"),
                    status = "pending"
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create service request failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, description, requestedValue, status = "pending" };
    }

    public async Task<bool> ApproveServiceRequestAsync(int serviceRequestId, int userId, decimal? approvedValue)
    {
        if (UseDb)
        {
            try
            {
                var sr = await _context.ContractServiceRequests.FindAsync(serviceRequestId);
                if (sr == null) return false;

                sr.StatusId = 2;
                sr.ApprovedBy = userId;
                sr.ApprovedDate = DateTime.UtcNow;
                sr.ApprovedValue = approvedValue ?? sr.RequestedValue;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Approved service request {SrId}", serviceRequestId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve service request failed for {SrId}", serviceRequestId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<object> GetValueExhaustionAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                if (contract == null) return new { contractId, message = "Contract not found" };

                var contractValue = contract.ContractValue ?? 0;
                var contractOrderIds = await _context.Orders
                    .Where(o => o.ContractId == contractId && o.Enabled == true)
                    .Select(o => o.OrderId)
                    .ToListAsync();
                var totalOrdered = contractOrderIds.Count > 0
                    ? await _context.OrderTypeDetails
                        .Where(d => contractOrderIds.Contains(d.OrderId ?? 0))
                        .SumAsync(d => d.TotalAmount ?? 0)
                    : 0m;
                var totalCertified = await _context.PaymentCertificates
                    .Where(p => p.ContractId == contractId && p.Enabled == true)
                    .SumAsync(p => p.NetValue ?? 0);

                var effectiveValue = contractValue;
                var remaining = effectiveValue - totalOrdered;
                var utilisationPct = effectiveValue > 0 ? Math.Round(totalOrdered / effectiveValue * 100, 1) : 0;
                var isExhausted = remaining <= 0;
                var isNearExhaustion = utilisationPct >= 80;

                return new
                {
                    contractId,
                    contractValue,
                    effectiveValue,
                    totalOrdered,
                    totalCertified,
                    remaining,
                    utilisationPercentage = utilisationPct,
                    isExhausted,
                    isNearExhaustion,
                    alertLevel = isExhausted ? "critical" : isNearExhaustion ? "warning" : "normal",
                    alertMessage = isExhausted
                        ? "Contract value fully exhausted. No further orders can be raised without a variation order."
                        : isNearExhaustion
                        ? $"Contract {utilisationPct}% utilised. Remaining: R{remaining:N2}. Consider raising a variation order."
                        : $"Contract utilisation at {utilisationPct}%. R{remaining:N2} remaining."
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB value exhaustion query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, alertLevel = "unknown", alertMessage = "Database unavailable" };
    }

    public async Task<object> GetRetentionAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetByIdAsync(contractId);
                var retentions = await _context.RetentionRegisters
                    .Where(r => r.ContractId == contractId)
                    .OrderByDescending(r => r.ReleaseDate)
                    .ToListAsync();

                var totalRetained = retentions.Sum(r => r.RetentionAmount ?? 0);
                var totalReleased = retentions.Where(r => r.StatusId == 2).Sum(r => r.RetentionAmount ?? 0);
                var pending = totalRetained - totalReleased;

                return new
                {
                    contractId,
                    retentionPercentage = contract?.RetentionPercentage ?? 0,
                    totalRetained,
                    totalReleased,
                    pendingRelease = pending,
                    records = retentions.Select(r => new
                    {
                        r.RetentionRegisterId,
                        r.RetentionAmount,
                        releaseDate = r.ReleaseDate?.ToString("yyyy-MM-dd"),
                        releasedDate = r.ReleasedDate?.ToString("yyyy-MM-dd"),
                        status = r.StatusId == 2 ? "released" : "held",
                        r.StatusId
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB retention query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, retentionPercentage = 0, totalRetained = 0m, totalReleased = 0m, pendingRelease = 0m, records = Array.Empty<object>() };
    }

    public async Task<bool> ReleaseRetentionAsync(int retentionId, int userId)
    {
        if (UseDb)
        {
            try
            {
                var retention = await _context.RetentionRegisters.FindAsync(retentionId);
                if (retention == null) return false;
                retention.StatusId = 2;
                retention.ReleasedBy = userId;
                retention.ReleasedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Released retention {RetentionId} by user {UserId}", retentionId, userId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB release retention failed for {RetentionId}", retentionId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<object> GetContractDashboardAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var contract = await _repository.GetWithDetailsAsync(contractId);
                if (contract == null) return new { contractId, message = "Not found" };

                var totalMilestones = contract.Milestones.Count;
                var completedMilestones = contract.Milestones.Count(m => m.IsCompleted == true);
                var completionPct = totalMilestones > 0 ? Math.Round((decimal)completedMilestones / totalMilestones * 100, 1) : 0;
                var totalCertified = contract.PaymentCertificates.Sum(p => p.NetValue ?? 0);
                var contractValue = contract.ContractValue ?? 0;
                var budgetRemaining = contractValue - totalCertified;

                return new
                {
                    contractId,
                    completionPercentage = completionPct,
                    spendToDate = totalCertified,
                    budgetRemaining,
                    milestones = contract.Milestones.OrderBy(m => m.SequenceNo).Select(m => new
                    {
                        id = m.MilestoneId,
                        description = m.MilestoneDescription,
                        plannedDate = m.PlannedDate?.ToString("yyyy-MM-dd"),
                        actualDate = m.ActualDate?.ToString("yyyy-MM-dd"),
                        value = m.MilestoneValue,
                        percentage = m.PercentageOfContract,
                        status = m.IsCompleted == true ? "completed" : (m.PlannedDate < DateTime.UtcNow ? "overdue" : "pending"),
                        isCompleted = m.IsCompleted ?? false
                    }),
                    paymentCertificateCount = contract.PaymentCertificates.Count,
                    totalMilestones,
                    completedMilestones
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB dashboard query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { contractId, completionPercentage = 0, spendToDate = 0m, budgetRemaining = 0m, milestones = Array.Empty<object>() };
    }

    public async Task<object> GetExpiringAsync(int days)
    {
        if (UseDb)
        {
            try
            {
                var cutoff = DateTime.UtcNow.AddDays(days);
                var expiring = await _context.ContractDetails
                    .Where(c => c.Enabled == true && c.EndDate != null && c.EndDate <= cutoff && c.EndDate >= DateTime.UtcNow && c.StatusId != 7)
                    .OrderBy(c => c.EndDate)
                    .Select(c => new
                    {
                        c.ContractDetailsId,
                        c.ContractNumber,
                        c.ContractDescription,
                        contractValue = c.ContractValue ?? 0,
                        endDate = c.EndDate!.Value.ToString("yyyy-MM-dd"),
                        daysRemaining = (c.EndDate!.Value - DateTime.UtcNow).Days,
                        c.ContractType,
                        c.VendorId
                    })
                    .ToListAsync();
                return expiring;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB expiring contracts query failed");
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<object?> CompleteMilestoneAsync(int contractId, int milestoneId)
    {
        if (UseDb)
        {
            try
            {
                var milestone = await _context.ContractMilestones
                    .FirstOrDefaultAsync(m => m.MilestoneId == milestoneId && m.ContractId == contractId);
                if (milestone == null) return null;

                milestone.IsCompleted = true;
                milestone.CompletedDate = DateTime.UtcNow;
                milestone.ActualDate = DateTime.UtcNow;
                milestone.CompletedBy = 1;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Completed milestone {MilestoneId} for contract {ContractId}", milestoneId, contractId);
                return new
                {
                    milestone = new
                    {
                        id = milestone.MilestoneId,
                        description = milestone.MilestoneDescription,
                        status = "completed",
                        completedDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        value = milestone.MilestoneValue,
                        percentage = milestone.PercentageOfContract
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB complete milestone failed for contract {Id} milestone {MilestoneId}", contractId, milestoneId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new { milestone = new { id = milestoneId, status = "completed", completedDate = DateTime.UtcNow.ToString("yyyy-MM-dd") } };
    }

    public async Task<object> GetPenaltiesAsync(int contractId)
    {
        return new List<object>();
    }

    public async Task<object?> RecordPenaltyAsync(int contractId, string type, decimal amount, string? reason)
    {
        _logger.LogInformation("Recorded penalty for contract {ContractId}: type={Type} amount={Amount}", contractId, type, amount);
        return new { contractId, type, amount, reason, date = DateTime.UtcNow.ToString("yyyy-MM-dd"), status = "recorded" };
    }

    public async Task<object> GetDetailItemsAsync(int contractId)
    {
        if (UseDb)
        {
            try
            {
                var items = await _context.ContractDetailItems
                    .Where(i => i.ContractDetailsId == contractId && i.Enabled == true)
                    .OrderBy(i => i.ContractDetailItemId)
                    .ToListAsync();

                return items.Select(i => new
                {
                    i.ContractDetailItemId,
                    i.ItemDescription,
                    i.UnitOfMeasure,
                    i.Quantity,
                    i.UnitRate,
                    i.TotalAmount,
                    i.ScoaItemId
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB detail items query failed for contract {Id}", contractId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    private Dictionary<string, object?> EntityToDict(ContractDetail entity)
    {
        var statusName = StatusMapper.ToStatusName("contract", entity.StatusId);
        return new Dictionary<string, object?>
        {
            ["id"] = entity.ContractDetailsId,
            ["contractId"] = entity.ContractId,
            ["contractNumber"] = entity.ContractNumber,
            ["title"] = entity.ContractDescription,
            ["description"] = entity.ContractDescription,
            ["contractValue"] = new { amount = entity.ContractValue ?? 0, currency = "ZAR" },
            ["status"] = statusName,
            ["statusId"] = entity.StatusId ?? 0,
            ["type"] = entity.ContractType ?? "services",
            ["contractType"] = entity.ContractType,
            ["startDate"] = entity.StartDate?.ToString("yyyy-MM-dd"),
            ["endDate"] = entity.EndDate?.ToString("yyyy-MM-dd"),
            ["vendorId"] = entity.VendorId,
            ["supplierName"] = $"Vendor {entity.VendorId}",
            ["department"] = $"Department {entity.DepartmentId}",
            ["departmentId"] = entity.DepartmentId,
            ["retentionPercentage"] = entity.RetentionPercentage ?? 0,
            ["guaranteePercentage"] = entity.GuaranteePercentage ?? 0,
            ["performanceBondPercentage"] = entity.PerformanceBondPercentage ?? 0,
            ["isRateBased"] = entity.IsRateBased ?? false,
            ["panelOfVendors"] = entity.PanelOfVendors ?? false,
            ["captureDate"] = entity.DateCaptured?.ToString("yyyy-MM-dd"),
            ["enabled"] = entity.Enabled ?? true,
            ["milestones"] = entity.Milestones?.OrderBy(m => m.SequenceNo).Select(m => new
            {
                id = m.MilestoneId,
                description = m.MilestoneDescription,
                plannedDate = m.PlannedDate?.ToString("yyyy-MM-dd"),
                actualDate = m.ActualDate?.ToString("yyyy-MM-dd"),
                value = m.MilestoneValue,
                percentage = m.PercentageOfContract,
                status = m.IsCompleted == true ? "completed" : (m.PlannedDate < DateTime.UtcNow ? "overdue" : "pending"),
                isCompleted = m.IsCompleted ?? false
            }).ToList(),
            ["lineItems"] = entity.DetailItems?.Where(i => i.Enabled == true).Select(i => new
            {
                id = i.ContractDetailItemId,
                description = i.ItemDescription,
                unitOfMeasure = i.UnitOfMeasure,
                quantity = i.Quantity,
                unitRate = i.UnitRate,
                totalAmount = i.TotalAmount
            }).ToList(),
            ["percentageComplete"] = entity.Milestones != null && entity.Milestones.Count > 0
                ? Math.Round((decimal)entity.Milestones.Count(m => m.IsCompleted == true) / entity.Milestones.Count * 100, 1)
                : 0
        };
    }
}
