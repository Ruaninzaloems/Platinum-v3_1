using AutoMapper;
using ClosedXML.Excel;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Repositories.Interfaces;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

public class PositionApprovalService : IPositionApprovalService
{
    private readonly IPositionApprovalRepository _repo;
    private readonly IPlatinumIntegrationService _platinum;
    private readonly IMapper _mapper;
    private readonly DevUserDirectory _userDirectory;
    private readonly ILogger<PositionApprovalService> _logger;

    public PositionApprovalService(
        IPositionApprovalRepository repo,
        IPlatinumIntegrationService platinum,
        IMapper mapper,
        DevUserDirectory userDirectory,
        ILogger<PositionApprovalService> logger)
    {
        _repo = repo;
        _platinum = platinum;
        _mapper = mapper;
        _userDirectory = userDirectory;
        _logger = logger;
    }

    public async Task<PositionApprovalConfigDto> GetByPositionIdAsync(string positionId, CancellationToken ct = default)
    {
        var existing = await _repo.GetByPositionIdAsync(positionId, ct);
        if (existing is not null) return _mapper.Map<PositionApprovalConfigDto>(existing);

        var pos = await _platinum.GetPositionAsync(positionId, ct)
            ?? throw new KeyNotFoundException($"Position '{positionId}' not found in Platinum integration.");

        return new PositionApprovalConfigDto
        {
            Id = Guid.Empty,
            PositionId = pos.Id,
            PositionDescription = pos.Description,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<PositionApprovalConfigDto> UpsertAsync(string positionId, UpdatePositionApprovalConfigRequest request, string? updatedBy, CancellationToken ct = default)
    {
        foreach (var rr in request.ReportingRelationships)
        {
            if (rr.EndDate is not null && rr.EndDate < rr.StartDate)
                throw new ArgumentException("Reporting relationship End Date cannot be before Start Date.");
        }
        foreach (var aa in request.ActingAppointments)
        {
            if (aa.EndDate < aa.StartDate)
                throw new ArgumentException("Acting appointment End Date cannot be before Start Date.");
        }

        var pos = await _platinum.GetPositionAsync(positionId, ct)
            ?? throw new KeyNotFoundException($"Position '{positionId}' not found in Platinum integration.");

        var domain = new PositionApprovalConfig
        {
            PositionId = pos.Id,
            PositionDescription = pos.Description,
            IsOvertimeRecommender = request.IsOvertimeRecommender,
            IsOvertimeApprover = request.IsOvertimeApprover,
            IsDepartmentExcessOvertimeApprover = request.IsDepartmentExcessOvertimeApprover,
            UpdatedBy = updatedBy,
            ReportingRelationships = request.ReportingRelationships
                .Select(r => new PositionReportingRelationship
                {
                    ReportsToPositionId = r.ReportsToPositionId,
                    ReportsToPositionDescription = r.ReportsToPositionDescription,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate
                }).ToList(),
            ActingAppointments = request.ActingAppointments
                .Select(a => new TemporaryActingAppointment
                {
                    ActingEmployeeId = a.ActingEmployeeId,
                    ActingEmployeeName = a.ActingEmployeeName,
                    ActingInPositionId = a.ActingInPositionId,
                    ActingInPositionDescription = a.ActingInPositionDescription,
                    StartDate = a.StartDate,
                    EndDate = a.EndDate
                }).ToList()
        };

        var saved = await _repo.UpsertAsync(domain, ct);
        _logger.LogInformation("Position approval config saved for {PositionId} by {UpdatedBy}", positionId, updatedBy ?? "anonymous");

        _userDirectory.Invalidate();
        return _mapper.Map<PositionApprovalConfigDto>(saved);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Import: Template generation
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<byte[]> GenerateImportTemplateAsync(CancellationToken ct = default)
    {
        var positions = await _platinum.GetPositionsAsync(null, ct);

        using var wb = new XLWorkbook();

        // ── Sheet 1: Position Config ──────────────────────────────────────────
        var wsConfig = wb.Worksheets.Add("Position Config");
        var configHeaders = new[] { "PositionId", "Description", "IsRecommender (Y/N)", "IsApprover (Y/N)", "IsDeptExcessApprover (Y/N)" };
        for (var i = 0; i < configHeaders.Length; i++)
        {
            var cell = wsConfig.Cell(1, i + 1);
            cell.Value = configHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
        }

        // Row 2: guidance note (not imported — parser starts at row 3).
        wsConfig.Cell(2, 1).Value = "↑ Do not edit column headers or this note row. Valid flags: Y = Yes  |  N or blank = No";
        wsConfig.Cell(2, 1).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFF3CD");
        wsConfig.Cell(2, 1).Style.Font.Italic = true;
        wsConfig.Row(2).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFF3CD");
        wsConfig.Row(2).Style.Font.Italic = true;

        var row = 3;
        foreach (var pos in positions)
        {
            wsConfig.Cell(row, 1).Value = pos.Id;
            wsConfig.Cell(row, 2).Value = pos.Description;
            wsConfig.Cell(row, 2).Style.Protection.Locked = true;
            wsConfig.Cell(row, 3).Value = "N";
            wsConfig.Cell(row, 4).Value = "N";
            wsConfig.Cell(row, 5).Value = "N";
            row++;
        }

        wsConfig.Column(1).Width = 18;
        wsConfig.Column(2).Width = 50;
        wsConfig.Column(3).Width = 22;
        wsConfig.Column(4).Width = 18;
        wsConfig.Column(5).Width = 25;
        wsConfig.SheetView.FreezeRows(2);

        // ── Sheet 2: Reporting Relationships ────────────────────────────────
        var wsRelat = wb.Worksheets.Add("Reporting Relationships");
        var relatHeaders = new[] { "PositionId", "ReportsToPositionId", "StartDate (dd/MM/yyyy)", "EndDate (dd/MM/yyyy or blank)" };
        for (var i = 0; i < relatHeaders.Length; i++)
        {
            var cell = wsRelat.Cell(1, i + 1);
            cell.Value = relatHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
        }

        // Row 2: guidance note for reporting relationships.
        wsRelat.Cell(2, 1).Value = "↑ Note: PositionId and ReportsToPositionId must be valid positions. Dates must be in dd/MM/yyyy format. EndDate may be left blank.";
        wsRelat.Row(2).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFF3CD");
        wsRelat.Row(2).Style.Font.Italic = true;

        wsRelat.Column(1).Width = 18;
        wsRelat.Column(2).Width = 22;
        wsRelat.Column(3).Width = 25;
        wsRelat.Column(4).Width = 30;
        wsRelat.SheetView.FreezeRows(2);

        // ── Sheet 3: Acting Appointments ────────────────────────────────────
        var wsActing = wb.Worksheets.Add("Acting Appointments");
        var actingHeaders = new[] { "ActingEmployeeId", "ActingInPositionId", "StartDate (dd/MM/yyyy)", "EndDate (dd/MM/yyyy)" };
        for (var i = 0; i < actingHeaders.Length; i++)
        {
            var cell = wsActing.Cell(1, i + 1);
            cell.Value = actingHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
        }

        // Row 2: guidance note for acting appointments.
        wsActing.Cell(2, 1).Value = "↑ Note: ActingEmployeeId must be a valid employee. ActingInPositionId must be a valid position. Both dates required in dd/MM/yyyy format. EndDate must be ≥ StartDate.";
        wsActing.Row(2).Style.Fill.BackgroundColor = XLColor.FromHtml("#FFF3CD");
        wsActing.Row(2).Style.Font.Italic = true;

        wsActing.Column(1).Width = 20;
        wsActing.Column(2).Width = 22;
        wsActing.Column(3).Width = 25;
        wsActing.Column(4).Width = 25;
        wsActing.SheetView.FreezeRows(2);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Report: Position Relationships Export
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<byte[]> GenerateReportAsync(CancellationToken ct = default)
    {
        // ── Data loading ─────────────────────────────────────────────────────
        var configs   = await _repo.GetAllAsync(ct);
        var positions = await _platinum.GetPositionsAsync(null, ct);
        var employees = await _platinum.GetEmployeesAsync(null, ct);

        // O(1) enrichment maps
        var posById   = positions.ToDictionary(p => p.Id, StringComparer.OrdinalIgnoreCase);
        // employee keyed by the position they occupy → gives us division info
        var empByPosId = employees
            .Where(e => !string.IsNullOrWhiteSpace(e.PositionId))
            .GroupBy(e => e.PositionId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        // Set of all position IDs that have at least one acting appointment
        // recorded against them (used for the Temporary Acting Appointment Y/N column).
        var actingPositionIds = new HashSet<string>(
            configs.SelectMany(c => c.ActingAppointments)
                   .Select(a => a.ActingInPositionId),
            StringComparer.OrdinalIgnoreCase);

        // ── Workbook ─────────────────────────────────────────────────────────
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Position Relationships");

        var headers = new[]
        {
            "Configured Position ID",
            "Configured Position Description",
            "Occupying Employee",
            "Department",
            "Division",
            "Overtime Recommender (Y/N)",
            "Overtime Approver (Y/N)",
            "Dept Excess Approver (Y/N)",
            "Applies-To Position ID",
            "Applies-To Position Description",
            "Applies-To Employee",
            "Applies-To Department",
            "Applies-To Division",
            "Start Date",
            "End Date",
            "Temporary Acting Appointment (Y/N)"
        };

        // Header row styling
        for (var col = 0; col < headers.Length; col++)
        {
            var cell = ws.Cell(1, col + 1);
            cell.Value = headers[col];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D9E1F2");
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            cell.Style.Alignment.WrapText = true;
        }
        ws.SheetView.FreezeRows(1);
        ws.Row(1).Height = 36;

        var rowNum = 2;
        // Sort configs deterministically by position ID for a stable output
        foreach (var cfg in configs.OrderBy(c => c.PositionId))
        {
            // Configured-position enrichment
            posById.TryGetValue(cfg.PositionId, out var cfgPos);
            empByPosId.TryGetValue(cfg.PositionId, out var cfgEmp);

            var cfgEmployee = cfgEmp is not null
                ? $"{cfgEmp.FullName} ({cfgEmp.EmployeeNumber})"
                : string.Empty;
            var cfgDept     = cfgPos?.DepartmentName ?? string.Empty;
            var cfgDiv      = cfgEmp?.DivisionName ?? string.Empty;

            var isRec  = cfg.IsOvertimeRecommender                ? "Y" : "N";
            var isApp  = cfg.IsOvertimeApprover                   ? "Y" : "N";
            var isExc  = cfg.IsDepartmentExcessOvertimeApprover   ? "Y" : "N";

            if (cfg.ReportingRelationships.Count == 0)
            {
                // One row, blank applies-to columns
                WriteReportRow(ws, rowNum++,
                    cfg.PositionId, cfg.PositionDescription, cfgEmployee, cfgDept, cfgDiv,
                    isRec, isApp, isExc,
                    "", "", "", "", "", "", "", "");
            }
            else
            {
                foreach (var rel in cfg.ReportingRelationships.OrderBy(r => r.StartDate))
                {
                    // Applies-to position enrichment
                    posById.TryGetValue(rel.ReportsToPositionId, out var appPos);
                    empByPosId.TryGetValue(rel.ReportsToPositionId, out var appEmp);

                    var appEmployee = appEmp is not null
                        ? $"{appEmp.FullName} ({appEmp.EmployeeNumber})"
                        : string.Empty;
                    var appDept = appPos?.DepartmentName ?? string.Empty;
                    var appDiv  = appEmp?.DivisionName   ?? string.Empty;

                    var startStr = rel.StartDate == default ? "" : rel.StartDate.ToString("dd/MM/yyyy");
                    var endStr   = rel.EndDate.HasValue
                        ? rel.EndDate.Value.Year == 9999 ? "" : rel.EndDate.Value.ToString("dd/MM/yyyy")
                        : "";
                    var acting   = actingPositionIds.Contains(rel.ReportsToPositionId) ? "Y" : "N";

                    WriteReportRow(ws, rowNum++,
                        cfg.PositionId, cfg.PositionDescription, cfgEmployee, cfgDept, cfgDiv,
                        isRec, isApp, isExc,
                        rel.ReportsToPositionId,
                        rel.ReportsToPositionDescription,
                        appEmployee, appDept, appDiv,
                        startStr, endStr, acting);
                }
            }
        }

        // Auto-fit all columns to their content, capped at 50 characters wide
        ws.Columns().AdjustToContents();
        for (var col = 1; col <= headers.Length; col++)
        {
            if (ws.Column(col).Width > 50)
                ws.Column(col).Width = 50;
        }

        // Centre the Y/N flag columns and date columns
        foreach (var col in new[] { 6, 7, 8, 14, 15, 16 })
        {
            var colRange = ws.Column(col).CellsUsed();
            foreach (var cell in colRange)
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    private static void WriteReportRow(IXLWorksheet ws, int row,
        string cfgId, string cfgDesc, string cfgEmp, string cfgDept, string cfgDiv,
        string isRec, string isApp, string isExc,
        string appId, string appDesc, string appEmp, string appDept, string appDiv,
        string startDate, string endDate, string acting)
    {
        ws.Cell(row, 1).Value  = cfgId;
        ws.Cell(row, 2).Value  = cfgDesc;
        ws.Cell(row, 3).Value  = cfgEmp;
        ws.Cell(row, 4).Value  = cfgDept;
        ws.Cell(row, 5).Value  = cfgDiv;
        ws.Cell(row, 6).Value  = isRec;
        ws.Cell(row, 7).Value  = isApp;
        ws.Cell(row, 8).Value  = isExc;
        ws.Cell(row, 9).Value  = appId;
        ws.Cell(row, 10).Value = appDesc;
        ws.Cell(row, 11).Value = appEmp;
        ws.Cell(row, 12).Value = appDept;
        ws.Cell(row, 13).Value = appDiv;
        ws.Cell(row, 14).Value = startDate;
        ws.Cell(row, 15).Value = endDate;
        ws.Cell(row, 16).Value = acting;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Import: Validate without committing
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<ImportPositionApprovalValidationResultDto> ValidateImportAsync(Stream fileStream, CancellationToken ct = default)
    {
        var result = new ImportPositionApprovalValidationResultDto();

        // Pre-load lookup sets for validation.
        var allPositions = await _platinum.GetPositionsAsync(null, ct);
        var positionIds = new HashSet<string>(allPositions.Select(p => p.Id), StringComparer.OrdinalIgnoreCase);
        var positionDescriptions = allPositions.ToDictionary(p => p.Id, p => p.Description, StringComparer.OrdinalIgnoreCase);

        var allEmployees = await _platinum.GetEmployeesAsync(null, ct);
        var employeeIds = new HashSet<string>(allEmployees.Select(e => e.Id), StringComparer.OrdinalIgnoreCase);

        using var wb = new XLWorkbook(fileStream);

        // ── Sheet 1: Position Config ──────────────────────────────────────────
        if (wb.TryGetWorksheet("Position Config", out var wsConfig))
        {
            // Header validation: column 1 must be PositionId, column 3 IsRecommender flag.
            var h1Col1 = wsConfig.Cell(1, 1).GetString().Trim();
            var h1Col3 = wsConfig.Cell(1, 3).GetString().Trim();
            if (!h1Col1.Equals("PositionId", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Position Config", Row = 1, Error = $"Column A header must be 'PositionId' but found '{h1Col1}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }
            if (!h1Col3.Contains("Recommender", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Position Config", Row = 1, Error = $"Column C header should contain 'Recommender' but found '{h1Col3}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }

            // Data starts at row 3 (row 1 = headers, row 2 = guidance note).
            var lastRow = wsConfig.LastRowUsed()?.RowNumber() ?? 2;
            for (var rowNum = 3; rowNum <= lastRow; rowNum++)
            {
                var posId = wsConfig.Cell(rowNum, 1).GetString().Trim();
                if (string.IsNullOrWhiteSpace(posId)) continue;

                if (!positionIds.Contains(posId))
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Position Config", Row = rowNum, Error = $"Position ID '{posId}' not found." });
                    result.ErrorRows++;
                    continue;
                }

                var isRecRaw = wsConfig.Cell(rowNum, 3).GetString().Trim().ToUpperInvariant();
                var isAppRaw = wsConfig.Cell(rowNum, 4).GetString().Trim().ToUpperInvariant();
                var isDeptRaw = wsConfig.Cell(rowNum, 5).GetString().Trim().ToUpperInvariant();

                var validValues = new HashSet<string> { "Y", "N", "" };
                if (!validValues.Contains(isRecRaw) || !validValues.Contains(isAppRaw) || !validValues.Contains(isDeptRaw))
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Position Config", Row = rowNum, Error = $"Position '{posId}': IsRecommender/IsApprover/IsDeptExcessApprover must be Y, N, or blank." });
                    result.ErrorRows++;
                    continue;
                }

                result.PositionConfigChanges.Add(new PositionConfigChangeDto
                {
                    PositionId = posId,
                    Description = positionDescriptions.TryGetValue(posId, out var desc) ? desc : string.Empty,
                    IsRecommender = isRecRaw == "Y",
                    IsApprover = isAppRaw == "Y",
                    IsDeptExcessApprover = isDeptRaw == "Y"
                });
                result.AcceptedRows++;
            }
        }
        else
        {
            result.Errors.Add(new ImportRowErrorDto { Sheet = "Position Config", Row = 0, Error = "Sheet 'Position Config' not found in the uploaded file." });
        }

        // ── Sheet 2: Reporting Relationships ─────────────────────────────────
        if (wb.TryGetWorksheet("Reporting Relationships", out var wsRelat))
        {
            var h2Col1 = wsRelat.Cell(1, 1).GetString().Trim();
            var h2Col2 = wsRelat.Cell(1, 2).GetString().Trim();
            if (!h2Col1.Equals("PositionId", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Reporting Relationships", Row = 1, Error = $"Column A header must be 'PositionId' but found '{h2Col1}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }
            if (!h2Col2.Contains("ReportsTo", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Reporting Relationships", Row = 1, Error = $"Column B header should contain 'ReportsTo' but found '{h2Col2}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }

            // Data starts at row 3 (row 1 = headers, row 2 = guidance note).
            var lastRow = wsRelat.LastRowUsed()?.RowNumber() ?? 2;
            for (var rowNum = 3; rowNum <= lastRow; rowNum++)
            {
                var posId = wsRelat.Cell(rowNum, 1).GetString().Trim();
                var reportsTo = wsRelat.Cell(rowNum, 2).GetString().Trim();
                var startRaw = wsRelat.Cell(rowNum, 3).GetString().Trim();
                var endRaw = wsRelat.Cell(rowNum, 4).GetString().Trim();

                if (string.IsNullOrWhiteSpace(posId) && string.IsNullOrWhiteSpace(reportsTo)) continue;

                var rowErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(posId))
                    rowErrors.Add("PositionId is required.");
                else if (!positionIds.Contains(posId))
                    rowErrors.Add($"PositionId '{posId}' not found.");

                if (string.IsNullOrWhiteSpace(reportsTo))
                    rowErrors.Add("ReportsToPositionId is required.");
                else if (!positionIds.Contains(reportsTo))
                    rowErrors.Add($"ReportsToPositionId '{reportsTo}' not found.");

                DateTime startDate = default;
                if (!TryParseDate(startRaw, out startDate))
                    rowErrors.Add($"StartDate '{startRaw}' is not a valid date (expected dd/MM/yyyy).");

                DateTime? endDate = null;
                if (!string.IsNullOrWhiteSpace(endRaw))
                {
                    if (!TryParseDate(endRaw, out var parsedEnd))
                        rowErrors.Add($"EndDate '{endRaw}' is not a valid date (expected dd/MM/yyyy).");
                    else
                        endDate = parsedEnd;
                }

                if (rowErrors.Count > 0)
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Reporting Relationships", Row = rowNum, Error = string.Join("; ", rowErrors) });
                    result.ErrorRows++;
                    continue;
                }

                if (endDate.HasValue && endDate.Value < startDate)
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Reporting Relationships", Row = rowNum, Error = "EndDate cannot be before StartDate." });
                    result.ErrorRows++;
                    continue;
                }

                result.ReportingRelationshipChanges.Add(new ReportingRelationshipChangeDto
                {
                    PositionId = posId,
                    ReportsToPositionId = reportsTo,
                    StartDate = startDate,
                    EndDate = endDate
                });
                result.AcceptedRows++;
            }
        }
        else
        {
            result.Errors.Add(new ImportRowErrorDto { Sheet = "Reporting Relationships", Row = 0, Error = "Sheet 'Reporting Relationships' not found in the uploaded file." });
        }

        // ── Sheet 3: Acting Appointments ─────────────────────────────────────
        if (wb.TryGetWorksheet("Acting Appointments", out var wsActing))
        {
            var h3Col1 = wsActing.Cell(1, 1).GetString().Trim();
            var h3Col2 = wsActing.Cell(1, 2).GetString().Trim();
            if (!h3Col1.Contains("ActingEmployee", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Acting Appointments", Row = 1, Error = $"Column A header should contain 'ActingEmployee' but found '{h3Col1}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }
            if (!h3Col2.Contains("ActingIn", StringComparison.OrdinalIgnoreCase))
            {
                result.Errors.Add(new ImportRowErrorDto { Sheet = "Acting Appointments", Row = 1, Error = $"Column B header should contain 'ActingIn' but found '{h3Col2}'. Ensure you are using the correct import template." });
                result.ErrorRows++;
            }

            // Data starts at row 3 (row 1 = headers, row 2 = guidance note).
            var lastRow = wsActing.LastRowUsed()?.RowNumber() ?? 2;
            for (var rowNum = 3; rowNum <= lastRow; rowNum++)
            {
                var empId = wsActing.Cell(rowNum, 1).GetString().Trim();
                var posId = wsActing.Cell(rowNum, 2).GetString().Trim();
                var startRaw = wsActing.Cell(rowNum, 3).GetString().Trim();
                var endRaw = wsActing.Cell(rowNum, 4).GetString().Trim();

                if (string.IsNullOrWhiteSpace(empId) && string.IsNullOrWhiteSpace(posId)) continue;

                var rowErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(empId))
                    rowErrors.Add("ActingEmployeeId is required.");
                else if (!employeeIds.Contains(empId))
                    rowErrors.Add($"ActingEmployeeId '{empId}' not found.");

                if (string.IsNullOrWhiteSpace(posId))
                    rowErrors.Add("ActingInPositionId is required.");
                else if (!positionIds.Contains(posId))
                    rowErrors.Add($"ActingInPositionId '{posId}' not found.");

                DateTime startDate = default;
                if (!TryParseDate(startRaw, out startDate))
                    rowErrors.Add($"StartDate '{startRaw}' is not a valid date (expected dd/MM/yyyy).");

                DateTime endDate = default;
                if (string.IsNullOrWhiteSpace(endRaw))
                    rowErrors.Add("EndDate is required for acting appointments.");
                else if (!TryParseDate(endRaw, out endDate))
                    rowErrors.Add($"EndDate '{endRaw}' is not a valid date (expected dd/MM/yyyy).");

                if (rowErrors.Count > 0)
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Acting Appointments", Row = rowNum, Error = string.Join("; ", rowErrors) });
                    result.ErrorRows++;
                    continue;
                }

                if (endDate < startDate)
                {
                    result.Errors.Add(new ImportRowErrorDto { Sheet = "Acting Appointments", Row = rowNum, Error = "EndDate cannot be before StartDate." });
                    result.ErrorRows++;
                    continue;
                }

                result.ActingAppointmentChanges.Add(new ActingAppointmentChangeDto
                {
                    ActingEmployeeId = empId,
                    ActingInPositionId = posId,
                    StartDate = startDate,
                    EndDate = endDate
                });
                result.AcceptedRows++;
            }
        }
        else
        {
            result.Errors.Add(new ImportRowErrorDto { Sheet = "Acting Appointments", Row = 0, Error = "Sheet 'Acting Appointments' not found in the uploaded file." });
        }

        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Import: Confirm and commit
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<ImportPositionApprovalResultDto> ConfirmImportAsync(ConfirmPositionApprovalImportRequest request, string? updatedBy, CancellationToken ct = default)
    {
        // ── Server-side revalidation ──────────────────────────────────────────
        // Reload reference data so the confirm endpoint cannot be exploited by
        // a caller that bypasses the /import validate step.
        var allPositions = await _platinum.GetPositionsAsync(null, ct);
        var positionIds = new HashSet<string>(allPositions.Select(p => p.Id), StringComparer.OrdinalIgnoreCase);
        var positionDescs = allPositions.ToDictionary(p => p.Id, p => p.Description, StringComparer.OrdinalIgnoreCase);

        var allEmployees = await _platinum.GetEmployeesAsync(null, ct);
        var employeeIds = new HashSet<string>(allEmployees.Select(e => e.Id), StringComparer.OrdinalIgnoreCase);

        var validationErrors = new List<string>();

        foreach (var c in request.PositionConfigChanges)
        {
            if (!positionIds.Contains(c.PositionId))
                validationErrors.Add($"Position Config: PositionId '{c.PositionId}' is not a valid position.");
        }

        foreach (var r in request.ReportingRelationshipChanges)
        {
            if (!positionIds.Contains(r.PositionId))
                validationErrors.Add($"Reporting Relationships: PositionId '{r.PositionId}' is not a valid position.");
            if (!positionIds.Contains(r.ReportsToPositionId))
                validationErrors.Add($"Reporting Relationships: ReportsToPositionId '{r.ReportsToPositionId}' is not a valid position.");
            if (r.EndDate.HasValue && r.EndDate.Value < r.StartDate)
                validationErrors.Add($"Reporting Relationships: EndDate before StartDate for position '{r.PositionId}'.");
        }

        foreach (var a in request.ActingAppointmentChanges)
        {
            if (!employeeIds.Contains(a.ActingEmployeeId))
                validationErrors.Add($"Acting Appointments: ActingEmployeeId '{a.ActingEmployeeId}' is not a valid employee.");
            if (!positionIds.Contains(a.ActingInPositionId))
                validationErrors.Add($"Acting Appointments: ActingInPositionId '{a.ActingInPositionId}' is not a valid position.");
            if (a.EndDate < a.StartDate)
                validationErrors.Add($"Acting Appointments: EndDate before StartDate for employee '{a.ActingEmployeeId}'.");
        }

        if (validationErrors.Count > 0)
            throw new ArgumentException($"Confirm payload failed server-side validation ({validationErrors.Count} error(s)): {string.Join("; ", validationErrors.Take(5))}");

        // ── Build lookup structures ───────────────────────────────────────────
        var configChangeByPosition = request.PositionConfigChanges
            .ToDictionary(c => c.PositionId, StringComparer.OrdinalIgnoreCase);

        var reportingByPosition = request.ReportingRelationshipChanges
            .GroupBy(r => r.PositionId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

        var actingByPosition = request.ActingAppointmentChanges
            .GroupBy(a => a.ActingInPositionId, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

        // All position IDs touched by this import across all three sheets.
        var allAffectedPositionIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in request.PositionConfigChanges) allAffectedPositionIds.Add(c.PositionId);
        foreach (var r in request.ReportingRelationshipChanges) allAffectedPositionIds.Add(r.PositionId);
        foreach (var a in request.ActingAppointmentChanges) allAffectedPositionIds.Add(a.ActingInPositionId);

        // For positions where at least one of the three data categories is NOT
        // provided by the import, we must read the existing DB row to preserve it.
        var positionsNeedingDbLookup = allAffectedPositionIds
            .Where(id => !configChangeByPosition.ContainsKey(id)
                      || !reportingByPosition.ContainsKey(id)
                      || !actingByPosition.ContainsKey(id))
            .ToList();

        var existingByPosition = new Dictionary<string, PositionApprovalConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var posId in positionsNeedingDbLookup)
        {
            var dbRow = await _repo.GetByPositionIdAsync(posId, ct);
            if (dbRow is not null) existingByPosition[posId] = dbRow;
        }

        // ── Merge and build final domain configs ──────────────────────────────
        var domainByPosition = new Dictionary<string, PositionApprovalConfig>(StringComparer.OrdinalIgnoreCase);

        foreach (var posId in allAffectedPositionIds)
        {
            existingByPosition.TryGetValue(posId, out var existingDb);

            var desc = positionDescs.TryGetValue(posId, out var d)
                ? d
                : (existingDb?.PositionDescription ?? string.Empty);

            // Flags: from Sheet 1 if present, else preserve DB, else default false.
            var configChange = configChangeByPosition.GetValueOrDefault(posId);
            bool isRec  = configChange is not null ? configChange.IsRecommender    : existingDb?.IsOvertimeRecommender ?? false;
            bool isApp  = configChange is not null ? configChange.IsApprover       : existingDb?.IsOvertimeApprover ?? false;
            bool isDept = configChange is not null ? configChange.IsDeptExcessApprover : existingDb?.IsDepartmentExcessOvertimeApprover ?? false;

            // Reporting: from Sheet 2 if present, else preserve DB, else empty.
            List<PositionReportingRelationship> reporting;
            if (reportingByPosition.TryGetValue(posId, out var importRels))
            {
                reporting = importRels.Select(r => new PositionReportingRelationship
                {
                    ReportsToPositionId = r.ReportsToPositionId,
                    ReportsToPositionDescription = positionDescs.TryGetValue(r.ReportsToPositionId, out var rd) ? rd : string.Empty,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate
                }).ToList();
            }
            else
            {
                reporting = existingDb?.ReportingRelationships.ToList() ?? new List<PositionReportingRelationship>();
            }

            // Acting: from Sheet 3 if ActingInPositionId matches, else preserve DB, else empty.
            List<TemporaryActingAppointment> acting;
            if (actingByPosition.TryGetValue(posId, out var importActs))
            {
                acting = importActs.Select(a => new TemporaryActingAppointment
                {
                    ActingEmployeeId = a.ActingEmployeeId,
                    ActingEmployeeName = string.Empty,
                    ActingInPositionId = posId,
                    ActingInPositionDescription = desc,
                    StartDate = a.StartDate,
                    EndDate = a.EndDate
                }).ToList();
            }
            else
            {
                acting = existingDb?.ActingAppointments.ToList() ?? new List<TemporaryActingAppointment>();
            }

            domainByPosition[posId] = new PositionApprovalConfig
            {
                PositionId = posId,
                PositionDescription = desc,
                IsOvertimeRecommender = isRec,
                IsOvertimeApprover = isApp,
                IsDepartmentExcessOvertimeApprover = isDept,
                UpdatedBy = updatedBy,
                ReportingRelationships = reporting,
                ActingAppointments = acting
            };
        }

        // ── Commit all changes in one database transaction ────────────────────
        await _repo.BatchUpsertInTransactionAsync(domainByPosition.Values, ct);

        _userDirectory.Invalidate();

        var positionsUpdated = domainByPosition.Count;
        var reportingApplied = domainByPosition.Values.Sum(d => d.ReportingRelationships.Count);
        var actingApplied    = domainByPosition.Values.Sum(d => d.ActingAppointments.Count);

        _logger.LogInformation(
            "Import confirmed by {UpdatedBy}: {Positions} positions, {Reporting} reporting relationships, {Acting} acting appointments.",
            updatedBy ?? "anonymous", positionsUpdated, reportingApplied, actingApplied);

        return new ImportPositionApprovalResultDto
        {
            PositionsUpdated              = positionsUpdated,
            ReportingRelationshipsApplied = reportingApplied,
            ActingAppointmentsApplied     = actingApplied
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static bool TryParseDate(string raw, out DateTime result)
    {
        if (DateTime.TryParseExact(raw, new[] { "dd/MM/yyyy", "d/M/yyyy", "dd/M/yyyy", "d/MM/yyyy" },
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out result))
            return true;

        // Fallback: ClosedXML may expose numeric date serial or general format.
        if (DateTime.TryParse(raw, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None, out result))
            return true;

        return false;
    }
}
