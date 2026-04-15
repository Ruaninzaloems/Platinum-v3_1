using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public ProjectsController(BudgetDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? departmentId, [FromQuery] string? type, [FromQuery] string? status)
    {
        var query = _db.Projects
            .Include(p => p.Department)
            .Include(p => p.BudgetStrings)
            .Include(p => p.ProjectBudgetLines)
            .AsQueryable();

        if (departmentId.HasValue) query = query.Where(p => p.DepartmentId == departmentId.Value);
        if (Enum.TryParse<ProjectType>(type, true, out var pt)) query = query.Where(p => p.Type == pt);
        if (Enum.TryParse<ProjectStatus>(status, true, out var ps)) query = query.Where(p => p.Status == ps);

        var projects = await query.OrderBy(p => p.ProjectCode).ToListAsync();

        var result = projects.Select(p => MapToDto(p, false)).ToList();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Projects
            .Include(p => p.Department)
            .Include(p => p.BudgetStrings)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaItem)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaFund)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaFunction)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaRegion)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaCosting)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.Department)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return NotFound();
        return Ok(MapToDto(p, true));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
    {
        var project = new Project
        {
            ProjectCode = dto.ProjectCode,
            ProjectName = dto.ProjectName,
            Description = dto.Description,
            IdpLink = dto.IdpLink,
            IdpPriorityArea = dto.IdpPriorityArea,
            IdpStrategicObjective = dto.IdpStrategicObjective,
            Type = (ProjectType)dto.Type,
            DepartmentId = dto.DepartmentId,
            Ward = dto.Ward,
            GpsCoordinates = dto.GpsCoordinates,
            ProjectManager = dto.ProjectManager,
            ContractorName = dto.ContractorName,
            ContractNumber = dto.ContractNumber,
            FundingSource = dto.FundingSource,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalProjectCost = dto.TotalProjectCost,
            CreatedBy = "system"
        };

        if (dto.BudgetLines?.Any() == true)
        {
            foreach (var bl in dto.BudgetLines)
            {
                project.ProjectBudgetLines.Add(new ProjectBudgetLine
                {
                    ScoaItemId = bl.ScoaItemId,
                    ScoaFundId = bl.ScoaFundId,
                    ScoaFunctionId = bl.ScoaFunctionId,
                    ScoaRegionId = bl.ScoaRegionId,
                    ScoaCostingId = bl.ScoaCostingId,
                    DepartmentId = bl.DepartmentId,
                    Year1Amount = bl.Year1Amount,
                    Year2Amount = bl.Year2Amount,
                    Year3Amount = bl.Year3Amount,
                    Month01 = bl.Month01, Month02 = bl.Month02, Month03 = bl.Month03,
                    Month04 = bl.Month04, Month05 = bl.Month05, Month06 = bl.Month06,
                    Month07 = bl.Month07, Month08 = bl.Month08, Month09 = bl.Month09,
                    Month10 = bl.Month10, Month11 = bl.Month11, Month12 = bl.Month12,
                    CreatedBy = "system"
                });
            }
        }

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        var created = await _db.Projects
            .Include(p => p.Department)
            .Include(p => p.BudgetStrings)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaItem)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaFund)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaFunction)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaRegion)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.ScoaCosting)
            .Include(p => p.ProjectBudgetLines).ThenInclude(l => l.Department)
            .FirstAsync(p => p.Id == project.Id);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, MapToDto(created, true));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectDto dto)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null) return NotFound();

        if (dto.ProjectName != null) project.ProjectName = dto.ProjectName;
        if (dto.Description != null) project.Description = dto.Description;
        if (dto.IdpLink != null) project.IdpLink = dto.IdpLink;
        if (dto.IdpPriorityArea != null) project.IdpPriorityArea = dto.IdpPriorityArea;
        if (dto.IdpStrategicObjective != null) project.IdpStrategicObjective = dto.IdpStrategicObjective;
        if (dto.Status.HasValue) project.Status = (ProjectStatus)dto.Status.Value;
        if (dto.Type.HasValue) project.Type = (ProjectType)dto.Type.Value;
        if (dto.DepartmentId.HasValue) project.DepartmentId = dto.DepartmentId;
        if (dto.Ward != null) project.Ward = dto.Ward;
        if (dto.GpsCoordinates != null) project.GpsCoordinates = dto.GpsCoordinates;
        if (dto.ProjectManager != null) project.ProjectManager = dto.ProjectManager;
        if (dto.ContractorName != null) project.ContractorName = dto.ContractorName;
        if (dto.ContractNumber != null) project.ContractNumber = dto.ContractNumber;
        if (dto.FundingSource != null) project.FundingSource = dto.FundingSource;
        if (dto.StartDate.HasValue) project.StartDate = dto.StartDate;
        if (dto.EndDate.HasValue) project.EndDate = dto.EndDate;
        if (dto.TotalProjectCost.HasValue) project.TotalProjectCost = dto.TotalProjectCost;
        if (dto.IsRegistered.HasValue) project.IsRegistered = dto.IsRegistered.Value;
        project.ModifiedOn = DateTime.UtcNow;
        project.ModifiedBy = "system";
        await _db.SaveChangesAsync();

        var updated = await _db.Projects
            .Include(p => p.Department)
            .Include(p => p.BudgetStrings)
            .Include(p => p.ProjectBudgetLines)
            .FirstAsync(p => p.Id == id);

        return Ok(MapToDto(updated, false));
    }

    [HttpGet("{id}/budget-lines")]
    public async Task<IActionResult> GetBudgetLines(int id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null) return NotFound();

        var lines = await _db.ProjectBudgetLines
            .Include(l => l.ScoaItem)
            .Include(l => l.ScoaFund)
            .Include(l => l.ScoaFunction)
            .Include(l => l.ScoaRegion)
            .Include(l => l.ScoaCosting)
            .Include(l => l.Department)
            .Where(l => l.ProjectId == id)
            .OrderBy(l => l.Id)
            .ToListAsync();

        return Ok(lines.Select(MapLineToDto).ToList());
    }

    [HttpPost("{id}/budget-lines")]
    public async Task<IActionResult> AddBudgetLine(int id, [FromBody] CreateProjectBudgetLineDto dto)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project == null) return NotFound();

        var line = new ProjectBudgetLine
        {
            ProjectId = id,
            ScoaItemId = dto.ScoaItemId,
            ScoaFundId = dto.ScoaFundId,
            ScoaFunctionId = dto.ScoaFunctionId,
            ScoaRegionId = dto.ScoaRegionId,
            ScoaCostingId = dto.ScoaCostingId,
            DepartmentId = dto.DepartmentId,
            Year1Amount = dto.Year1Amount,
            Year2Amount = dto.Year2Amount,
            Year3Amount = dto.Year3Amount,
            Month01 = dto.Month01, Month02 = dto.Month02, Month03 = dto.Month03,
            Month04 = dto.Month04, Month05 = dto.Month05, Month06 = dto.Month06,
            Month07 = dto.Month07, Month08 = dto.Month08, Month09 = dto.Month09,
            Month10 = dto.Month10, Month11 = dto.Month11, Month12 = dto.Month12,
            CreatedBy = "system"
        };

        _db.ProjectBudgetLines.Add(line);
        await _db.SaveChangesAsync();

        var saved = await _db.ProjectBudgetLines
            .Include(l => l.ScoaItem).Include(l => l.ScoaFund)
            .Include(l => l.ScoaFunction).Include(l => l.ScoaRegion)
            .Include(l => l.ScoaCosting).Include(l => l.Department)
            .FirstAsync(l => l.Id == line.Id);

        return CreatedAtAction(nameof(GetBudgetLines), new { id }, MapLineToDto(saved));
    }

    [HttpPut("{projectId}/budget-lines/{lineId}")]
    public async Task<IActionResult> UpdateBudgetLine(int projectId, int lineId, [FromBody] UpdateProjectBudgetLineDto dto)
    {
        var line = await _db.ProjectBudgetLines.FirstOrDefaultAsync(l => l.Id == lineId && l.ProjectId == projectId);
        if (line == null) return NotFound();

        line.ScoaItemId = dto.ScoaItemId;
        line.ScoaFundId = dto.ScoaFundId;
        line.ScoaFunctionId = dto.ScoaFunctionId;
        line.ScoaRegionId = dto.ScoaRegionId;
        line.ScoaCostingId = dto.ScoaCostingId;
        line.DepartmentId = dto.DepartmentId;
        line.Year1Amount = dto.Year1Amount;
        line.Year2Amount = dto.Year2Amount;
        line.Year3Amount = dto.Year3Amount;
        line.Month01 = dto.Month01; line.Month02 = dto.Month02; line.Month03 = dto.Month03;
        line.Month04 = dto.Month04; line.Month05 = dto.Month05; line.Month06 = dto.Month06;
        line.Month07 = dto.Month07; line.Month08 = dto.Month08; line.Month09 = dto.Month09;
        line.Month10 = dto.Month10; line.Month11 = dto.Month11; line.Month12 = dto.Month12;
        line.ModifiedOn = DateTime.UtcNow;
        line.ModifiedBy = "system";

        await _db.SaveChangesAsync();
        return Ok(MapLineToDto(line));
    }

    [HttpDelete("{projectId}/budget-lines/{lineId}")]
    public async Task<IActionResult> DeleteBudgetLine(int projectId, int lineId)
    {
        var line = await _db.ProjectBudgetLines.FirstOrDefaultAsync(l => l.Id == lineId && l.ProjectId == projectId);
        if (line == null) return NotFound();

        _db.ProjectBudgetLines.Remove(line);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/budget-lines/batch")]
    public async Task<IActionResult> BatchUpdateBudgetLines(int id, [FromBody] List<UpdateProjectBudgetLineDto> dtos)
    {
        var project = await _db.Projects.Include(p => p.ProjectBudgetLines).FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return NotFound();

        if (dtos.Count == 0 && project.ProjectBudgetLines.Count > 0)
            return BadRequest(new { error = "Cannot send empty list when project has existing budget lines. Use DELETE endpoints to remove individual lines." });

        var existingIds = project.ProjectBudgetLines.Select(l => l.Id).ToHashSet();
        var incomingIds = dtos.Where(d => d.Id.HasValue).Select(d => d.Id!.Value).ToHashSet();
        var toRemove = project.ProjectBudgetLines.Where(l => !incomingIds.Contains(l.Id)).ToList();
        foreach (var r in toRemove)
            _db.ProjectBudgetLines.Remove(r);

        foreach (var dto in dtos)
        {
            if (dto.Id.HasValue && existingIds.Contains(dto.Id.Value))
            {
                var existing = project.ProjectBudgetLines.First(l => l.Id == dto.Id.Value);
                existing.ScoaItemId = dto.ScoaItemId;
                existing.ScoaFundId = dto.ScoaFundId;
                existing.ScoaFunctionId = dto.ScoaFunctionId;
                existing.ScoaRegionId = dto.ScoaRegionId;
                existing.ScoaCostingId = dto.ScoaCostingId;
                existing.DepartmentId = dto.DepartmentId;
                existing.Year1Amount = dto.Year1Amount;
                existing.Year2Amount = dto.Year2Amount;
                existing.Year3Amount = dto.Year3Amount;
                existing.Month01 = dto.Month01; existing.Month02 = dto.Month02; existing.Month03 = dto.Month03;
                existing.Month04 = dto.Month04; existing.Month05 = dto.Month05; existing.Month06 = dto.Month06;
                existing.Month07 = dto.Month07; existing.Month08 = dto.Month08; existing.Month09 = dto.Month09;
                existing.Month10 = dto.Month10; existing.Month11 = dto.Month11; existing.Month12 = dto.Month12;
                existing.ModifiedOn = DateTime.UtcNow;
                existing.ModifiedBy = "system";
            }
            else
            {
                _db.ProjectBudgetLines.Add(new ProjectBudgetLine
                {
                    ProjectId = id,
                    ScoaItemId = dto.ScoaItemId,
                    ScoaFundId = dto.ScoaFundId,
                    ScoaFunctionId = dto.ScoaFunctionId,
                    ScoaRegionId = dto.ScoaRegionId,
                    ScoaCostingId = dto.ScoaCostingId,
                    DepartmentId = dto.DepartmentId,
                    Year1Amount = dto.Year1Amount,
                    Year2Amount = dto.Year2Amount,
                    Year3Amount = dto.Year3Amount,
                    Month01 = dto.Month01, Month02 = dto.Month02, Month03 = dto.Month03,
                    Month04 = dto.Month04, Month05 = dto.Month05, Month06 = dto.Month06,
                    Month07 = dto.Month07, Month08 = dto.Month08, Month09 = dto.Month09,
                    Month10 = dto.Month10, Month11 = dto.Month11, Month12 = dto.Month12,
                    CreatedBy = "system"
                });
            }
        }

        await _db.SaveChangesAsync();

        var refreshed = await _db.ProjectBudgetLines
            .Include(l => l.ScoaItem).Include(l => l.ScoaFund)
            .Include(l => l.ScoaFunction).Include(l => l.ScoaRegion)
            .Include(l => l.ScoaCosting).Include(l => l.Department)
            .Where(l => l.ProjectId == id)
            .OrderBy(l => l.Id)
            .ToListAsync();

        return Ok(refreshed.Select(MapLineToDto).ToList());
    }

    private static ProjectDto MapToDto(Project p, bool includeLines)
    {
        var scoaLineTotal = p.ProjectBudgetLines?.Sum(l => l.Year1Amount) ?? 0;
        var scoaLineTotal2 = p.ProjectBudgetLines?.Sum(l => l.Year2Amount) ?? 0;
        var scoaLineTotal3 = p.ProjectBudgetLines?.Sum(l => l.Year3Amount) ?? 0;
        var budgetStringTotal1 = p.BudgetStrings?.Sum(s => s.Year1Amount) ?? 0;
        var budgetStringTotal2 = p.BudgetStrings?.Sum(s => s.Year2Amount) ?? 0;
        var budgetStringTotal3 = p.BudgetStrings?.Sum(s => s.Year3Amount) ?? 0;

        return new ProjectDto(
            p.Id, p.ProjectCode, p.ProjectName, p.Description, p.IdpLink,
            p.IdpPriorityArea, p.IdpStrategicObjective,
            p.Status.ToString(), p.Type.ToString(),
            p.DepartmentId, p.Department?.Name, p.Ward,
            p.GpsCoordinates, p.ProjectManager, p.ContractorName, p.ContractNumber,
            p.FundingSource, p.StartDate, p.EndDate, p.TotalProjectCost,
            budgetStringTotal1 + scoaLineTotal,
            budgetStringTotal2 + scoaLineTotal2,
            budgetStringTotal3 + scoaLineTotal3,
            p.BudgetStrings?.Count ?? 0,
            p.ProjectBudgetLines?.Count ?? 0,
            p.CreatedOn,
            includeLines ? p.ProjectBudgetLines?.Select(MapLineToDto).ToList() : null,
            p.IsRegistered
        );
    }

    private static ProjectBudgetLineDto MapLineToDto(ProjectBudgetLine l) => new(
        l.Id, l.ProjectId,
        l.ScoaItemId, l.ScoaItem?.Code, l.ScoaItem?.Description,
        l.ScoaFundId, l.ScoaFund?.Code, l.ScoaFund?.Description,
        l.ScoaFunctionId, l.ScoaFunction?.Code, l.ScoaFunction?.Description,
        l.ScoaRegionId, l.ScoaRegion?.Code, l.ScoaRegion?.Description,
        l.ScoaCostingId, l.ScoaCosting?.Code, l.ScoaCosting?.Description,
        l.DepartmentId, l.Department?.Name,
        l.Year1Amount, l.Year2Amount, l.Year3Amount,
        l.Month01, l.Month02, l.Month03, l.Month04,
        l.Month05, l.Month06, l.Month07, l.Month08,
        l.Month09, l.Month10, l.Month11, l.Month12
    );
}
