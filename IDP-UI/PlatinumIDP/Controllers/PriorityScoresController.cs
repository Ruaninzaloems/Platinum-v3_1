using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;
using PlatinumIDP.Models;

namespace PlatinumIDP.Controllers;

[ApiController]
[Route("api/priority-scores")]
public class PriorityScoresController : ControllerBase
{
    private readonly IdpDbContext _context;
    public PriorityScoresController(IdpDbContext context) => _context = context;

    [HttpGet("framework/{frameworkId}/project/{projectId}")]
    public async Task<ActionResult<IEnumerable<PriorityProjectScore>>> GetProjectScores(int frameworkId, int projectId)
    {
        return await _context.PriorityProjectScores
            .Where(s => s.FrameworkId == frameworkId && s.ProjectId == projectId)
            .Include(s => s.Criteria)
            .OrderBy(s => s.Criteria!.SortOrder)
            .ToListAsync();
    }

    [HttpGet("framework/{frameworkId}/all")]
    public async Task<ActionResult<IEnumerable<ProjectRankingDto>>> GetAllScores(int frameworkId)
    {
        return Ok(await BuildRankings(frameworkId));
    }

    [HttpPost("score")]
    public async Task<ActionResult<PriorityProjectScore>> ScoreProject(PriorityProjectScore score)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(score.FrameworkId);
        if (fw == null) return BadRequest("Framework not found");

        if (score.HumanScore.HasValue && (score.HumanScore < fw.ScaleMin || score.HumanScore > fw.ScaleMax))
            return BadRequest($"Human score must be between {fw.ScaleMin} and {fw.ScaleMax}");
        if (score.AiScore.HasValue && (score.AiScore < fw.ScaleMin || score.AiScore > fw.ScaleMax))
            return BadRequest($"AI score must be between {fw.ScaleMin} and {fw.ScaleMax}");

        score.BlendedScore = CalculateBlended(score.HumanScore, score.AiScore, fw.HumanWeight, fw.AiWeight);

        var existing = await _context.PriorityProjectScores
            .FirstOrDefaultAsync(s => s.FrameworkId == score.FrameworkId && s.ProjectId == score.ProjectId && s.CriteriaId == score.CriteriaId);

        if (existing != null)
        {
            existing.HumanScore = score.HumanScore;
            existing.AiScore = score.AiScore;
            existing.BlendedScore = score.BlendedScore;
            existing.Comments = score.Comments;
            existing.ScoredBy = score.ScoredBy;
            existing.ScoredDate = DateTime.UtcNow;
            existing.ModifiedDate = DateTime.UtcNow;
            existing.VersionNo++;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        score.ScoredDate = DateTime.UtcNow;
        score.CreatedDate = DateTime.UtcNow;
        score.ModifiedDate = DateTime.UtcNow;
        _context.PriorityProjectScores.Add(score);
        await _context.SaveChangesAsync();
        return Ok(score);
    }

    [HttpPost("framework/{frameworkId}/project/{projectId}/score-all")]
    public async Task<IActionResult> ScoreProjectAll(int frameworkId, int projectId, [FromBody] List<ScoreBatchItem> scores)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(frameworkId);
        if (fw == null) return BadRequest("Framework not found");

        var existingScores = await _context.PriorityProjectScores
            .Where(s => s.FrameworkId == frameworkId && s.ProjectId == projectId)
            .ToListAsync();

        foreach (var item in scores)
        {
            if (item.HumanScore.HasValue && (item.HumanScore < fw.ScaleMin || item.HumanScore > fw.ScaleMax))
                return BadRequest($"Human score for criteria {item.CriteriaId} out of range ({fw.ScaleMin}-{fw.ScaleMax})");
            if (item.AiScore.HasValue && (item.AiScore < fw.ScaleMin || item.AiScore > fw.ScaleMax))
                return BadRequest($"AI score for criteria {item.CriteriaId} out of range ({fw.ScaleMin}-{fw.ScaleMax})");

            var blended = CalculateBlended(item.HumanScore, item.AiScore, fw.HumanWeight, fw.AiWeight);
            var existing = existingScores.FirstOrDefault(s => s.CriteriaId == item.CriteriaId);

            if (existing != null)
            {
                existing.HumanScore = item.HumanScore;
                existing.AiScore = item.AiScore;
                existing.BlendedScore = blended;
                existing.Comments = item.Comments;
                existing.ScoredBy = item.ScoredBy;
                existing.ScoredDate = DateTime.UtcNow;
                existing.ModifiedDate = DateTime.UtcNow;
                existing.VersionNo++;
            }
            else
            {
                _context.PriorityProjectScores.Add(new PriorityProjectScore
                {
                    FrameworkId = frameworkId, ProjectId = projectId,
                    CriteriaId = item.CriteriaId, HumanScore = item.HumanScore, AiScore = item.AiScore,
                    BlendedScore = blended, Comments = item.Comments, ScoredBy = item.ScoredBy,
                    ScoredDate = DateTime.UtcNow, CreatedBy = item.ScoredBy
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Scores saved", count = scores.Count });
    }

    [HttpGet("framework/{frameworkId}/project/{projectId}/composite")]
    public async Task<ActionResult<object>> GetCompositeScore(int frameworkId, int projectId)
    {
        var composite = await CalculateComposite(frameworkId, projectId);
        return Ok(new { compositeScore = composite });
    }

    [HttpPost("framework/{frameworkId}/ai-recommend/{projectId}")]
    public async Task<ActionResult<IEnumerable<PriorityProjectScore>>> AiRecommend(int frameworkId, int projectId)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .FirstOrDefaultAsync(f => f.Id == frameworkId);
        if (fw == null) return NotFound();

        var project = await _context.IdpProjects
            .Include(p => p.Indicators)
            .Include(p => p.ObjectiveLinks)
            .FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null) return NotFound();

        var aiScores = GenerateAiScores(fw, project);
        var results = new List<PriorityProjectScore>();

        foreach (var (criteriaId, aiScore) in aiScores)
        {
            var existing = await _context.PriorityProjectScores
                .FirstOrDefaultAsync(s => s.FrameworkId == frameworkId && s.ProjectId == projectId && s.CriteriaId == criteriaId);

            if (existing != null)
            {
                existing.AiScore = aiScore;
                existing.BlendedScore = CalculateBlended(existing.HumanScore, aiScore, fw.HumanWeight, fw.AiWeight);
                existing.ModifiedDate = DateTime.UtcNow;
                existing.VersionNo++;
                results.Add(existing);
            }
            else
            {
                var score = new PriorityProjectScore
                {
                    FrameworkId = frameworkId, ProjectId = projectId,
                    CriteriaId = criteriaId, AiScore = aiScore,
                    BlendedScore = CalculateBlended(null, aiScore, fw.HumanWeight, fw.AiWeight),
                    ScoredBy = null, ScoredDate = DateTime.UtcNow, CreatedBy = null
                };
                _context.PriorityProjectScores.Add(score);
                results.Add(score);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(results);
    }

    [HttpPost("framework/{frameworkId}/ai-recommend-all")]
    public async Task<IActionResult> AiRecommendAll(int frameworkId)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .FirstOrDefaultAsync(f => f.Id == frameworkId);
        if (fw == null) return NotFound();
        if (fw.CycleId == null) return BadRequest("Framework not linked to a cycle");

        var projects = await _context.IdpProjects
            .Where(p => p.CycleId == fw.CycleId)
            .Include(p => p.Indicators)
            .Include(p => p.ObjectiveLinks)
            .ToListAsync();

        var count = 0;
        foreach (var project in projects)
        {
            var aiScores = GenerateAiScores(fw, project);
            foreach (var (criteriaId, aiScore) in aiScores)
            {
                var existing = await _context.PriorityProjectScores
                    .FirstOrDefaultAsync(s => s.FrameworkId == frameworkId && s.ProjectId == project.Id && s.CriteriaId == criteriaId);

                if (existing != null)
                {
                    existing.AiScore = aiScore;
                    existing.BlendedScore = CalculateBlended(existing.HumanScore, aiScore, fw.HumanWeight, fw.AiWeight);
                    existing.ModifiedDate = DateTime.UtcNow;
                    existing.VersionNo++;
                }
                else
                {
                    _context.PriorityProjectScores.Add(new PriorityProjectScore
                    {
                        FrameworkId = frameworkId, ProjectId = project.Id,
                        CriteriaId = criteriaId, AiScore = aiScore,
                        BlendedScore = CalculateBlended(null, aiScore, fw.HumanWeight, fw.AiWeight),
                        ScoredBy = null, ScoredDate = DateTime.UtcNow, CreatedBy = null
                    });
                }
                count++;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"AI recommendations generated for {projects.Count} projects", scoresGenerated = count });
    }

    [HttpGet("framework/{frameworkId}/rankings")]
    public async Task<ActionResult<IEnumerable<ProjectRankingDto>>> GetRankings(int frameworkId)
    {
        return Ok(await BuildRankings(frameworkId));
    }

    [HttpPost("framework/{frameworkId}/save-ranks")]
    public async Task<IActionResult> SaveRanks(int frameworkId, [FromBody] List<RankOverride> ranks)
    {
        var fw = await _context.PriorityFrameworks.FindAsync(frameworkId);
        if (fw == null) return NotFound();
        if (fw.CycleId == null) return BadRequest("Framework not linked to a cycle");

        foreach (var rank in ranks)
        {
            var project = await _context.IdpProjects.FindAsync(rank.ProjectId);
            if (project != null)
            {
                project.OverrideRank = rank.Rank;
                project.ModifiedDate = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Ranks saved", count = ranks.Count });
    }

    [HttpGet("framework/{frameworkId}/budget-simulation")]
    public async Task<ActionResult<object>> BudgetSimulation(int frameworkId, [FromQuery] decimal? threshold)
    {
        var rankings = await BuildRankings(frameworkId);
        var totalBudget = rankings.Sum(r => r.BudgetAmount ?? 0);
        var budgetLimit = threshold ?? totalBudget;

        decimal runningTotal = 0;
        var selected = new List<ProjectRankingDto>();
        var excluded = new List<ProjectRankingDto>();

        foreach (var r in rankings)
        {
            var budget = r.BudgetAmount ?? 0;
            if (runningTotal + budget <= budgetLimit)
            {
                runningTotal += budget;
                selected.Add(r);
            }
            else
            {
                excluded.Add(r);
            }
        }

        return Ok(new
        {
            projects = rankings,
            totalBudget,
            selectedBudget = selected.Sum(r => r.BudgetAmount ?? 0),
            excludedBudget = excluded.Sum(r => r.BudgetAmount ?? 0),
            selectedCount = selected.Count,
            excludedCount = excluded.Count
        });
    }

    private async Task<List<ProjectRankingDto>> BuildRankings(int frameworkId)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .FirstOrDefaultAsync(f => f.Id == frameworkId);
        if (fw == null) return new List<ProjectRankingDto>();

        var projects = fw.CycleId.HasValue
            ? await _context.IdpProjects.Where(p => p.CycleId == fw.CycleId).ToListAsync()
            : new List<IdpProject>();

        var allScores = await _context.PriorityProjectScores
            .Where(s => s.FrameworkId == frameworkId)
            .Include(s => s.Criteria)
            .ToListAsync();

        var rankings = new List<ProjectRankingDto>();
        foreach (var project in projects)
        {
            var projectScores = allScores.Where(s => s.ProjectId == project.Id).ToList();
            var composite = fw.Criteria.Sum(c =>
            {
                var score = projectScores.FirstOrDefault(s => s.CriteriaId == c.Id);
                return score != null ? (c.Weight * score.BlendedScore / 100m) : 0m;
            });

            rankings.Add(new ProjectRankingDto
            {
                ProjectId = project.Id,
                ProjectName = project.Name,
                Classification = project.Classification,
                Department = project.Department,
                CompositeScore = Math.Round(composite, 2),
                OverrideRank = project.OverrideRank,
                BudgetAmount = project.BudgetAmount,
                Priority = project.Priority,
                Scores = projectScores
            });
        }

        var overridden = rankings.Where(r => r.OverrideRank.HasValue).OrderBy(r => r.OverrideRank!.Value).ToList();
        var calculated = rankings.Where(r => !r.OverrideRank.HasValue).OrderByDescending(r => r.CompositeScore).ToList();

        rankings = new List<ProjectRankingDto>();
        int calcIdx = 0;
        foreach (var o in overridden)
        {
            while (calcIdx < calculated.Count && rankings.Count < o.OverrideRank!.Value - 1)
            {
                rankings.Add(calculated[calcIdx++]);
            }
            rankings.Add(o);
        }
        while (calcIdx < calculated.Count)
            rankings.Add(calculated[calcIdx++]);

        for (int i = 0; i < rankings.Count; i++)
            rankings[i].Rank = i + 1;

        return rankings;
    }

    private async Task<decimal> CalculateComposite(int frameworkId, int projectId)
    {
        var fw = await _context.PriorityFrameworks
            .Include(f => f.Criteria.Where(c => c.IsActive))
            .FirstOrDefaultAsync(f => f.Id == frameworkId);
        if (fw == null) return 0;

        var scores = await _context.PriorityProjectScores
            .Where(s => s.FrameworkId == frameworkId && s.ProjectId == projectId)
            .ToListAsync();

        return Math.Round(fw.Criteria.Sum(c =>
        {
            var score = scores.FirstOrDefault(s => s.CriteriaId == c.Id);
            return score != null ? (c.Weight * score.BlendedScore / 100m) : 0m;
        }), 2);
    }

    private static decimal CalculateBlended(int? human, int? ai, decimal humanWeight, decimal aiWeight)
    {
        if (human.HasValue && ai.HasValue)
            return Math.Round((human.Value * humanWeight + ai.Value * aiWeight) / 100m, 2);
        if (human.HasValue) return human.Value;
        if (ai.HasValue) return ai.Value;
        return 0m;
    }

    private Dictionary<int, int> GenerateAiScores(PriorityFramework fw, IdpProject project)
    {
        var result = new Dictionary<int, int>();
        foreach (var criteria in fw.Criteria)
        {
            var score = criteria.Code switch
            {
                "STRATEGIC_ALIGNMENT" => project.ObjectiveLinks.Any() ? Math.Min(5, 2 + project.ObjectiveLinks.Count) : 2,
                "SERVICE_DELIVERY_IMPACT" => project.Classification == "Capital" ? 4 : 3,
                "COMMUNITY_NEED" => project.Priority switch { "Critical" => 5, "High" => 4, "Medium" => 3, "Low" => 2, _ => 2 },
                "LEGISLATIVE_COMPLIANCE" => project.Priority == "Critical" ? 5 : 3,
                "FINANCIAL_FEASIBILITY" => project.BudgetAmount.HasValue && project.FundingSource != null ? 4 : 2,
                "IMPLEMENTATION_READINESS" => project.Status switch { "In Progress" => 4, "Planned" => 3, _ => 2 },
                "DELIVERY_RISK" => project.BudgetAmount > 50000000m ? 2 : 4,
                _ => 3
            };
            result[criteria.Id] = Math.Clamp(score, fw.ScaleMin, fw.ScaleMax);
        }
        return result;
    }
}

public class ProjectRankingDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Classification { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public decimal CompositeScore { get; set; }
    public int Rank { get; set; }
    public int? OverrideRank { get; set; }
    public decimal? BudgetAmount { get; set; }
    public string Priority { get; set; } = string.Empty;
    public List<PriorityProjectScore> Scores { get; set; } = new();
}

public class ScoreBatchItem
{
    public int CriteriaId { get; set; }
    public int? HumanScore { get; set; }
    public int? AiScore { get; set; }
    public string? Comments { get; set; }
    public int? ScoredBy { get; set; }
}

public class RankOverride
{
    public int ProjectId { get; set; }
    public int Rank { get; set; }
}
