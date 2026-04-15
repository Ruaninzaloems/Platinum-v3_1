using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class VendorManagementService : IVendorManagementService
{
    private readonly IVendorManagementRepository _repo;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<VendorManagementService> _logger;

    private static readonly ConcurrentDictionary<string, Dictionary<string, object>> _registrations = new();
    private static bool _seeded;
    private static readonly object _seedLock = new();
    private static int _nextMockId = 9000;

    public VendorManagementService(
        IVendorManagementRepository repo,
        DbAvailabilityChecker dbChecker,
        ILogger<VendorManagementService> logger)
    {
        _repo = repo;
        _dbChecker = dbChecker;
        _logger = logger;
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

    private static void SeedData()
    {
        var seed1 = new Dictionary<string, object>
        {
            ["id"] = "v001",
            ["name"] = "Boland Building Supplies (Pty) Ltd",
            ["tradingName"] = "Boland Supplies",
            ["registrationNumber"] = "2018/456789/07",
            ["registrationType"] = "PTY",
            ["contactPerson"] = "Johan van der Merwe",
            ["email"] = "johan@bolandsupplies.co.za",
            ["phone"] = "021 555 1234",
            ["vatNumber"] = "4120345678",
            ["status"] = "approved",
            ["registrationSource"] = "manual",
            ["capturedByName"] = "Admin User",
            ["capturedDate"] = DateTime.UtcNow.AddDays(-45).ToString("o"),
            ["createdDate"] = DateTime.UtcNow.AddDays(-45).ToString("o"),
            ["bbbeeLevel"] = "Level 2",
            ["supplierId"] = "v001",
            ["province"] = "Western Cape",
            ["businessArea"] = "Building & Construction",
            ["subSector"] = "General Building",
            ["timesInvited"] = 10,
            ["timesAwarded"] = 3,
            ["rotationScore"] = 71
        };

        var seed2 = new Dictionary<string, object>
        {
            ["id"] = "v002",
            ["name"] = "Cape IT Solutions CC",
            ["tradingName"] = "Cape IT",
            ["registrationNumber"] = "2020/112233/23",
            ["registrationType"] = "CC",
            ["contactPerson"] = "Sipho Ndlovu",
            ["email"] = "sipho@capeit.co.za",
            ["phone"] = "044 873 5678",
            ["vatNumber"] = "4230567890",
            ["status"] = "approved",
            ["registrationSource"] = "manual",
            ["capturedByName"] = "Admin User",
            ["capturedDate"] = DateTime.UtcNow.AddDays(-10).ToString("o"),
            ["createdDate"] = DateTime.UtcNow.AddDays(-10).ToString("o"),
            ["bbbeeLevel"] = "Level 1",
            ["supplierId"] = "v002",
            ["province"] = "Western Cape",
            ["businessArea"] = "ICT",
            ["subSector"] = "Hardware & Software",
            ["timesInvited"] = 6,
            ["timesAwarded"] = 2,
            ["rotationScore"] = 68
        };

        var seed3 = new Dictionary<string, object>
        {
            ["id"] = "v003",
            ["name"] = "Garden Route Electrical (Pty) Ltd",
            ["tradingName"] = "GR Electrical",
            ["registrationNumber"] = "2015/998877/07",
            ["registrationType"] = "PTY",
            ["contactPerson"] = "Fatima Adams",
            ["email"] = "fatima@grelectrical.co.za",
            ["phone"] = "044 874 9012",
            ["vatNumber"] = "4560123456",
            ["status"] = "approved",
            ["registrationSource"] = "manual",
            ["capturedByName"] = "SCM Clerk",
            ["capturedDate"] = DateTime.UtcNow.AddDays(-3).ToString("o"),
            ["createdDate"] = DateTime.UtcNow.AddDays(-3).ToString("o"),
            ["bbbeeLevel"] = "Level 3",
            ["supplierId"] = "v003",
            ["province"] = "Western Cape",
            ["businessArea"] = "Electrical & Mechanical",
            ["subSector"] = "Electrical Installations",
            ["timesInvited"] = 9,
            ["timesAwarded"] = 3,
            ["rotationScore"] = 74
        };

        _registrations["v001"] = seed1;
        _registrations["v002"] = seed2;
        _registrations["v003"] = seed3;
    }

    public async Task<object?> GetRegistrationByIdAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationWithDetailsAsync(dbId);
                if (entity != null) return MapRegistrationToResponse(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor registration {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.TryGetValue(id, out var reg)) return null;

        return new Dictionary<string, object>
        {
            ["registration"] = new Dictionary<string, object>
            {
                ["id"] = reg.GetValueOrDefault("id", id)!,
                ["status"] = reg.GetValueOrDefault("status", "draft")!,
                ["registrationSource"] = reg.GetValueOrDefault("registrationSource", "manual")!,
                ["capturedByName"] = reg.GetValueOrDefault("capturedByName", "Admin User")!,
                ["capturedDate"] = reg.GetValueOrDefault("capturedDate", DateTime.UtcNow.ToString("o"))!,
                ["createdDate"] = reg.GetValueOrDefault("createdDate", DateTime.UtcNow.ToString("o"))!,
                ["wizard"] = new Dictionary<string, object> { ["currentStep"] = 1 }
            },
            ["supplier"] = new Dictionary<string, object>
            {
                ["id"] = reg.GetValueOrDefault("supplierId", id)!,
                ["name"] = reg.GetValueOrDefault("name", "")!,
                ["tradingName"] = reg.GetValueOrDefault("tradingName", "")!,
                ["registrationNumber"] = reg.GetValueOrDefault("registrationNumber", "")!,
                ["registrationType"] = reg.GetValueOrDefault("registrationType", "")!,
                ["contactPerson"] = reg.GetValueOrDefault("contactPerson", "")!,
                ["email"] = reg.GetValueOrDefault("email", "")!,
                ["phone"] = reg.GetValueOrDefault("phone", "")!,
                ["vatNumber"] = reg.GetValueOrDefault("vatNumber", "")!,
                ["bbbeeLevel"] = reg.GetValueOrDefault("bbbeeLevel", "")!
            }
        };
    }

    public async Task<PagedResult<object>> GetRegistrationsAsync(string? status, string? search, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Max(1, pageSize);

        if (UseDb)
        {
            try
            {
                bool? dbStatus = null;
                if (!string.IsNullOrEmpty(status))
                    dbStatus = status.Equals("approved", StringComparison.OrdinalIgnoreCase);

                var result = await _repo.GetRegistrationsFilteredAsync(dbStatus, search, page, pageSize);
                var items = result.Items.Select(MapRegistrationToListItem).Cast<object>().ToList();
                return new PagedResult<object> { Items = items, Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor registrations, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var allItems = _registrations.Values.Cast<object>().ToList();
        if (!string.IsNullOrEmpty(status))
            allItems = allItems.Where(r => ((Dictionary<string, object>)r).GetValueOrDefault("status")?.ToString() == status).ToList();
        if (!string.IsNullOrEmpty(search))
        {
            var searchLower = search.ToLower();
            allItems = allItems.Where(r =>
            {
                var d = (Dictionary<string, object>)r;
                return (d.GetValueOrDefault("name")?.ToString()?.ToLower()?.Contains(searchLower) == true) ||
                       (d.GetValueOrDefault("registrationNumber")?.ToString()?.ToLower()?.Contains(searchLower) == true) ||
                       (d.GetValueOrDefault("tradingName")?.ToString()?.ToLower()?.Contains(searchLower) == true);
            }).ToList();
        }
        var total = allItems.Count;
        var paged = allItems.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return new PagedResult<object> { Items = paged, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<object> StartRegistrationAsync(object dto)
    {
        var formData = ConvertToDict(dto);

        if (UseDb)
        {
            try
            {
                var entity = new VendorRegistration
                {
                    CompanyName = GetStr(formData, "name") ?? GetStr(formData, "companyName"),
                    TradingName = GetStr(formData, "tradingName"),
                    CompanyTypeId = GetInt(formData, "companyTypeId"),
                    FirstName = GetStr(formData, "firstName"),
                    LastName = GetStr(formData, "lastName"),
                    EmailAddress = GetStr(formData, "emailAddress") ?? GetStr(formData, "email"),
                    ContactName = GetStr(formData, "contactPerson") ?? GetStr(formData, "contactName"),
                    ContractPerson = GetStr(formData, "contactPerson"),
                    TelephoneNumber = GetStr(formData, "phone") ?? GetStr(formData, "telephoneNumber"),
                    CellphoneNumber = GetStr(formData, "cellphoneNumber"),
                    Email = GetStr(formData, "email"),
                    VatRegistrationNo = GetStr(formData, "vatNumber") ?? GetStr(formData, "vatRegistrationNo"),
                    CiproCompanyNo = GetStr(formData, "registrationNumber") ?? GetStr(formData, "ciproCompanyNo"),
                    PostalAddress = GetStr(formData, "postalAddress"),
                    PhysicalAddress = GetStr(formData, "physicalAddress"),
                    Status = false,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                var created = await _repo.CreateRegistrationAsync(entity);
                _logger.LogInformation("Created vendor registration {Id} in DB", created.VendorRegistrationId);
                return MapRegistrationToListItem(created);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for vendor registration, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = Interlocked.Increment(ref _nextMockId).ToString();
        var reg = new Dictionary<string, object>
        {
            ["id"] = id,
            ["status"] = "draft",
            ["registrationSource"] = "manual",
            ["capturedByName"] = "Admin User",
            ["capturedDate"] = DateTime.UtcNow.ToString("o"),
            ["createdDate"] = DateTime.UtcNow.ToString("o"),
            ["supplierId"] = id
        };

        foreach (var kv in formData)
        {
            if (kv.Key != "id" && kv.Key != "status")
                reg[kv.Key] = kv.Value;
        }

        _registrations[id] = reg;
        _logger.LogInformation("Started vendor registration {Id} (in-memory)", id);
        return reg;
    }

    public async Task<bool> UpdateRegistrationAsync(string id, object dto)
    {
        var formData = ConvertToDict(dto);

        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationByIdAsync(dbId);
                if (entity == null) return false;

                if (formData.ContainsKey("companyName") || formData.ContainsKey("name"))
                    entity.CompanyName = GetStr(formData, "companyName") ?? GetStr(formData, "name");
                if (formData.ContainsKey("tradingName"))
                    entity.TradingName = GetStr(formData, "tradingName");
                if (formData.ContainsKey("contactPerson") || formData.ContainsKey("contactName"))
                    entity.ContactName = GetStr(formData, "contactPerson") ?? GetStr(formData, "contactName");
                if (formData.ContainsKey("email") || formData.ContainsKey("emailAddress"))
                    entity.EmailAddress = GetStr(formData, "emailAddress") ?? GetStr(formData, "email");
                if (formData.ContainsKey("phone") || formData.ContainsKey("telephoneNumber"))
                    entity.TelephoneNumber = GetStr(formData, "phone") ?? GetStr(formData, "telephoneNumber");
                if (formData.ContainsKey("vatNumber") || formData.ContainsKey("vatRegistrationNo"))
                    entity.VatRegistrationNo = GetStr(formData, "vatNumber") ?? GetStr(formData, "vatRegistrationNo");
                if (formData.ContainsKey("status"))
                {
                    var statusStr = formData["status"]?.ToString();
                    entity.Status = statusStr == "approved" || statusStr == "true" || statusStr == "True";
                }

                entity.DateModified = DateTime.UtcNow;
                entity.ModifierId = 1;
                return await _repo.UpdateRegistrationAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for vendor registration {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.ContainsKey(id)) return false;
        foreach (var kv in formData)
        {
            if (kv.Key != "id")
                _registrations[id][kv.Key] = kv.Value;
        }
        _registrations[id]["updatedDate"] = DateTime.UtcNow.ToString("o");
        return true;
    }

    public async Task<bool> SubmitRegistrationAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationByIdAsync(dbId);
                if (entity == null) return false;
                entity.Status = false;
                entity.Reason = "Pending supervisor approval";
                entity.DateModified = DateTime.UtcNow;
                entity.ModifierId = 1;
                return await _repo.UpdateRegistrationAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB submit failed for vendor registration {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.ContainsKey(id)) return false;
        _registrations[id]["status"] = "pending_supervisor_approval";
        return true;
    }

    public async Task<bool> ApproveRegistrationAsync(string id, object dto)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationByIdAsync(dbId);
                if (entity == null) return false;
                entity.Status = true;
                entity.Approved = true;
                entity.DateModified = DateTime.UtcNow;
                entity.ModifierId = 1;
                return await _repo.UpdateRegistrationAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for vendor registration {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.ContainsKey(id)) return false;
        _registrations[id]["status"] = "approved";
        return true;
    }

    public async Task<bool> RejectRegistrationAsync(string id, object dto)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationByIdAsync(dbId);
                if (entity == null) return false;
                entity.Status = false;
                entity.Approved = false;
                entity.Reason = "Rejected";
                entity.DateModified = DateTime.UtcNow;
                entity.ModifierId = 1;
                return await _repo.UpdateRegistrationAsync(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB reject failed for vendor registration {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.ContainsKey(id)) return false;
        _registrations[id]["status"] = "rejected";
        return true;
    }

    public async Task<object> GetRegistrationDocumentsAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var docs = await _repo.GetDocumentsByVendorIdAsync(dbId);
                return docs.Select(d => new Dictionary<string, object?>
                {
                    ["id"] = d.DocumentDetailsId,
                    ["vendorId"] = d.VendorId,
                    ["documentTypeId"] = d.DocumentTypeId,
                    ["documentPath"] = d.DocumentPath,
                    ["documentNumber"] = d.DocumentNumber,
                    ["expiryDate"] = d.ExpiryDate?.ToString("o"),
                    ["isDocReceived"] = d.IsDocReceived,
                    ["isRequired"] = d.IsRequired,
                    ["comments"] = d.Comments,
                    ["dateCaptured"] = d.DateCaptured.ToString("o")
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor documents {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    public async Task<bool> UploadRegistrationDocumentAsync(string id, object dto)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var formData = ConvertToDict(dto);
                var document = new VendorDocumentDetail
                {
                    VendorId = dbId,
                    DocumentTypeId = GetInt(formData, "documentTypeId"),
                    DocumentPath = GetStr(formData, "documentPath"),
                    DocumentNumber = GetStr(formData, "documentNumber"),
                    Comments = GetStr(formData, "comments"),
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                if (formData.ContainsKey("expiryDate"))
                {
                    var expStr = GetStr(formData, "expiryDate");
                    if (DateTime.TryParse(expStr, out var expDate))
                        document.ExpiryDate = expDate;
                }

                await _repo.CreateDocumentAsync(document);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for vendor document {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<object> GetRegistrationDirectorsAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var shareholders = await _repo.GetShareHoldersByVendorIdAsync(dbId);
                var list = shareholders.Select(s => new Dictionary<string, object?>
                {
                    ["id"] = s.ShareHolderId,
                    ["vendorId"] = s.VendorId,
                    ["name"] = s.Name,
                    ["idNumber"] = s.IdNumber,
                    ["passportNumber"] = s.PassportNumber,
                    ["citizenship"] = s.Citizenship,
                    ["dateOfOwnership"] = s.DateOfOwnership?.ToString("o"),
                    ["ownedPercentage"] = s.Owned,
                    ["votingPercentage"] = s.Voting,
                    ["hdi"] = s.Hdi,
                    ["disability"] = s.Disability,
                    ["female"] = s.Female
                }).ToList();

                var totalOwned = shareholders.Sum(s => s.Owned ?? 0);
                var totalVoting = shareholders.Sum(s => s.Voting ?? 0);
                var hdiCount = shareholders.Count(s => s.Hdi == true);
                var femaleCount = shareholders.Count(s => s.Female == true);
                var disabilityCount = shareholders.Count(s => s.Disability == true);

                return new Dictionary<string, object>
                {
                    ["directors"] = list,
                    ["ownershipAnalysis"] = new Dictionary<string, object>
                    {
                        ["totalOwned"] = totalOwned,
                        ["totalVoting"] = totalVoting,
                        ["hdiCount"] = hdiCount,
                        ["femaleCount"] = femaleCount,
                        ["disabilityCount"] = disabilityCount,
                        ["totalDirectors"] = list.Count
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor directors {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return new Dictionary<string, object>
        {
            ["directors"] = new List<object>(),
            ["ownershipAnalysis"] = new Dictionary<string, object>
            {
                ["totalOwned"] = 0m,
                ["totalVoting"] = 0m,
                ["hdiCount"] = 0,
                ["femaleCount"] = 0,
                ["disabilityCount"] = 0,
                ["totalDirectors"] = 0
            }
        };
    }

    public async Task<bool> AddDirectorAsync(string id, object dto)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var formData = ConvertToDict(dto);
                var shareHolder = new VendorShareHolderDetail
                {
                    VendorId = dbId,
                    Name = GetStr(formData, "name"),
                    IdNumber = GetStr(formData, "idNumber"),
                    PassportNumber = GetStr(formData, "passportNumber"),
                    Citizenship = GetStr(formData, "citizenship"),
                    Owned = GetDecimal(formData, "ownedPercentage"),
                    Voting = GetDecimal(formData, "votingPercentage"),
                    Hdi = GetBool(formData, "hdi"),
                    Disability = GetBool(formData, "disability"),
                    Female = GetBool(formData, "female"),
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                if (formData.ContainsKey("dateOfOwnership"))
                {
                    var dateStr = GetStr(formData, "dateOfOwnership");
                    if (DateTime.TryParse(dateStr, out var d))
                        shareHolder.DateOfOwnership = d;
                }

                await _repo.CreateShareHolderAsync(shareHolder);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for vendor director {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<bool> RemoveDirectorAsync(string id, string directorId)
    {
        if (UseDb && int.TryParse(directorId, out var dbDirId))
        {
            try
            {
                return await _repo.RemoveShareHolderAsync(dbDirId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB remove failed for vendor director {DirId}, falling back", directorId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<object> GetRegistrationAccreditationsAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var accreditations = await _repo.GetAccreditationsByVendorIdAsync(dbId);
                return accreditations.Select(a => new Dictionary<string, object?>
                {
                    ["id"] = a.VendorProfBodyId,
                    ["vendorId"] = a.VendorId,
                    ["professionalBodyId"] = a.ProfessionalBodyId,
                    ["registrationNumber"] = a.RegistrationNumber,
                    ["contractorGrading"] = a.ContractorGrading,
                    ["accreditationExpiryDate"] = a.AccreditationExpiryDate?.ToString("o"),
                    ["accreditationGrade"] = a.AccreditationGrade
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor accreditations {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    public async Task<object> ImportFromCsdAsync(string registrationNumber)
    {
        _logger.LogInformation("Importing CSD data for {RegNum}", registrationNumber);
        return new { RegistrationNumber = registrationNumber, Status = "Imported", ImportedDate = DateTime.UtcNow };
    }

    public async Task<object> GetRegistrationStatusAsync(string id)
    {
        if (UseDb && int.TryParse(id, out var dbId))
        {
            try
            {
                var entity = await _repo.GetRegistrationByIdAsync(dbId);
                if (entity != null)
                {
                    return new
                    {
                        Id = entity.VendorRegistrationId,
                        Status = entity.Status == true ? "approved" : (entity.Approved == false ? "rejected" : "draft"),
                        Enabled = entity.Enabled
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor status {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_registrations.ContainsKey(id)) return new { Status = "NotFound" };
        return new { Status = _registrations[id].GetValueOrDefault("status", "draft"), Id = id };
    }

    private static Dictionary<string, object?> MapRegistrationToListItem(VendorRegistration r)
    {
        return new Dictionary<string, object?>
        {
            ["id"] = r.VendorRegistrationId.ToString(),
            ["name"] = r.CompanyName,
            ["tradingName"] = r.TradingName,
            ["registrationNumber"] = r.CiproCompanyNo ?? r.ServiceProviderNumber,
            ["registrationType"] = r.RegistrationTypeId?.ToString(),
            ["contactPerson"] = r.ContactName ?? r.ContractPerson,
            ["email"] = r.EmailAddress ?? r.Email,
            ["phone"] = r.TelephoneNumber ?? r.CellphoneNumber,
            ["vatNumber"] = r.VatRegistrationNo,
            ["status"] = r.Status == true ? "approved" : (r.Approved == false ? "rejected" : "draft"),
            ["registrationSource"] = "manual",
            ["capturedByName"] = "System",
            ["capturedDate"] = r.DateCaptured.ToString("o"),
            ["createdDate"] = r.DateCaptured.ToString("o"),
            ["bbbeeLevel"] = r.BbbeeContributorId?.ToString(),
            ["supplierId"] = r.VendorRegistrationId.ToString(),
            ["province"] = r.ProvinceId?.ToString(),
            ["vendorNumber"] = r.VendorNumber
        };
    }

    private static object MapRegistrationToResponse(VendorRegistration r)
    {
        return new Dictionary<string, object?>
        {
            ["registration"] = new Dictionary<string, object?>
            {
                ["id"] = r.VendorRegistrationId.ToString(),
                ["status"] = r.Status == true ? "approved" : (r.Approved == false ? "rejected" : "draft"),
                ["registrationSource"] = "manual",
                ["capturedByName"] = "System",
                ["capturedDate"] = r.DateCaptured.ToString("o"),
                ["createdDate"] = r.DateCaptured.ToString("o"),
                ["wizard"] = new Dictionary<string, object> { ["currentStep"] = 1 }
            },
            ["supplier"] = new Dictionary<string, object?>
            {
                ["id"] = r.VendorRegistrationId.ToString(),
                ["name"] = r.CompanyName,
                ["tradingName"] = r.TradingName,
                ["registrationNumber"] = r.CiproCompanyNo ?? r.ServiceProviderNumber,
                ["registrationType"] = r.RegistrationTypeId?.ToString(),
                ["contactPerson"] = r.ContactName ?? r.ContractPerson,
                ["email"] = r.EmailAddress ?? r.Email,
                ["phone"] = r.TelephoneNumber ?? r.CellphoneNumber,
                ["vatNumber"] = r.VatRegistrationNo,
                ["bbbeeLevel"] = r.BbbeeContributorId?.ToString(),
                ["postalAddress"] = r.PostalAddress,
                ["physicalAddress"] = r.PhysicalAddress,
                ["faxNumber"] = r.FaxNumber,
                ["website"] = r.WebsiteAddress,
                ["vendorNumber"] = r.VendorNumber
            }
        };
    }

    private static Dictionary<string, object> ConvertToDict(object dto)
    {
        if (dto is Dictionary<string, object> dict) return dict;
        if (dto is JsonElement je) return ConvertJsonElement(je);
        var json = JsonSerializer.Serialize(dto);
        var parsed = JsonSerializer.Deserialize<JsonElement>(json);
        return ConvertJsonElement(parsed);
    }

    private static Dictionary<string, object> ConvertJsonElement(JsonElement el)
    {
        var dict = new Dictionary<string, object>();
        if (el.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in el.EnumerateObject())
            {
                dict[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString()!,
                    JsonValueKind.Number => prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null!,
                    _ => prop.Value.ToString()
                };
            }
        }
        return dict;
    }

    private static string? GetStr(Dictionary<string, object> d, string key) =>
        d.TryGetValue(key, out var v) ? v?.ToString() : null;

    private static int GetInt(Dictionary<string, object> d, string key)
    {
        if (!d.TryGetValue(key, out var v)) return 0;
        if (v is int i) return i;
        if (v is decimal dec) return (int)dec;
        if (int.TryParse(v?.ToString(), out var parsed)) return parsed;
        return 0;
    }

    private static decimal? GetDecimal(Dictionary<string, object> d, string key)
    {
        if (!d.TryGetValue(key, out var v)) return null;
        if (v is decimal dec) return dec;
        if (decimal.TryParse(v?.ToString(), out var parsed)) return parsed;
        return null;
    }

    private static bool? GetBool(Dictionary<string, object> d, string key)
    {
        if (!d.TryGetValue(key, out var v)) return null;
        if (v is bool b) return b;
        if (bool.TryParse(v?.ToString(), out var parsed)) return parsed;
        return null;
    }
}
