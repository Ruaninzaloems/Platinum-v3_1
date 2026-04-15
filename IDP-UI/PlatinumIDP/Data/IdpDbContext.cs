using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Models;

namespace PlatinumIDP.Data;

public class IdpDbContext : DbContext
{
    public IdpDbContext(DbContextOptions<IdpDbContext> options) : base(options) { }

    public DbSet<IdpCycle> IdpCycles => Set<IdpCycle>();
    public DbSet<IdpProcessPhase> IdpProcessPhases => Set<IdpProcessPhase>();
    public DbSet<IdpMilestone> IdpMilestones => Set<IdpMilestone>();
    public DbSet<IdpStrategicObjective> IdpStrategicObjectives => Set<IdpStrategicObjective>();
    public DbSet<IdpProject> IdpProjects => Set<IdpProject>();
    public DbSet<IdpProjectIndicator> IdpProjectIndicators => Set<IdpProjectIndicator>();
    public DbSet<IdpPublicComment> IdpPublicComments => Set<IdpPublicComment>();
    public DbSet<IdpCommentResponse> IdpCommentResponses => Set<IdpCommentResponse>();
    public DbSet<IdpDocumentVersion> IdpDocumentVersions => Set<IdpDocumentVersion>();
    public DbSet<IdpWorkflowTask> IdpWorkflowTasks => Set<IdpWorkflowTask>();
    public DbSet<IdpSubmissionLog> IdpSubmissionLogs => Set<IdpSubmissionLog>();
    public DbSet<IdpAuditLog> IdpAuditLogs => Set<IdpAuditLog>();
    public DbSet<MscoaSegment> MscoaSegments => Set<MscoaSegment>();
    public DbSet<ProjectObjectiveLink> ProjectObjectiveLinks => Set<ProjectObjectiveLink>();
    public DbSet<PriorityFramework> PriorityFrameworks => Set<PriorityFramework>();
    public DbSet<PriorityCriteria> PriorityCriteria => Set<PriorityCriteria>();
    public DbSet<PriorityScoringScale> PriorityScoringScales => Set<PriorityScoringScale>();
    public DbSet<PriorityProjectScore> PriorityProjectScores => Set<PriorityProjectScore>();
    public DbSet<PriorityFrameworkAudit> PriorityFrameworkAudits => Set<PriorityFrameworkAudit>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var isSqlServer = Database.ProviderName == "Microsoft.EntityFrameworkCore.SqlServer";
        var prefix = isSqlServer ? "tbl_" : "";

        modelBuilder.Entity<IdpCycle>(e =>
        {
            e.ToTable($"{prefix}idp_cycles_ef");
            e.HasMany(c => c.Phases).WithOne(p => p.Cycle).HasForeignKey(p => p.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Objectives).WithOne(o => o.Cycle).HasForeignKey(o => o.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Projects).WithOne(p => p.Cycle).HasForeignKey(p => p.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Comments).WithOne(c => c.Cycle).HasForeignKey(c => c.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.DocumentVersions).WithOne(d => d.Cycle).HasForeignKey(d => d.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(c => c.Submissions).WithOne(s => s.Cycle).HasForeignKey(s => s.CycleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdpProcessPhase>(e =>
        {
            e.ToTable($"{prefix}idp_process_phases_ef");
            e.HasMany(p => p.Milestones).WithOne(m => m.Phase).HasForeignKey(m => m.PhaseId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdpMilestone>(e => e.ToTable($"{prefix}idp_milestones_ef"));

        modelBuilder.Entity<IdpStrategicObjective>(e =>
        {
            e.ToTable($"{prefix}idp_strategic_objectives_ef");
            e.HasMany(o => o.Projects).WithOne(p => p.Objective).HasForeignKey(p => p.ObjectiveId)
                .OnDelete(isSqlServer ? DeleteBehavior.NoAction : DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<IdpProject>(e =>
        {
            e.ToTable($"{prefix}idp_projects_ef");
            e.HasMany(p => p.Indicators).WithOne(i => i.Project).HasForeignKey(i => i.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.ObjectiveLinks).WithOne(l => l.Project).HasForeignKey(l => l.ProjectId).OnDelete(DeleteBehavior.Cascade);
            if (isSqlServer)
            {
                e.Property(p => p.Latitude).HasColumnType("float");
                e.Property(p => p.Longitude).HasColumnType("float");
            }
        });

        modelBuilder.Entity<IdpProjectIndicator>(e => e.ToTable($"{prefix}idp_project_indicators_ef"));

        modelBuilder.Entity<IdpPublicComment>(e =>
        {
            e.ToTable($"{prefix}idp_public_comments_ef");
            e.HasMany(c => c.Responses).WithOne(r => r.Comment).HasForeignKey(r => r.CommentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdpCommentResponse>(e => e.ToTable($"{prefix}idp_comment_responses_ef"));

        modelBuilder.Entity<IdpDocumentVersion>(e =>
        {
            e.ToTable($"{prefix}idp_document_versions_ef");
            e.HasMany(d => d.WorkflowTasks).WithOne(t => t.DocumentVersion).HasForeignKey(t => t.DocumentVersionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IdpWorkflowTask>(e => e.ToTable($"{prefix}idp_workflow_tasks_ef"));

        modelBuilder.Entity<IdpSubmissionLog>(e => e.ToTable($"{prefix}idp_submission_logs_ef"));

        modelBuilder.Entity<IdpAuditLog>(e => e.ToTable($"{prefix}idp_audit_logs_ef"));

        modelBuilder.Entity<MscoaSegment>(e => e.ToTable($"{prefix}mscoa_segments_ef"));

        modelBuilder.Entity<ProjectObjectiveLink>(e =>
        {
            e.ToTable($"{prefix}project_objective_links_ef");
            e.HasOne(l => l.Objective).WithMany().HasForeignKey(l => l.ObjectiveId)
                .OnDelete(isSqlServer ? DeleteBehavior.NoAction : DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PriorityFramework>(e =>
        {
            e.ToTable($"{prefix}priority_frameworks_ef");
            e.HasOne(f => f.Cycle).WithMany().HasForeignKey(f => f.CycleId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(f => f.Criteria).WithOne(c => c.Framework).HasForeignKey(c => c.FrameworkId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(f => f.ScoringScales).WithOne(s => s.Framework).HasForeignKey(s => s.FrameworkId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(f => f.ProjectScores).WithOne(s => s.Framework).HasForeignKey(s => s.FrameworkId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(f => f.AuditTrail).WithOne(a => a.Framework).HasForeignKey(a => a.FrameworkId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PriorityCriteria>(e => e.ToTable($"{prefix}priority_criteria_ef"));

        modelBuilder.Entity<PriorityScoringScale>(e => e.ToTable($"{prefix}priority_scoring_scales_ef"));

        modelBuilder.Entity<PriorityProjectScore>(e =>
        {
            e.ToTable($"{prefix}priority_project_scores_ef");
            e.HasOne(s => s.Project).WithMany().HasForeignKey(s => s.ProjectId)
                .OnDelete(isSqlServer ? DeleteBehavior.NoAction : DeleteBehavior.Cascade);
            e.HasOne(s => s.Criteria).WithMany().HasForeignKey(s => s.CriteriaId)
                .OnDelete(isSqlServer ? DeleteBehavior.NoAction : DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PriorityFrameworkAudit>(e => e.ToTable($"{prefix}priority_framework_audits_ef"));
    }
}
