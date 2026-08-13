using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
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

    // ──────────────────────────────────────────────────────────
    // GET /api/projects
    // ──────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? departmentId,
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? finYear,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 500)
    {
        var query = _db.Plan_Project.AsQueryable();

        // Filter by CapitalOperation using TypeValue from Const_PlanCapitalOperationalTypes_sys
        if (!string.IsNullOrEmpty(type) && int.TryParse(type, out var tVal))
            query = query.Where(p => p.CapitalOperation == tVal);

        // Filter by ProjectStatus using Const_Status Status_ID (4=Capture,5=Delete,23=Registered/IDP,24=Initiated)
        if (!string.IsNullOrEmpty(status) && int.TryParse(status, out var sId))
            query = query.Where(p => p.ProjectStatus == sId);

        // Filter by financial year when provided
        if (!string.IsNullOrEmpty(finYear))
            query = query.Where(p => p.FinYear == finYear);

        var projects = await query
            .Where(p => p.IsDeleted != true)
            .OrderBy(p => p.ProjectCode)
            .ThenBy(p => p.Project_ID)
            .ToListAsync();

        var projectIds = projects.Select(p => p.Project_ID).ToList();

        // Load budget items — filtered by finYear when provided to keep the response manageable
        var items = await _db.Plan_ProjectItem
            .Where(i => projectIds.Contains(i.ProjectID)
                     && (string.IsNullOrEmpty(finYear) || i.FinYear == finYear))
            .ToListAsync();

        // SCOA segment lookups — all data lives in the _Consolidated tables (flat structure tables are empty)
        var constProjItemIds   = items.Where(i => i.ProjectItemID.HasValue).Select(i => i.ProjectItemID!.Value).Distinct().ToList();
        var constProjItemsList = constProjItemIds.Any()
            ? await _db.Const_ProjectItem.Where(x => constProjItemIds.Contains(x.ProjectItem_ID)).ToListAsync()
            : new List<Const_ProjectItem>();
        var constProjItems = constProjItemsList.GroupBy(x => x.ProjectItem_ID).ToDictionary(g => g.Key, g => g.First());

        // Load ALL SCOA Function nodes for leaf lookup and parent-chain breadcrumb path building
        var allScoaFnNodes   = await _db.ConstScoaFunctionStructureConsolidated.ToListAsync();
        var fnConsolidated   = allScoaFnNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load ALL SCOA Fund nodes for leaf lookup and parent-chain breadcrumb path building
        var allScoaFdNodes   = await _db.ConstScoaFundsStructureConsolidated.ToListAsync();
        var fdConsolidated   = allScoaFdNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load ALL SCOA Region nodes for leaf lookup and parent-chain breadcrumb path building
        var allScoaRgNodes   = await _db.ConstScoaRegionalStructureConsolidated.ToListAsync();
        var rgConsolidated   = allScoaRgNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load ALL SCOA Costing nodes for leaf lookup and parent-chain breadcrumb path building
        var allScoaCoNodes   = await _db.ConstScoaCostingStructureConsolidated.ToListAsync();
        var coConsolidated   = allScoaCoNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load ALL SCOA Structure Consolidated nodes for leaf lookup and parent-chain breadcrumb path building
        var allScoaItNodes   = await _db.ConstScoaStructureConsolidated.ToListAsync();
        var itConsolidated   = allScoaItNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load all SCOA Project nodes so we can walk the parent chain for each project
        var allScoaProjectNodes = await _db.ConstScoaProjectStructureConsolidated.ToListAsync();
        var scoaProjectsById    = allScoaProjectNodes.GroupBy(x => x.ScoaID).ToDictionary(g => g.Key, g => g.First());

        // Load Const_Division / Const_Department for Municipal Classification labels
        var divisionIds = items.Where(i => i.DivisionId.HasValue).Select(i => i.DivisionId!.Value).Distinct().ToList();
        var allDivisions = divisionIds.Any()
            ? await _db.Const_Division.Where(d => divisionIds.Contains(d.Division_ID)).ToDictionaryAsync(d => d.Division_ID)
            : new Dictionary<int, Const_Division>();
        var deptIdsForDiv = allDivisions.Values.Select(d => d.DepartmentID).Distinct().ToList();
        var allDeptsByDiv = deptIdsForDiv.Any()
            ? await _db.Const_Department.Where(d => deptIdsForDiv.Contains(d.Department_ID)).ToDictionaryAsync(d => d.Department_ID)
            : new Dictionary<int, Const_Department>();

        // Build project lookup for per-item row generation (one grid row per Plan_ProjectItem)
        var projectById = projects.ToDictionary(p => p.Project_ID);

        string? BuildScoaFnPath(int scoaId)
        {
            if (!fnConsolidated.TryGetValue(scoaId, out var leaf)) return null;
            var pathParts = new List<string>();
            var visited = new HashSet<int>();
            var curr = leaf;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && fnConsolidated.TryGetValue(curr.ScoaParentID.Value, out var parent)
                       ? parent : null;
            }
            if (!string.IsNullOrEmpty(leaf.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(leaf.ScoaShortDesc ?? leaf.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({leaf.ScoaCode})";
            }
            return string.Join(" › ", pathParts);
        }

        string? BuildScoaFdPath(int scoaId)
        {
            if (!fdConsolidated.TryGetValue(scoaId, out var leaf)) return null;
            var pathParts = new List<string>();
            var visited = new HashSet<int>();
            var curr = leaf;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && fdConsolidated.TryGetValue(curr.ScoaParentID.Value, out var parent)
                       ? parent : null;
            }
            if (!string.IsNullOrEmpty(leaf.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(leaf.ScoaShortDesc ?? leaf.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({leaf.ScoaCode})";
            }
            return string.Join(" › ", pathParts);
        }

        string? BuildScoaRgPath(int scoaId)
        {
            if (!rgConsolidated.TryGetValue(scoaId, out var leaf)) return null;
            var pathParts = new List<string>();
            var visited = new HashSet<int>();
            var curr = leaf;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && rgConsolidated.TryGetValue(curr.ScoaParentID.Value, out var parent)
                       ? parent : null;
            }
            if (!string.IsNullOrEmpty(leaf.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(leaf.ScoaShortDesc ?? leaf.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({leaf.ScoaCode})";
            }
            return string.Join(" › ", pathParts);
        }

        string? BuildScoaCoPath(int scoaId)
        {
            if (!coConsolidated.TryGetValue(scoaId, out var leaf)) return null;
            var pathParts = new List<string>();
            var visited = new HashSet<int>();
            var curr = leaf;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && coConsolidated.TryGetValue(curr.ScoaParentID.Value, out var parent)
                       ? parent : null;
            }
            if (!string.IsNullOrEmpty(leaf.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(leaf.ScoaShortDesc ?? leaf.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({leaf.ScoaCode})";
            }
            return string.Join(" › ", pathParts);
        }

        string? BuildScoaItPath(int scoaId)
        {
            if (!itConsolidated.TryGetValue(scoaId, out var leaf)) return null;
            var pathParts = new List<string>();
            var visited = new HashSet<int>();
            var curr = leaf;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && itConsolidated.TryGetValue(curr.ScoaParentID.Value, out var parent)
                       ? parent : null;
            }
            if (!string.IsNullOrEmpty(leaf.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(leaf.ScoaShortDesc ?? leaf.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({leaf.ScoaCode})";
            }
            return string.Join(" › ", pathParts);
        }

        // ── Server-side pagination ──────────────────────────────────────────────────────────────
        // Sort ALL items in-memory (fast), record total count, then slice to the requested page.
        // DTO construction + JSON serialisation only run for the `take` items on this page,
        // keeping response time constant regardless of total dataset size.
        var sortedItems = items
            .Where(item => projectById.ContainsKey(item.ProjectID))
            .OrderBy(item => projectById[item.ProjectID].ProjectCode)
            .ThenBy(item => item.ProjectID)
            .ThenBy(item => item.PlanProjectItem_ID)
            .ToList();
        var totalCount     = sortedItems.Count;
        var pageItems      = sortedItems.Skip(skip).Take(take).ToList();
        var pageProjectIds = pageItems.Select(i => i.ProjectID).ToHashSet();

        // Pre-compute paths ONLY for the SCOA IDs present in the current page
        var fnPathCache = pageItems.Where(i => i.SCOAFunctionId.HasValue)
            .Select(i => i.SCOAFunctionId!.Value).Distinct()
            .ToDictionary(id => id, id => BuildScoaFnPath(id));
        var fdPathCache = pageItems.Where(i => i.SCOAFundId.HasValue)
            .Select(i => i.SCOAFundId!.Value).Distinct()
            .ToDictionary(id => id, id => BuildScoaFdPath(id));
        var rgPathCache = pageItems.Where(i => i.SCOARegionId.HasValue)
            .Select(i => i.SCOARegionId!.Value).Distinct()
            .ToDictionary(id => id, id => BuildScoaRgPath(id));
        var coPathCache = pageItems.Where(i => i.SCOACostingID.HasValue)
            .Select(i => i.SCOACostingID!.Value).Distinct()
            .ToDictionary(id => id, id => BuildScoaCoPath(id));
        var itPathCache = pageItems.Where(i => i.SCOAItemID > 0)
            .Select(i => i.SCOAItemID).Distinct()
            .ToDictionary(id => id, id => BuildScoaItPath(id));

        // Pre-compute SCOA Project paths only for projects that appear in the current page
        var scoaPrDataByProjectId = projects
            .Where(proj => pageProjectIds.Contains(proj.Project_ID))
            .ToDictionary(proj => proj.Project_ID, proj =>
        {
            if (!scoaProjectsById.TryGetValue(proj.ScoaProjectID, out var spNode))
                return (label: (string?)null, path: (string?)null, ntId: (string?)null, desc: (string?)null);
            var prLabel   = spNode.ScoaShortDesc ?? spNode.ScoaDesc ?? spNode.ScoaCode;
            var prNtId    = spNode.NTScoaID;
            var prDesc    = spNode.ScoaDesc;
            var pathParts = new List<string>();
            var visited   = new HashSet<int>();
            var curr      = spNode;
            while (curr != null && visited.Add(curr.ScoaID))
            {
                var lbl = curr.ScoaShortDesc ?? curr.ScoaDesc ?? curr.ScoaCode ?? "";
                if (!string.IsNullOrEmpty(lbl)) pathParts.Insert(0, lbl);
                curr = curr.ScoaParentID.HasValue && curr.ScoaParentID.Value > 0
                       && scoaProjectsById.TryGetValue(curr.ScoaParentID.Value, out var par)
                       ? par : null;
            }
            if (!string.IsNullOrEmpty(spNode.ScoaCode) && pathParts.Count > 0)
            {
                var leafHasName = !string.IsNullOrEmpty(spNode.ScoaShortDesc ?? spNode.ScoaDesc);
                if (leafHasName)
                    pathParts[pathParts.Count - 1] = $"{pathParts[pathParts.Count - 1]} ({spNode.ScoaCode})";
            }
            return (label: prLabel, path: string.Join(" › ", pathParts), ntId: prNtId, desc: prDesc);
        });

        // One grid row per Plan_ProjectItem in the current page
        var result = pageItems.Select(item =>
            {
                var p = projectById[item.ProjectID];
                var planProjectItemCode = item.PlanProjectItemCode;

                // SCOA Function — from each item's own SCOAFunctionId
                int? scoaFnId = null; int? scoaFnRecordId = null;
                string? scoaFn = null, scoaFnPath = null, scoaFnNtId = null, scoaFnDesc = null;
                if (item.SCOAFunctionId.HasValue && fnConsolidated.TryGetValue(item.SCOAFunctionId.Value, out var fn))
                {
                    scoaFn = fn.ScoaShortDesc ?? fn.ScoaDesc ?? fn.ScoaCode;
                    scoaFnId = item.SCOAFunctionId.Value;
                    scoaFnPath = fnPathCache.GetValueOrDefault(item.SCOAFunctionId.Value);
                    scoaFnNtId = fn.NTScoaID;
                    scoaFnDesc = fn.ScoaDesc;
                }
                // SCOA Fund — from each item's own SCOAFundId
                int? scoaFdId = null; int? scoaFdRecordId = null;
                string? scoaFd = null, scoaFdPath = null, scoaFdNtId = null, scoaFdDesc = null;
                if (item.SCOAFundId.HasValue && fdConsolidated.TryGetValue(item.SCOAFundId.Value, out var fd))
                {
                    scoaFd = fd.ScoaShortDesc ?? fd.ScoaDesc ?? fd.ScoaCode;
                    scoaFdId = item.SCOAFundId.Value;
                    scoaFdPath = fdPathCache.GetValueOrDefault(item.SCOAFundId.Value);
                    scoaFdNtId = fd.NTScoaID;
                    scoaFdDesc = fd.ScoaDesc;
                }
                // SCOA Region — from each item's own SCOARegionId
                int? scoaRgId = null; int? scoaRgRecordId = null;
                string? scoaRg = null, scoaRgPath = null, scoaRgNtId = null, scoaRgDesc = null;
                if (item.SCOARegionId.HasValue && rgConsolidated.TryGetValue(item.SCOARegionId.Value, out var rg))
                {
                    scoaRg = rg.ScoaShortDesc ?? rg.ScoaDesc ?? rg.ScoaCode;
                    scoaRgId = item.SCOARegionId.Value;
                    scoaRgPath = rgPathCache.GetValueOrDefault(item.SCOARegionId.Value);
                    scoaRgNtId = rg.NTScoaID;
                    scoaRgDesc = rg.ScoaDesc;
                }
                // SCOA Costing — from each item's own SCOACostingID
                int? scoaCoId = null; int? scoaCoRecordId = null;
                string? scoaCo = null, scoaCoPath = null, scoaCoNtId = null, scoaCoDesc = null;
                if (item.SCOACostingID.HasValue && coConsolidated.TryGetValue(item.SCOACostingID.Value, out var co))
                {
                    scoaCo = co.ScoaShortDesc ?? co.ScoaDesc ?? co.ScoaCode;
                    scoaCoId = item.SCOACostingID.Value;
                    scoaCoPath = coPathCache.GetValueOrDefault(item.SCOACostingID.Value);
                    scoaCoNtId = co.NTScoaID;
                    scoaCoDesc = co.ScoaDesc;
                }
                // SCOA Item — from each item's own SCOAItemID
                int? scoaItId = null; int? scoaItRecordId = null;
                string? scoaIt = null, scoaItPath = null, scoaItCode = null, scoaItNtId = null, scoaItDesc = null;
                if (item.SCOAItemID > 0 && itConsolidated.TryGetValue(item.SCOAItemID, out var it))
                {
                    scoaIt = it.ScoaShortDesc ?? it.ScoaDesc ?? it.ScoaCode;
                    scoaItId = item.SCOAItemID;
                    scoaItPath = itPathCache.GetValueOrDefault(item.SCOAItemID);
                    scoaItCode = it.ScoaCode;
                    scoaItNtId = it.NTScoaID;
                    scoaItDesc = it.ScoaDesc;
                }
                // Project Item text — from item's own ProjectItemID → Const_ProjectItem
                string? projIt = null; int? projItId = null;
                if (item.ProjectItemID.HasValue && constProjItems.TryGetValue(item.ProjectItemID.Value, out var cpi))
                {
                    projItId = cpi.ProjectItem_ID;
                    projIt   = cpi.Code;
                }
                // SCOA Project — pre-computed per project (O(1) lookup, shared across all items in same project)
                string? scoaPr = null, scoaPrPath = null, scoaPrNtId = null, scoaPrDesc = null;
                if (scoaPrDataByProjectId.TryGetValue(p.Project_ID, out var prData) && prData.label != null)
                {
                    scoaPr = prData.label; scoaPrPath = prData.path;
                    scoaPrNtId = prData.ntId; scoaPrDesc = prData.desc;
                }
                // Municipal Classification — from each item's own DivisionId
                string? munClassLabel = null, munClassPath = null;
                int? munClassId = null;
                if (item.DivisionId.HasValue && allDivisions.TryGetValue(item.DivisionId.Value, out var div))
                {
                    munClassId = div.Division_ID;
                    if (allDeptsByDiv.TryGetValue(div.DepartmentID, out var dept))
                    {
                        var deptCode = dept.DepartmentCode ?? "";
                        var divCode  = div.DivisionCode  ?? "";
                        var divDesc  = div.DivisionDesc  ?? divCode;
                        munClassLabel = $"{deptCode}-{divCode} / {divDesc}";
                        var deptLabel = !string.IsNullOrEmpty(dept.DepartmentCode) && !string.IsNullOrEmpty(dept.DepartmentDesc)
                            ? $"{dept.DepartmentCode} - {dept.DepartmentDesc}"
                            : dept.DepartmentCode ?? dept.DepartmentDesc;
                        munClassPath = $"{deptLabel} › {munClassLabel}";
                    }
                    else
                    {
                        munClassLabel = !string.IsNullOrEmpty(div.DivisionCode) && !string.IsNullOrEmpty(div.DivisionDesc)
                            ? $"{div.DivisionCode} / {div.DivisionDesc}"
                            : div.DivisionCode ?? div.DivisionDesc;
                        munClassPath = munClassLabel;
                    }
                }

                return MapPlanToDto(p,
                    item.BudgetAmount ?? 0, item.BudgetAmountCurP1 ?? 0, item.BudgetAmountCurP2 ?? 0,
                    1, false, null,
                    scoaPr, scoaPrPath, scoaPrNtId, scoaPrDesc,
                    scoaFn, scoaFnId, scoaFnRecordId, scoaFnPath, scoaFnNtId, scoaFnDesc,
                    munClassLabel, munClassId, munClassPath,
                    scoaFd, scoaFdId, scoaFdRecordId, scoaFdPath, scoaFdNtId, scoaFdDesc,
                    scoaRg, scoaRgId, scoaRgRecordId, scoaRgPath, scoaRgNtId, scoaRgDesc,
                    scoaCo, scoaCoId, scoaCoRecordId, scoaCoPath, scoaCoNtId, scoaCoDesc,
                    scoaIt, scoaItId, scoaItRecordId, scoaItPath, scoaItCode, scoaItNtId, scoaItDesc,
                    projIt, projItId,
                    item.CreditDebit, item.IsActiveForSCM,
                    item.Month01, item.Month02, item.Month03, item.Month04,
                    item.Month05, item.Month06, item.Month07, item.Month08,
                    item.Month09, item.Month10, item.Month11, item.Month12,
                    item.GRAPClassification, item.GRAPClassificationNote,
                    item.MainSegmentReporting, item.SubSegmentReporting,
                    item.BudgetSplitID, planProjectItemCode,
                    item.PlanProjectItem_ID);
            }).ToList();

        return Ok(new { items = result, total = totalCount });
    }

    // ──────────────────────────────────────────────────────────
    // GET /api/projects/{id}
    // ──────────────────────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _db.Plan_Project.FirstOrDefaultAsync(x => x.Project_ID == id);
        if (p == null) return NotFound();

        var items = await _db.Plan_ProjectItem
            .Where(i => i.ProjectID == id)
            .ToListAsync();

        var y1 = items.Sum(i => i.BudgetAmount ?? 0);
        var y2 = items.Sum(i => i.BudgetAmountCurP1 ?? 0);
        var y3 = items.Sum(i => i.BudgetAmountCurP2 ?? 0);

        // Map Plan_ProjectItem → ProjectBudgetLineDto
        var lines = items.Select(i => new ProjectBudgetLineDto(
            i.PlanProjectItem_ID, i.ProjectID,
            i.SCOAItemID, null, null,
            i.SCOAFundId ?? 0, null, null,
            i.SCOAFunctionId ?? 0, null, null,
            i.SCOARegionId ?? 0, null, null,
            i.SCOACostingID ?? 0, null, null,
            i.DivisionId, null,
            i.BudgetAmount ?? 0,
            i.BudgetAmountCurP1 ?? 0,
            i.BudgetAmountCurP2 ?? 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        )).ToList();

        return Ok(MapPlanToDto(p, y1, y2, y3, items.Count, true, lines));
    }

    // ──────────────────────────────────────────────────────────
    // ──────────────────────────────────────────────────────────
    // POST /api/projects/{id}/ensure-project-item
    // Creates a stub Plan_ProjectItem row if none exists, so all item-level
    // PATCH endpoints have a row to update.
    // ──────────────────────────────────────────────────────────
    [HttpPost("{id}/ensure-project-item")]
    public async Task<IActionResult> EnsureProjectItem(int id)
    {
        var existing = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!existing.Any())
        {
            var item = new Plan_ProjectItem
            {
                ProjectID    = id,
                SCOAItemID   = 0,
                CapturerID   = 1,
                DateCaptured = DateTime.UtcNow
            };
            _db.Plan_ProjectItem.Add(item);
            await _db.SaveChangesAsync();
            // Self-reference: PreviousReferenceId = its own PK; code mirrors the PK
            item.PreviousReferenceId = item.PlanProjectItem_ID;
            item.PlanProjectItemCode = item.PlanProjectItem_ID;
            await _db.SaveChangesAsync();
        }
        else
        {
            // Fix any existing rows where PreviousReferenceId was never set
            var nullRows = existing.Where(i => i.PreviousReferenceId == null).ToList();
            if (nullRows.Any())
            {
                foreach (var row in nullRows) row.PreviousReferenceId = row.PlanProjectItem_ID;
                await _db.SaveChangesAsync();
            }
        }
        return NoContent();
    }

    // PATCH /api/projects/{id}/municipal-classification
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/municipal-classification")]
    public async Task<IActionResult> PatchMunicipalClassification(int id, [FromBody] PatchMunicipalClassificationDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        foreach (var item in items)
        {
            item.DivisionId = dto.DivisionId;
            item.HistoricalProjectCode = dto.Label;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/project-item
    // Creates Const_ProjectItem if text is new; updates Plan_ProjectItem.ProjectItemID
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/project-item")]
    public async Task<IActionResult> PatchProjectItem(int id, [FromBody] PatchProjectItemDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();

        int? resolvedId = dto.ProjectItemId;

        if (resolvedId == null && !string.IsNullOrWhiteSpace(dto.Text))
        {
            // Look for existing entry (case-insensitive) for same finYear
            var existing = await _db.Const_ProjectItem
                .Where(x => x.Enabled && x.Code == dto.Text && x.FinYear == dto.FinYear)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                resolvedId = existing.ProjectItem_ID;
            }
            else
            {
                var newItem = new Const_ProjectItem
                {
                    Code = dto.Text,
                    FinYear = dto.FinYear,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow
                };
                _db.Const_ProjectItem.Add(newItem);
                await _db.SaveChangesAsync();
                resolvedId = newItem.ProjectItem_ID;
            }
        }

        foreach (var item in items) item.ProjectItemID = resolvedId;
        await _db.SaveChangesAsync();
        return Ok(new { projectItemId = resolvedId });
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/months  — update monthly phasing directly on Plan_ProjectItem M1–M12
    [HttpPatch("{id}/months")]
    public async Task<IActionResult> PatchMonths(int id, [FromBody] PatchProjectMonthsDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        var first = items.OrderBy(i => i.PlanProjectItem_ID).First();

        first.Month01 = dto.Month01 ?? 0;
        first.Month02 = dto.Month02 ?? 0;
        first.Month03 = dto.Month03 ?? 0;
        first.Month04 = dto.Month04 ?? 0;
        first.Month05 = dto.Month05 ?? 0;
        first.Month06 = dto.Month06 ?? 0;
        first.Month07 = dto.Month07 ?? 0;
        first.Month08 = dto.Month08 ?? 0;
        first.Month09 = dto.Month09 ?? 0;
        first.Month10 = dto.Month10 ?? 0;
        first.Month11 = dto.Month11 ?? 0;
        first.Month12 = dto.Month12 ?? 0;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/budget-amounts
    // Saves Year1/Year2/Year3 to the first Plan_ProjectItem row
    // (BudgetAmount / BudgetAmountCurP1 / BudgetAmountCurP2).
    // Values are stored as-entered (positive).
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/budget-amounts")]
    public async Task<IActionResult> PatchBudgetAmounts(int id, [FromBody] PatchBudgetAmountsDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        var first = items.OrderBy(i => i.PlanProjectItem_ID).First();
        first.BudgetAmount      = dto.Year1 ?? first.BudgetAmount;
        first.BudgetAmountCurP1 = dto.Year2 ?? first.BudgetAmountCurP1;
        first.BudgetAmountCurP2 = dto.Year3 ?? first.BudgetAmountCurP2;
        if (dto.BudgetSplitId.HasValue) first.BudgetSplitID = dto.BudgetSplitId.Value;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/grap-segment
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/grap-segment")]
    public async Task<IActionResult> PatchGrapSegment(int id, [FromBody] PatchProjectGrapSegmentDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        var first = items.OrderBy(i => i.PlanProjectItem_ID).First();
        first.GRAPClassification     = dto.GrapClassification;
        first.GRAPClassificationNote = dto.GrapClassificationNote;
        first.MainSegmentReporting   = dto.MainSegmentReporting;
        first.SubSegmentReporting    = dto.SubSegmentReporting;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/credit-debit
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/credit-debit")]
    public async Task<IActionResult> PatchCreditDebit(int id, [FromBody] PatchCreditDebitDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        foreach (var item in items) item.CreditDebit = dto.CreditDebit;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // PATCH /api/projects/{id}/is-active-for-scm
    // ──────────────────────────────────────────────────────────
    [HttpPatch("{id}/is-active-for-scm")]
    public async Task<IActionResult> PatchIsActiveForScm(int id, [FromBody] PatchIsActiveForScmDto dto)
    {
        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();
        if (!items.Any()) return NoContent();
        foreach (var item in items) item.IsActiveForSCM = dto.IsActiveForScm;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // Per-item PATCH endpoints — target a specific Plan_ProjectItem row by its PK
    // ──────────────────────────────────────────────────────────
    [HttpPatch("items/{itemId}/months")]
    public async Task<IActionResult> PatchItemMonths(int itemId, [FromBody] PatchProjectMonthsDto dto)
    {
        var item = await _db.Plan_ProjectItem.FirstOrDefaultAsync(i => i.PlanProjectItem_ID == itemId);
        if (item == null) return NoContent();
        item.Month01 = dto.Month01 ?? 0; item.Month02 = dto.Month02 ?? 0;
        item.Month03 = dto.Month03 ?? 0; item.Month04 = dto.Month04 ?? 0;
        item.Month05 = dto.Month05 ?? 0; item.Month06 = dto.Month06 ?? 0;
        item.Month07 = dto.Month07 ?? 0; item.Month08 = dto.Month08 ?? 0;
        item.Month09 = dto.Month09 ?? 0; item.Month10 = dto.Month10 ?? 0;
        item.Month11 = dto.Month11 ?? 0; item.Month12 = dto.Month12 ?? 0;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("items/{itemId}/budget-amounts")]
    public async Task<IActionResult> PatchItemBudgetAmounts(int itemId, [FromBody] PatchBudgetAmountsDto dto)
    {
        var item = await _db.Plan_ProjectItem.FirstOrDefaultAsync(i => i.PlanProjectItem_ID == itemId);
        if (item == null) return NoContent();
        item.BudgetAmount      = dto.Year1 ?? item.BudgetAmount;
        item.BudgetAmountCurP1 = dto.Year2 ?? item.BudgetAmountCurP1;
        item.BudgetAmountCurP2 = dto.Year3 ?? item.BudgetAmountCurP2;
        if (dto.BudgetSplitId.HasValue) item.BudgetSplitID = dto.BudgetSplitId.Value;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("items/{itemId}/grap-segment")]
    public async Task<IActionResult> PatchItemGrapSegment(int itemId, [FromBody] PatchProjectGrapSegmentDto dto)
    {
        var item = await _db.Plan_ProjectItem.FirstOrDefaultAsync(i => i.PlanProjectItem_ID == itemId);
        if (item == null) return NoContent();
        item.GRAPClassification     = dto.GrapClassification;
        item.GRAPClassificationNote = dto.GrapClassificationNote;
        item.MainSegmentReporting   = dto.MainSegmentReporting;
        item.SubSegmentReporting    = dto.SubSegmentReporting;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("items/{itemId}/credit-debit")]
    public async Task<IActionResult> PatchItemCreditDebit(int itemId, [FromBody] PatchCreditDebitDto dto)
    {
        var item = await _db.Plan_ProjectItem.FirstOrDefaultAsync(i => i.PlanProjectItem_ID == itemId);
        if (item == null) return NoContent();
        item.CreditDebit = dto.CreditDebit;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("items/{itemId}/municipal-classification")]
    public async Task<IActionResult> PatchItemMunicipalClassification(int itemId, [FromBody] PatchMunicipalClassificationDto dto)
    {
        var item = await _db.Plan_ProjectItem.FirstOrDefaultAsync(i => i.PlanProjectItem_ID == itemId);
        if (item == null) return NoContent();
        item.DivisionId = dto.DivisionId;
        item.HistoricalProjectCode = dto.Label;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ──────────────────────────────────────────────────────────
    // POST /api/projects  (still creates in old Projects table for backward compat)
    // ──────────────────────────────────────────────────────────
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

    // ──────────────────────────────────────────────────────────
    // PUT /api/projects/{id}  — writes back to Plan_Project
    // ──────────────────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectDto dto)
    {
        var p = await _db.Plan_Project.FirstOrDefaultAsync(x => x.Project_ID == id);
        if (p == null) return NotFound();

        if (dto.ProjectName != null)   p.ProjectName = dto.ProjectName;
        if (dto.Description != null)   p.ProjectDesc = dto.Description;
        if (dto.FinancialYear != null)  p.FinYear = dto.FinancialYear;
        if (dto.SingleMultiYear != null) p.SingleMultiYear = dto.SingleMultiYear;
        if (dto.CostingProject.HasValue) p.CostingProject = dto.CostingProject.Value;
        if (dto.Status.HasValue)        p.ProjectStatus = dto.Status.Value;
        if (dto.Type.HasValue)          p.CapitalOperation = dto.Type.Value;
        if (dto.StartDate.HasValue)     p.EstimatedStartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue)       p.EstimatedEndDate = dto.EndDate.Value;
        if (dto.TotalProjectCost.HasValue) p.CostEstimate = dto.TotalProjectCost.Value;

        // GPS stored as two separate columns — accept "lat, lon" or "lon, lat" string
        if (dto.GpsCoordinates != null)
        {
            var parts = dto.GpsCoordinates.Split(',', StringSplitOptions.TrimEntries);
            if (parts.Length >= 2) { p.Latitude = parts[0]; p.Longitude = parts[1]; }
            else { p.Latitude = dto.GpsCoordinates; }
        }

        p.DateModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var items = await _db.Plan_ProjectItem.Where(i => i.ProjectID == id).ToListAsync();

        if (dto.IsActiveForScm.HasValue)
        {
            foreach (var item in items) item.IsActiveForSCM = dto.IsActiveForScm.Value;
            await _db.SaveChangesAsync();
        }
        var y1 = items.Sum(i => i.BudgetAmount ?? 0);
        var y2 = items.Sum(i => i.BudgetAmountCurP1 ?? 0);
        var y3 = items.Sum(i => i.BudgetAmountCurP2 ?? 0);

        return Ok(MapPlanToDto(p, y1, y2, y3, items.Count, false, null));
    }

    // ──────────────────────────────────────────────────────────
    // Budget-line endpoints still reference old ProjectBudgetLine table
    // ──────────────────────────────────────────────────────────
    [HttpGet("{id}/budget-lines")]
    public async Task<IActionResult> GetBudgetLines(int id)
    {
        var items = await _db.Plan_ProjectItem
            .Where(i => i.ProjectID == id)
            .OrderBy(i => i.PlanProjectItem_ID)
            .ToListAsync();

        return Ok(items.Select(i => new ProjectBudgetLineDto(
            i.PlanProjectItem_ID, i.ProjectID,
            i.SCOAItemID, null, null,
            i.SCOAFundId ?? 0, null, null,
            i.SCOAFunctionId ?? 0, null, null,
            i.SCOARegionId ?? 0, null, null,
            i.SCOACostingID ?? 0, null, null,
            i.DivisionId, null,
            i.BudgetAmount ?? 0,
            i.BudgetAmountCurP1 ?? 0,
            i.BudgetAmountCurP2 ?? 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        )).ToList());
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

    // ──────────────────────────────────────────────────────────
    // Mapping helpers
    // ──────────────────────────────────────────────────────────

    // Keyed by TypeValue (= CapitalOperation column) from Const_PlanCapitalOperationalTypes_sys
    private static readonly Dictionary<int, string> CapOpToType = new()
    {
        { 0, "Operational Expenditure" },
        { 1, "Capital" },
        { 2, "Revenue/Gains/Losses" },
        { 3, "Financial Position" },
        { 4, "Free Basic Services/Revenue Foregone" }
    };

    private static readonly Dictionary<int, string> StatusToName = new()
    {
        { 4, "Capture Project" }, { 5, "Delete Project" },
        { 23, "Registered/IDP" }, { 24, "Initiated" }
    };

    private static ProjectDto MapPlanToDto(
        Plan_Project p,
        decimal y1, decimal y2, decimal y3,
        int lineCount,
        bool includeLines,
        List<ProjectBudgetLineDto>? lines,
        string? scoaProject = null,
        string? scoaProjectPath = null,
        string? scoaProjectNtId = null,
        string? scoaProjectDesc = null,
        string? scoaFunction = null,
        int? scoaFunctionId = null,
        int? scoaFunctionRecordId = null,
        string? scoaFunctionPath = null,
        string? scoaFunctionNtId = null,
        string? scoaFunctionDesc = null,
        string? municipalClassification = null,
        int? municipalClassificationId = null,
        string? municipalClassificationPath = null,
        string? scoaFund = null,
        int? scoaFundId = null,
        int? scoaFundRecordId = null,
        string? scoaFundPath = null,
        string? scoaFundNtId = null,
        string? scoaFundDesc = null,
        string? scoaRegion = null,
        int? scoaRegionId = null,
        int? scoaRegionRecordId = null,
        string? scoaRegionPath = null,
        string? scoaRegionNtId = null,
        string? scoaRegionDesc = null,
        string? scoaCosting = null,
        int? scoaCostingId = null,
        int? scoaCostingRecordId = null,
        string? scoaCostingPath = null,
        string? scoaCostingNtId = null,
        string? scoaCostingDesc = null,
        string? scoaItem = null,
        int? scoaItemId = null,
        int? scoaItemRecordId = null,
        string? scoaItemPath = null,
        string? scoaItemCode = null,
        string? scoaItemNtId = null,
        string? scoaItemDesc = null,
        string? projectItem = null,
        int? projectItemId = null,
        string? creditDebit = null,
        bool? isActiveForScm = null,
        decimal? month01 = null, decimal? month02 = null, decimal? month03 = null,
        decimal? month04 = null, decimal? month05 = null, decimal? month06 = null,
        decimal? month07 = null, decimal? month08 = null, decimal? month09 = null,
        decimal? month10 = null, decimal? month11 = null, decimal? month12 = null,
        string? grapClassification = null, string? grapClassificationNote = null,
        string? mainSegmentReporting = null, string? subSegmentReporting = null,
        int? budgetSplitId = null,
        int? planProjectItemCode = null,
        int? planProjectItemId = null)
    {
        var gps = (!string.IsNullOrEmpty(p.Latitude) && !string.IsNullOrEmpty(p.Longitude))
            ? $"{p.Latitude}, {p.Longitude}"
            : (!string.IsNullOrEmpty(p.Latitude) ? p.Latitude : null);

        var typeStr   = p.CapitalOperation.HasValue && CapOpToType.TryGetValue(p.CapitalOperation.Value, out var t) ? t : "Capital";
        var statusStr = StatusToName.TryGetValue(p.ProjectStatus, out var s) ? s : "OnHold";
        var code      = p.ProjectCode.HasValue ? p.ProjectCode.Value.ToString() : $"PRJ-{p.Project_ID:D3}";

        return new ProjectDto(
            p.Project_ID,
            code,
            p.ProjectName ?? string.Empty,
            p.ProjectDesc,
            null, null, null,
            statusStr,
            typeStr,
            null, null, null,
            gps,
            null, null, null, null,
            p.EstimatedStartDate,
            p.EstimatedEndDate,
            p.CostEstimate,
            y1, y2, y3,
            0,
            lineCount,
            p.DateCaptured,
            includeLines ? lines : null,
            false,
            p.FinYear,
            p.SingleMultiYear,
            null,
            p.CostingProject ?? false,
            scoaProject,
            scoaProjectPath,
            scoaProjectNtId,
            scoaProjectDesc,
            scoaFunction,
            scoaFunctionId,
            scoaFunctionRecordId,
            scoaFunctionPath,
            scoaFunctionNtId,
            scoaFunctionDesc,
            municipalClassification,
            municipalClassificationId,
            municipalClassificationPath,
            scoaFund,
            scoaFundId,
            scoaFundRecordId,
            scoaFundPath,
            scoaFundNtId,
            scoaFundDesc,
            scoaRegion,
            scoaRegionId,
            scoaRegionRecordId,
            scoaRegionPath,
            scoaRegionNtId,
            scoaRegionDesc,
            scoaCosting,
            scoaCostingId,
            scoaCostingRecordId,
            scoaCostingPath,
            scoaCostingNtId,
            scoaCostingDesc,
            scoaItem,
            scoaItemId,
            scoaItemRecordId,
            scoaItemPath,
            scoaItemCode,
            scoaItemNtId,
            scoaItemDesc,
            projectItem,
            projectItemId,
            creditDebit,
            isActiveForScm,
            month01, month02, month03, month04, month05, month06,
            month07, month08, month09, month10, month11, month12,
            grapClassification, grapClassificationNote,
            mainSegmentReporting, subSegmentReporting,
            budgetSplitId,
            planProjectItemCode,
            planProjectItemId
        );
    }

    private static ProjectDto MapToDto(Project p, bool includeLines)
    {
        var scoaLineTotal  = p.ProjectBudgetLines?.Sum(l => l.Year1Amount) ?? 0;
        var scoaLineTotal2 = p.ProjectBudgetLines?.Sum(l => l.Year2Amount) ?? 0;
        var scoaLineTotal3 = p.ProjectBudgetLines?.Sum(l => l.Year3Amount) ?? 0;
        var bst1 = p.BudgetStrings?.Sum(s => s.Year1Amount) ?? 0;
        var bst2 = p.BudgetStrings?.Sum(s => s.Year2Amount) ?? 0;
        var bst3 = p.BudgetStrings?.Sum(s => s.Year3Amount) ?? 0;

        return new ProjectDto(
            p.Id, p.ProjectCode, p.ProjectName, p.Description, p.IdpLink,
            p.IdpPriorityArea, p.IdpStrategicObjective,
            p.Status.ToString(), p.Type.ToString(),
            p.DepartmentId, p.Department?.Name, p.Ward,
            p.GpsCoordinates, p.ProjectManager, p.ContractorName, p.ContractNumber,
            p.FundingSource, p.StartDate, p.EndDate, p.TotalProjectCost,
            bst1 + scoaLineTotal, bst2 + scoaLineTotal2, bst3 + scoaLineTotal3,
            p.BudgetStrings?.Count ?? 0,
            p.ProjectBudgetLines?.Count ?? 0,
            p.CreatedOn,
            includeLines ? p.ProjectBudgetLines?.Select(MapLineToDto).ToList() : null,
            p.IsRegistered,
            p.FinancialYear,
            p.SingleMultiYear,
            p.ProjectTypeName,
            p.CostingProject,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
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
