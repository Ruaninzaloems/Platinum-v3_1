using PlatinumIDP.Models;

namespace PlatinumIDP.Data;

public static class SeedData
{
    public static async Task Initialize(IdpDbContext context)
    {
        if (context.IdpCycles.Any()) return;

        var cycle = new IdpCycle
        {
            Name = "2024/2025 - 2028/2029 IDP Cycle",
            StartYear = 2024,
            EndYear = 2029,
            Status = "Draft",
            RevisionNumber = 1,
            MunicipalityName = "George Municipality",
            Description = "Five-year Integrated Development Plan aligned to NDP Vision 2030 and Provincial Growth Strategy",
            IsLocked = false,
            CreatedBy = null,
            ModifiedBy = null
        };
        context.IdpCycles.Add(cycle);
        await context.SaveChangesAsync();

        var phases = new[]
        {
            new IdpProcessPhase { CycleId = cycle.Id, Name = "Analysis", Description = "Situational analysis including community needs assessment, institutional analysis, and spatial analysis", OrderIndex = 1, Owner = "Thabo Mokoena", StartDate = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2024, 9, 30, 0, 0, 0, DateTimeKind.Utc), Progress = 85, Status = "In Progress", CreatedBy = null },
            new IdpProcessPhase { CycleId = cycle.Id, Name = "Strategy", Description = "Formulation of vision, mission, strategic objectives, and development strategies", OrderIndex = 2, Owner = "Lindiwe Mthembu", StartDate = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2024, 12, 31, 0, 0, 0, DateTimeKind.Utc), Progress = 60, Status = "In Progress", CreatedBy = null },
            new IdpProcessPhase { CycleId = cycle.Id, Name = "Projects", Description = "Identification and prioritisation of projects and programmes", OrderIndex = 3, Owner = "Fatima Patel", StartDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 2, 28, 0, 0, 0, DateTimeKind.Utc), Progress = 30, Status = "In Progress", CreatedBy = null },
            new IdpProcessPhase { CycleId = cycle.Id, Name = "Integration", Description = "Integration of sectoral plans, spatial development framework, and budget alignment", OrderIndex = 4, Owner = "Anele Zulu", StartDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 4, 30, 0, 0, 0, DateTimeKind.Utc), Progress = 0, Status = "Not Started", CreatedBy = null },
            new IdpProcessPhase { CycleId = cycle.Id, Name = "Approval", Description = "Public participation, council review, and formal adoption", OrderIndex = 5, Owner = "Mpho Khumalo", StartDate = new DateTime(2025, 5, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 6, 30, 0, 0, 0, DateTimeKind.Utc), Progress = 0, Status = "Not Started", CreatedBy = null },
        };
        context.IdpProcessPhases.AddRange(phases);
        await context.SaveChangesAsync();

        var milestones = new[]
        {
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[0].Id, Title = "Community Needs Assessment Completed", Status = "Completed", Progress = 100, IsMandatory = true, AssignedTo = "Thabo Mokoena", DueDate = new DateTime(2024, 8, 15, 0, 0, 0, DateTimeKind.Utc), EvidenceUrl = "https://docs.ekurhuleni.gov.za/cna-report-2024.pdf", CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[0].Id, Title = "Institutional Capacity Assessment", Status = "Completed", Progress = 100, IsMandatory = true, AssignedTo = "Nomsa Dlamini", DueDate = new DateTime(2024, 8, 30, 0, 0, 0, DateTimeKind.Utc), EvidenceUrl = "https://docs.ekurhuleni.gov.za/ica-report-2024.pdf", CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[0].Id, Title = "Spatial Analysis Report", Status = "In Progress", Progress = 70, IsMandatory = true, AssignedTo = "Johan van der Merwe", DueDate = new DateTime(2024, 9, 30, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[1].Id, Title = "Vision & Mission Reviewed", Status = "In Progress", Progress = 50, IsMandatory = true, AssignedTo = "Lindiwe Mthembu", DueDate = new DateTime(2024, 11, 15, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[1].Id, Title = "Strategic Objectives Defined", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "Sipho Nkosi", DueDate = new DateTime(2024, 12, 15, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[2].Id, Title = "Project Prioritisation Workshop", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "Fatima Patel", DueDate = new DateTime(2025, 1, 31, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[2].Id, Title = "Budget Alignment Review", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "David Naidoo", DueDate = new DateTime(2025, 2, 28, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[3].Id, Title = "SDF Integration Complete", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "Anele Zulu", DueDate = new DateTime(2025, 4, 15, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[4].Id, Title = "Public Participation Hearings", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "Mpho Khumalo", DueDate = new DateTime(2025, 5, 30, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpMilestone { CycleId = cycle.Id, PhaseId = phases[4].Id, Title = "Council Adoption", Status = "Not Started", Progress = 0, IsMandatory = true, AssignedTo = "Municipal Manager", DueDate = new DateTime(2025, 6, 30, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
        };
        context.IdpMilestones.AddRange(milestones);
        await context.SaveChangesAsync();

        var objectives = new[]
        {
            new IdpStrategicObjective { CycleId = cycle.Id, Code = "SO-01", Description = "Promote sustainable economic growth and job creation", AlignmentTags = "NDP Chapter 3", NdpAlignment = "Economy and Employment", ProvincialAlignment = "PGDS Pillar 1", CreatedBy = null },
            new IdpStrategicObjective { CycleId = cycle.Id, Code = "SO-02", Description = "Ensure universal access to basic services and infrastructure", AlignmentTags = "NDP Chapter 8", NdpAlignment = "Infrastructure Development", ProvincialAlignment = "PGDS Pillar 2", CreatedBy = null },
            new IdpStrategicObjective { CycleId = cycle.Id, Code = "SO-03", Description = "Build safe and sustainable communities", AlignmentTags = "NDP Chapter 12", NdpAlignment = "Safety and Security", ProvincialAlignment = "PGDS Pillar 3", CreatedBy = null },
            new IdpStrategicObjective { CycleId = cycle.Id, Code = "SO-04", Description = "Promote good governance and institutional excellence", AlignmentTags = "NDP Chapter 14", NdpAlignment = "Governance", ProvincialAlignment = "PGDS Pillar 5", CreatedBy = null },
            new IdpStrategicObjective { CycleId = cycle.Id, Code = "SO-05", Description = "Enhance spatial transformation and environmental sustainability", AlignmentTags = "NDP Chapter 5", NdpAlignment = "Environmental Sustainability", ProvincialAlignment = "PGDS Pillar 4", CreatedBy = null },
        };
        context.IdpStrategicObjectives.AddRange(objectives);
        await context.SaveChangesAsync();

        var projects = new[]
        {
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[0].Id, Name = "George CBD Economic Hub Development", Classification = "Capital", Department = "Economic Development", Ward = "Ward 1", Region = "George CBD", Priority = "High", PriorityRanking = 2, BudgetAmount = 45000000m, FundingSource = "MIG Grant", FundingSourceSummary = "Municipal Infrastructure Grant allocation for economic infrastructure", MscoaProjectSegment = "PRJ-LED-001", MscoaFundSegment = "FND-GNT-001", MscoaRegionSegment = "REG-GRG-CBD", StartDate = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc), Status = "In Progress", Latitude = -33.9631, Longitude = 22.4617, CreatedBy = null },
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[1].Id, Name = "Garden Route Dam Bulk Water Supply Upgrade", Classification = "Capital", Department = "Water & Sanitation", Ward = "Ward 15", Region = "Wilderness", Priority = "Critical", PriorityRanking = 1, BudgetAmount = 120000000m, FundingSource = "WSIG", FundingSourceSummary = "Water Services Infrastructure Grant for bulk supply upgrade", MscoaProjectSegment = "PRJ-WTR-001", MscoaFundSegment = "FND-GNT-002", MscoaRegionSegment = "REG-GRG-WLD", StartDate = new DateTime(2024, 8, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2027, 3, 31, 0, 0, 0, DateTimeKind.Utc), Status = "In Progress", Latitude = -33.9900, Longitude = 22.5800, CreatedBy = null },
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[1].Id, Name = "Thembalethu Electrification Programme", Classification = "Capital", Department = "Energy & Electricity", Ward = "Ward 24", Region = "Thembalethu", Priority = "High", PriorityRanking = 3, BudgetAmount = 35000000m, FundingSource = "INEP", FundingSourceSummary = "Integrated National Electrification Programme funding", MscoaProjectSegment = "PRJ-ELC-001", MscoaFundSegment = "FND-GNT-003", MscoaRegionSegment = "REG-GRG-TMB", StartDate = new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 12, 31, 0, 0, 0, DateTimeKind.Utc), Status = "Planned", Latitude = -33.9850, Longitude = 22.4200, CreatedBy = null },
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[2].Id, Name = "Pacaltsdorp Community Safety CCTV Network", Classification = "Capital", Department = "Community Safety", Ward = "Ward 9", Region = "Pacaltsdorp", Priority = "Medium", PriorityRanking = 5, BudgetAmount = 18000000m, FundingSource = "Own Revenue", FundingSourceSummary = "Funded from municipal own revenue", MscoaProjectSegment = "PRJ-COM-003", MscoaFundSegment = "FND-OWN-001", MscoaRegionSegment = "REG-GRG-PAC", StartDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2025, 9, 30, 0, 0, 0, DateTimeKind.Utc), Status = "Planned", Latitude = -33.9780, Longitude = 22.4380, CreatedBy = null },
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[3].Id, Name = "George Municipality Digital Transformation", Classification = "Operational", Department = "ICT", Ward = null, Region = "George Municipal Area", Priority = "High", PriorityRanking = 4, BudgetAmount = 25000000m, FundingSource = "Own Revenue", FundingSourceSummary = "Funded from municipal own revenue for operational ICT improvements", MscoaProjectSegment = "PRJ-ICT-001", MscoaFundSegment = "FND-OWN-002", MscoaRegionSegment = "REG-GRG-ALL", StartDate = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc), Status = "In Progress", Latitude = -33.9571, Longitude = 22.4614, CreatedBy = null },
            new IdpProject { CycleId = cycle.Id, ObjectiveId = objectives[4].Id, Name = "Herolds Bay Coastal Rehabilitation & Parks", Classification = "Capital", Department = "Environmental Management", Ward = "Ward 3", Region = "Herolds Bay", Priority = "Medium", PriorityRanking = 6, BudgetAmount = 12000000m, FundingSource = "EPWP", FundingSourceSummary = "Expanded Public Works Programme allocation", MscoaProjectSegment = "PRJ-ENV-001", MscoaFundSegment = "FND-GNT-004", MscoaRegionSegment = "REG-GRG-HRB", StartDate = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc), EndDate = new DateTime(2026, 2, 28, 0, 0, 0, DateTimeKind.Utc), Status = "Planned", Latitude = -34.0530, Longitude = 22.3870, CreatedBy = null },
        };
        context.IdpProjects.AddRange(projects);
        await context.SaveChangesAsync();

        var indicators = new[]
        {
            new IdpProjectIndicator { ProjectId = projects[0].Id, Name = "Number of SMMEs supported", Baseline = "50", TargetY1 = "80", TargetY2 = "120", TargetY3 = "160", TargetY4 = "200", TargetY5 = "250", ResponsibleOfficial = "Director: LED", CreatedBy = null },
            new IdpProjectIndicator { ProjectId = projects[0].Id, Name = "Jobs created through hub", Baseline = "200", TargetY1 = "350", TargetY2 = "500", TargetY3 = "700", TargetY4 = "900", TargetY5 = "1200", ResponsibleOfficial = "Director: LED", CreatedBy = null },
            new IdpProjectIndicator { ProjectId = projects[1].Id, Name = "Households with reliable water supply", Baseline = "45000", TargetY1 = "52000", TargetY2 = "60000", TargetY3 = "68000", TargetY4 = "75000", TargetY5 = "82000", ResponsibleOfficial = "Director: Water Services", CreatedBy = null },
            new IdpProjectIndicator { ProjectId = projects[2].Id, Name = "Informal dwellings electrified", Baseline = "0", TargetY1 = "2500", TargetY2 = "5000", TargetY3 = "5000", TargetY4 = "0", TargetY5 = "0", ResponsibleOfficial = "Director: Energy", CreatedBy = null },
            new IdpProjectIndicator { ProjectId = projects[3].Id, Name = "CCTV cameras installed", Baseline = "120", TargetY1 = "180", TargetY2 = "250", TargetY3 = "250", TargetY4 = "250", TargetY5 = "250", ResponsibleOfficial = "Director: Community Safety", CreatedBy = null },
            new IdpProjectIndicator { ProjectId = projects[4].Id, Name = "Services digitised (%)", Baseline = "25", TargetY1 = "40", TargetY2 = "55", TargetY3 = "70", TargetY4 = "85", TargetY5 = "95", ResponsibleOfficial = "CIO", CreatedBy = null },
        };
        context.IdpProjectIndicators.AddRange(indicators);

        var comments = new[]
        {
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Ward Meeting", Ward = "Ward 12", Category = "Infrastructure", CommentText = "The roads in our area are in terrible condition. We need urgent repairs to the main access road connecting our community to the N12.", SubmitterName = "Mrs. B. Mokoena", SubmissionDate = new DateTime(2024, 8, 15, 0, 0, 0, DateTimeKind.Utc), Status = "Responded", LinkedProjectId = projects[0].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Website", Ward = "Ward 5", Category = "Water & Sanitation", CommentText = "We experience water outages almost every week. The bulk water supply project should be prioritised above all other projects.", SubmitterName = "Mr. J. Pillay", SubmissionDate = new DateTime(2024, 8, 20, 0, 0, 0, DateTimeKind.Utc), Status = "Responded", LinkedProjectId = projects[1].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Email", Ward = "Ward 18", Category = "Energy", CommentText = "Our informal settlement has been waiting for electricity for over 5 years. When will the electrification project reach us?", SubmitterName = "Community Leader - Daveyton", SubmissionDate = new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), Status = "Under Review", LinkedProjectId = projects[2].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Ward Meeting", Ward = "Ward 8", Category = "Safety", CommentText = "Crime is increasing in our area. We urgently need more CCTV cameras and visible policing.", SubmitterName = "Mr. S. Nkosi", SubmissionDate = new DateTime(2024, 9, 10, 0, 0, 0, DateTimeKind.Utc), Status = "Received", LinkedProjectId = projects[3].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Ward Meeting", Ward = "Ward 22", Category = "Environment", CommentText = "The parks in Germiston are neglected. Children have nowhere safe to play. Please rehabilitate our recreational spaces.", SubmitterName = "Mrs. F. Adams", SubmissionDate = new DateTime(2024, 9, 15, 0, 0, 0, DateTimeKind.Utc), Status = "Received", LinkedProjectId = projects[5].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Website", Category = "Governance", CommentText = "The municipality should invest more in digital services. Online applications and payments would save residents time.", SubmitterName = "Anonymous", SubmissionDate = new DateTime(2024, 9, 18, 0, 0, 0, DateTimeKind.Utc), Status = "Under Review", LinkedProjectId = projects[4].Id, LinkedObjectiveId = objectives[3].Id, CreatedBy = null },
            new IdpPublicComment { CycleId = cycle.Id, SourceChannel = "Email", Ward = "Ward 3", Category = "Housing", CommentText = "We have been on the housing waiting list for over 10 years. Please include more housing projects in the new IDP.", SubmitterName = "Ms. N. Zwane", SubmissionDate = new DateTime(2024, 9, 22, 0, 0, 0, DateTimeKind.Utc), Status = "Received", CreatedBy = null },
        };
        context.IdpPublicComments.AddRange(comments);
        await context.SaveChangesAsync();

        var responses = new[]
        {
            new IdpCommentResponse { CommentId = comments[0].Id, ResponseText = "The municipality has allocated R15 million for road rehabilitation in Ward 12 under the current MTREF. Work is scheduled to commence in Q3 2025.", ResponsibleOfficial = "Director: Roads & Stormwater", ResponseDate = new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
            new IdpCommentResponse { CommentId = comments[1].Id, ResponseText = "The Bulk Water Supply Upgrade Phase 3 project directly addresses water supply challenges in Ward 5. The project is currently in progress with completion expected by March 2027.", ResponsibleOfficial = "Director: Water Services", ResponseDate = new DateTime(2024, 9, 5, 0, 0, 0, DateTimeKind.Utc), CreatedBy = null },
        };
        context.IdpCommentResponses.AddRange(responses);

        var mscoaSegments = new[]
        {
            new MscoaSegment { SegmentType = "Project", Code = "PRJ", Description = "Project Segment", Level = 1, IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-WTR", Description = "Water & Sanitation", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-WTR-001", Description = "Bulk Water Supply", Level = 3, ParentCode = "PRJ-WTR", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-WTR-002", Description = "Water Reticulation", Level = 3, ParentCode = "PRJ-WTR", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-WTR-003", Description = "Sanitation Networks", Level = 3, ParentCode = "PRJ-WTR", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-WTR-004", Description = "Water Treatment Works", Level = 3, ParentCode = "PRJ-WTR", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-RDS", Description = "Roads & Stormwater", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-RDS-001", Description = "Road Construction", Level = 3, ParentCode = "PRJ-RDS", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-RDS-002", Description = "Road Rehabilitation", Level = 3, ParentCode = "PRJ-RDS", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-RDS-003", Description = "Stormwater Management", Level = 3, ParentCode = "PRJ-RDS", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ELC", Description = "Electricity & Energy", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ELC-001", Description = "Electrification", Level = 3, ParentCode = "PRJ-ELC", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ELC-002", Description = "Substation Upgrade", Level = 3, ParentCode = "PRJ-ELC", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ELC-003", Description = "Renewable Energy", Level = 3, ParentCode = "PRJ-ELC", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-HSG", Description = "Housing & Human Settlements", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-HSG-001", Description = "Housing Development", Level = 3, ParentCode = "PRJ-HSG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-HSG-002", Description = "Informal Settlement Upgrade", Level = 3, ParentCode = "PRJ-HSG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-COM", Description = "Community Services", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-COM-001", Description = "Community Facilities", Level = 3, ParentCode = "PRJ-COM", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-COM-002", Description = "Parks & Recreation", Level = 3, ParentCode = "PRJ-COM", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-COM-003", Description = "Public Safety & CCTV", Level = 3, ParentCode = "PRJ-COM", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-LED", Description = "Local Economic Development", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-LED-001", Description = "Economic Infrastructure", Level = 3, ParentCode = "PRJ-LED", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-LED-002", Description = "Tourism Development", Level = 3, ParentCode = "PRJ-LED", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ICT", Description = "Information & Communication Technology", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ICT-001", Description = "Digital Transformation", Level = 3, ParentCode = "PRJ-ICT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ICT-002", Description = "Network Infrastructure", Level = 3, ParentCode = "PRJ-ICT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ENV", Description = "Environmental Management", Level = 2, ParentCode = "PRJ", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ENV-001", Description = "Coastal Rehabilitation", Level = 3, ParentCode = "PRJ-ENV", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Project", Code = "PRJ-ENV-002", Description = "Waste Management", Level = 3, ParentCode = "PRJ-ENV", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND", Description = "Fund Segment", Level = 1, IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-OWN", Description = "Own Revenue", Level = 2, ParentCode = "FND", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-OWN-001", Description = "Operating Revenue", Level = 3, ParentCode = "FND-OWN", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-OWN-002", Description = "Capital Replacement Reserve (CRR)", Level = 3, ParentCode = "FND-OWN", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-OWN-003", Description = "Accumulated Surplus", Level = 3, ParentCode = "FND-OWN", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT", Description = "Government Grants", Level = 2, ParentCode = "FND", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-001", Description = "Municipal Infrastructure Grant (MIG)", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-002", Description = "Water Services Infrastructure Grant (WSIG)", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-003", Description = "Integrated National Electrification Programme (INEP)", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-004", Description = "Expanded Public Works Programme (EPWP)", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-005", Description = "Urban Settlements Development Grant (USDG)", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-006", Description = "Provincial Roads Maintenance Grant", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-GNT-007", Description = "Equitable Share", Level = 3, ParentCode = "FND-GNT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-EXT", Description = "External Loans", Level = 2, ParentCode = "FND", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-EXT-001", Description = "Development Bank of SA (DBSA)", Level = 3, ParentCode = "FND-EXT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Fund", Code = "FND-EXT-002", Description = "Commercial Bank Loans", Level = 3, ParentCode = "FND-EXT", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG", Description = "Region Segment", Level = 1, IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG", Description = "George Municipal Area", Level = 2, ParentCode = "REG", IsPostingLevel = false, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-CBD", Description = "George CBD", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-TMB", Description = "Thembalethu", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-PAC", Description = "Pacaltsdorp", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-WLD", Description = "Wilderness", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-HRB", Description = "Herolds Bay", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-BLN", Description = "Blanco", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
            new MscoaSegment { SegmentType = "Region", Code = "REG-GRG-ALL", Description = "George Municipal Area (All)", Level = 3, ParentCode = "REG-GRG", IsPostingLevel = true, CreatedBy = null },
        };
        context.MscoaSegments.AddRange(mscoaSegments);

        var framework = new PriorityFramework { Name = "George IDP Priority Framework v1", Version = 1, CycleId = cycle.Id, Status = "Draft", HumanWeight = 70, AiWeight = 30, AiMode = "Suggest", ScaleMin = 1, ScaleMax = 5, CreatedBy = null };
        context.PriorityFrameworks.Add(framework);
        await context.SaveChangesAsync();

        var criteria = new[]
        {
            new PriorityCriteria { FrameworkId = framework.Id, Code = "SVC-DEL", Name = "Basic Service Delivery Impact", Category = "Service Delivery", Weight = 25, IsActive = true, SortOrder = 1, CreatedBy = null },
            new PriorityCriteria { FrameworkId = framework.Id, Code = "JOB-CRT", Name = "Job Creation Potential", Category = "Economic", Weight = 20, IsActive = true, SortOrder = 2, CreatedBy = null },
            new PriorityCriteria { FrameworkId = framework.Id, Code = "COM-SAF", Name = "Community Safety Enhancement", Category = "Social", Weight = 15, IsActive = true, SortOrder = 3, CreatedBy = null },
            new PriorityCriteria { FrameworkId = framework.Id, Code = "ENV-SUS", Name = "Environmental Sustainability", Category = "Environmental", Weight = 15, IsActive = true, SortOrder = 4, CreatedBy = null },
            new PriorityCriteria { FrameworkId = framework.Id, Code = "FIN-VIA", Name = "Financial Viability", Category = "Financial", Weight = 15, IsActive = true, SortOrder = 5, CreatedBy = null },
            new PriorityCriteria { FrameworkId = framework.Id, Code = "NDP-ALN", Name = "NDP Alignment Score", Category = "Governance", Weight = 10, IsActive = true, SortOrder = 6, CreatedBy = null },
        };
        context.PriorityCriteria.AddRange(criteria);

        var scales = new[]
        {
            new PriorityScoringScale { FrameworkId = framework.Id, ScoreValue = 1, Label = "Very Low", CreatedBy = null },
            new PriorityScoringScale { FrameworkId = framework.Id, ScoreValue = 2, Label = "Low", CreatedBy = null },
            new PriorityScoringScale { FrameworkId = framework.Id, ScoreValue = 3, Label = "Medium", CreatedBy = null },
            new PriorityScoringScale { FrameworkId = framework.Id, ScoreValue = 4, Label = "High", CreatedBy = null },
            new PriorityScoringScale { FrameworkId = framework.Id, ScoreValue = 5, Label = "Very High", CreatedBy = null },
        };
        context.PriorityScoringScales.AddRange(scales);

        await context.SaveChangesAsync();
    }
}
