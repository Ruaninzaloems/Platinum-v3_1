-- ============================================================================
-- Platinum ERP - Drop All IDP Tables (run before re-creating)
-- Run this ONLY if you want to start fresh
-- ============================================================================
IF OBJECT_ID('dbo.tbl_priority_framework_audits_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_priority_framework_audits_ef];
IF OBJECT_ID('dbo.tbl_priority_project_scores_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_priority_project_scores_ef];
IF OBJECT_ID('dbo.tbl_priority_scoring_scales_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_priority_scoring_scales_ef];
IF OBJECT_ID('dbo.tbl_priority_criteria_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_priority_criteria_ef];
IF OBJECT_ID('dbo.tbl_priority_frameworks_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_priority_frameworks_ef];
IF OBJECT_ID('dbo.tbl_project_objective_links_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_project_objective_links_ef];
IF OBJECT_ID('dbo.tbl_idp_submission_logs_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_submission_logs_ef];
IF OBJECT_ID('dbo.tbl_idp_workflow_tasks_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_workflow_tasks_ef];
IF OBJECT_ID('dbo.tbl_idp_document_versions_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_document_versions_ef];
IF OBJECT_ID('dbo.tbl_idp_comment_responses_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_comment_responses_ef];
IF OBJECT_ID('dbo.tbl_idp_public_comments_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_public_comments_ef];
IF OBJECT_ID('dbo.tbl_idp_project_indicators_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_project_indicators_ef];
IF OBJECT_ID('dbo.tbl_idp_projects_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_projects_ef];
IF OBJECT_ID('dbo.tbl_idp_strategic_objectives_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_strategic_objectives_ef];
IF OBJECT_ID('dbo.tbl_idp_milestones_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_milestones_ef];
IF OBJECT_ID('dbo.tbl_idp_process_phases_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_process_phases_ef];
IF OBJECT_ID('dbo.tbl_mscoa_segments_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_mscoa_segments_ef];
IF OBJECT_ID('dbo.tbl_idp_audit_logs_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_audit_logs_ef];
IF OBJECT_ID('dbo.tbl_idp_cycles_ef', 'U') IS NOT NULL DROP TABLE [dbo].[tbl_idp_cycles_ef];
GO
