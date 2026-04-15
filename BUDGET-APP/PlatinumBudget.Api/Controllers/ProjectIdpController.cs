using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/idp-links")]
public class ProjectIdpController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public ProjectIdpController(BudgetDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetLinks(int projectId)
    {
        var links = await _db.Plan_ProjectIDP
            .Where(x => x.ProjectID == projectId)
            .OrderBy(x => x.ProjectIDP_ID)
            .ToListAsync();

        var allItems = await _db.IdpItems.ToListAsync();
        var itemMap = allItems.ToDictionary(i => i.Item_ID);

        var result = links.Select(l =>
        {
            var ancestors = ResolveAncestors(l.ProjectIDPItemID, itemMap);
            return new
            {
                id = l.ProjectIDP_ID,
                projectId = l.ProjectID,
                idpItemId = l.ProjectIDPItemID,
                parentIdpItemId = l.ParentIDPItemID,
                percentage = l.Percentage,
                longitude = l.Longitude,
                latitude = l.Latitude,
                nationalKpa = ancestors.ContainsKey(1) ? ancestors[1] : "",
                mtsf = ancestors.ContainsKey(2) ? ancestors[2] : "",
                iudf = ancestors.ContainsKey(3) ? ancestors[3] : "",
                strategicObjective = ancestors.ContainsKey(4) ? ancestors[4] : "",
                idpProgram = ancestors.ContainsKey(5) ? ancestors[5]
                    : (itemMap.ContainsKey(l.ProjectIDPItemID) ? itemMap[l.ProjectIDPItemID].ItemDesc ?? "" : "")
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddLink(int projectId, [FromBody] ProjectIdpLinkDto dto)
    {
        var allItems = await _db.IdpItems.ToListAsync();
        var itemMap = allItems.ToDictionary(i => i.Item_ID);

        var rootId = GetRootAncestor(dto.IdpItemId, itemMap);

        var link = new Plan_ProjectIDP
        {
            ProjectID = projectId,
            ProjectIDPItemID = dto.IdpItemId,
            ParentIDPItemID = rootId,
            Percentage = dto.Percentage,
            Longitude = dto.Longitude,
            Latitude = dto.Latitude,
            CapturerID = 1,
            DateCaptured = DateTime.UtcNow
        };
        _db.Plan_ProjectIDP.Add(link);
        await _db.SaveChangesAsync();
        return Ok(new { id = link.ProjectIDP_ID });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLink(int projectId, int id, [FromBody] ProjectIdpLinkDto dto)
    {
        var link = await _db.Plan_ProjectIDP
            .FirstOrDefaultAsync(x => x.ProjectIDP_ID == id && x.ProjectID == projectId);
        if (link == null) return NotFound();

        link.ProjectIDPItemID = dto.IdpItemId;
        link.Percentage = dto.Percentage;
        link.Longitude = dto.Longitude;
        link.Latitude = dto.Latitude;
        link.ModifierID = 1;
        link.DateModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLink(int projectId, int id)
    {
        var link = await _db.Plan_ProjectIDP
            .FirstOrDefaultAsync(x => x.ProjectIDP_ID == id && x.ProjectID == projectId);
        if (link == null) return NotFound();
        _db.Plan_ProjectIDP.Remove(link);
        await _db.SaveChangesAsync();
        return Ok();
    }

    private static Dictionary<int, string> ResolveAncestors(int itemId, Dictionary<int, IdpItem> map)
    {
        var result = new Dictionary<int, string>();
        var current = itemId;
        var visited = new HashSet<int>();
        while (current > 0 && map.ContainsKey(current) && !visited.Contains(current))
        {
            visited.Add(current);
            var item = map[current];
            var level = item.IDPLevelNumber ?? 0;
            if (level > 0) result[level] = item.ItemDesc ?? "";
            current = item.ItemParentID ?? 0;
        }
        return result;
    }

    private static int GetRootAncestor(int itemId, Dictionary<int, IdpItem> map)
    {
        var current = itemId;
        var visited = new HashSet<int>();
        while (current > 0 && map.ContainsKey(current) && !visited.Contains(current))
        {
            visited.Add(current);
            var item = map[current];
            if (item.ItemParentID == null || item.ItemParentID == 0) return current;
            current = item.ItemParentID.Value;
        }
        return itemId;
    }
}

public class ProjectIdpLinkDto
{
    public int IdpItemId { get; set; }
    public decimal Percentage { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? Latitude { get; set; }
}
