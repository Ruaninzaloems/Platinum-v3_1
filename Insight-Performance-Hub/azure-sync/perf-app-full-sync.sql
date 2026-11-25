--
-- PostgreSQL database dump
--

\restrict EgxTlsX3GhJn2l4lPGgCqG1aEy2YfJpdzjmqi4s1xOPAa2gPQTID2pqaYKoH5c1

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.units_of_measure DROP CONSTRAINT IF EXISTS units_of_measure_data_type_id_kpi_data_types_id_fk;
ALTER TABLE IF EXISTS ONLY public.units_of_measure DROP CONSTRAINT IF EXISTS units_of_measure_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.submission_deadlines DROP CONSTRAINT IF EXISTS submission_deadlines_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revisions DROP CONSTRAINT IF EXISTS sdbip_revisions_sdbip_item_id_sdbip_items_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revisions DROP CONSTRAINT IF EXISTS sdbip_revisions_revised_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revisions DROP CONSTRAINT IF EXISTS sdbip_revisions_approved_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revision_logs DROP CONSTRAINT IF EXISTS sdbip_revision_logs_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revision_logs DROP CONSTRAINT IF EXISTS sdbip_revision_logs_scorecard_id_scorecards_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_revision_logs DROP CONSTRAINT IF EXISTS sdbip_revision_logs_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_items DROP CONSTRAINT IF EXISTS sdbip_items_responsible_post_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_items DROP CONSTRAINT IF EXISTS sdbip_items_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.sdbip_items DROP CONSTRAINT IF EXISTS sdbip_items_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecards DROP CONSTRAINT IF EXISTS scorecards_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecards DROP CONSTRAINT IF EXISTS scorecards_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecards DROP CONSTRAINT IF EXISTS scorecards_approved_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_kpis DROP CONSTRAINT IF EXISTS scorecard_kpis_scorecard_id_scorecards_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_kpis DROP CONSTRAINT IF EXISTS scorecard_kpis_responsible_post_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.scorecard_kpis DROP CONSTRAINT IF EXISTS scorecard_kpis_custodian_post_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_code_roles_code_fk;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_secondary_reviewer_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_primary_reviewer_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_employee_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_changed_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.report_runs DROP CONSTRAINT IF EXISTS report_runs_generated_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.report_runs DROP CONSTRAINT IF EXISTS report_runs_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.report_fields DROP CONSTRAINT IF EXISTS report_fields_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.remedial_action_plans DROP CONSTRAINT IF EXISTS remedial_action_plans_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.remedial_action_plans DROP CONSTRAINT IF EXISTS remedial_action_plans_evidence_document_id_kpi_evidence_documen;
ALTER TABLE IF EXISTS ONLY public.remedial_action_plans DROP CONSTRAINT IF EXISTS remedial_action_plans_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.progress_statuses DROP CONSTRAINT IF EXISTS progress_statuses_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.period_locks DROP CONSTRAINT IF EXISTS period_locks_reopened_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.period_locks DROP CONSTRAINT IF EXISTS period_locks_locked_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.period_locks DROP CONSTRAINT IF EXISTS period_locks_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.notification_configs DROP CONSTRAINT IF EXISTS notification_configs_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.nkpa_weightings DROP CONSTRAINT IF EXISTS nkpa_weightings_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.moderation_records_individual DROP CONSTRAINT IF EXISTS moderation_records_individual_moderator_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.moderation_records_individual DROP CONSTRAINT IF EXISTS moderation_records_individual_assessment_id_individual_assessme;
ALTER TABLE IF EXISTS ONLY public.moderation_records_individual DROP CONSTRAINT IF EXISTS moderation_records_individual_agreement_id_individual_performan;
ALTER TABLE IF EXISTS ONLY public.kpi_variances DROP CONSTRAINT IF EXISTS kpi_variances_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_variances DROP CONSTRAINT IF EXISTS kpi_variances_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_review_submissions DROP CONSTRAINT IF EXISTS kpi_review_submissions_reviewer_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_review_submissions DROP CONSTRAINT IF EXISTS kpi_review_submissions_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_review_submissions DROP CONSTRAINT IF EXISTS kpi_review_submissions_actual_id_kpi_quarter_actuals_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_targets DROP CONSTRAINT IF EXISTS kpi_quarter_targets_revised_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_targets DROP CONSTRAINT IF EXISTS kpi_quarter_targets_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_actuals DROP CONSTRAINT IF EXISTS kpi_quarter_actuals_submitted_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_actuals DROP CONSTRAINT IF EXISTS kpi_quarter_actuals_reviewed_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_actuals DROP CONSTRAINT IF EXISTS kpi_quarter_actuals_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_month_activities DROP CONSTRAINT IF EXISTS kpi_month_activities_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_month_activities DROP CONSTRAINT IF EXISTS kpi_month_activities_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_moderation_outcomes DROP CONSTRAINT IF EXISTS kpi_moderation_outcomes_moderator_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_moderation_outcomes DROP CONSTRAINT IF EXISTS kpi_moderation_outcomes_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_moderation_outcomes DROP CONSTRAINT IF EXISTS kpi_moderation_outcomes_actual_id_kpi_quarter_actuals_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_groups DROP CONSTRAINT IF EXISTS kpi_groups_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_evidence_documents DROP CONSTRAINT IF EXISTS kpi_evidence_documents_verified_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_evidence_documents DROP CONSTRAINT IF EXISTS kpi_evidence_documents_uploaded_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kpi_evidence_documents DROP CONSTRAINT IF EXISTS kpi_evidence_documents_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.integration_sync_log DROP CONSTRAINT IF EXISTS integration_sync_log_synced_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_secondary_reviewer_id_users_i;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_primary_reviewer_id_users_id_;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_employee_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_dept_scorecard_id_dept_scorec;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_cycle_id_performance_cycles_i;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_approved_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.individual_assessment_records DROP CONSTRAINT IF EXISTS individual_assessment_records_reviewer_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.individual_assessment_records DROP CONSTRAINT IF EXISTS individual_assessment_records_agreement_id_individual_performan;
ALTER TABLE IF EXISTS ONLY public.employee_kpis DROP CONSTRAINT IF EXISTS employee_kpis_kpa_id_employee_kpas_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_kpis DROP CONSTRAINT IF EXISTS employee_kpis_dept_kpi_id_dept_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_kpis DROP CONSTRAINT IF EXISTS employee_kpis_agreement_id_individual_performance_agreements_id;
ALTER TABLE IF EXISTS ONLY public.employee_kpas DROP CONSTRAINT IF EXISTS employee_kpas_agreement_id_individual_performance_agreements_id;
ALTER TABLE IF EXISTS ONLY public.employee_competency_scores DROP CONSTRAINT IF EXISTS employee_competency_scores_scored_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.employee_competency_scores DROP CONSTRAINT IF EXISTS employee_competency_scores_competency_item_id_competency_templa;
ALTER TABLE IF EXISTS ONLY public.employee_competency_scores DROP CONSTRAINT IF EXISTS employee_competency_scores_agreement_id_individual_performance_;
ALTER TABLE IF EXISTS ONLY public.divisions DROP CONSTRAINT IF EXISTS divisions_department_id_departments_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_parent_scorecard_id_scorecards_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_owner_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_approved_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecard_kpis DROP CONSTRAINT IF EXISTS dept_scorecard_kpis_responsible_post_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecard_kpis DROP CONSTRAINT IF EXISTS dept_scorecard_kpis_parent_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.dept_scorecard_kpis DROP CONSTRAINT IF EXISTS dept_scorecard_kpis_dept_scorecard_id_dept_scorecards_id_fk;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.constraint_register DROP CONSTRAINT IF EXISTS constraint_register_kpi_id_scorecard_kpis_id_fk;
ALTER TABLE IF EXISTS ONLY public.constraint_register DROP CONSTRAINT IF EXISTS constraint_register_created_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.competency_template_items DROP CONSTRAINT IF EXISTS competency_template_items_template_id_competency_templates_id_f;
ALTER TABLE IF EXISTS ONLY public.competency_requirements DROP CONSTRAINT IF EXISTS competency_requirements_cycle_id_performance_cycles_id_fk;
ALTER TABLE IF EXISTS ONLY public.ai_insight_log DROP CONSTRAINT IF EXISTS ai_insight_log_generated_by_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.ai_insight_log DROP CONSTRAINT IF EXISTS ai_insight_log_cycle_id_performance_cycles_id_fk;
DROP INDEX IF EXISTS public.users_employee_number_lower_uq;
DROP INDEX IF EXISTS public.scorecard_kpis_scorecard_number_uq;
DROP INDEX IF EXISTS public.notifications_user_dedupe_uq;
DROP INDEX IF EXISTS public.divisions_department_name_uq;
DROP INDEX IF EXISTS public.departments_cycle_name_uq;
ALTER TABLE IF EXISTS ONLY public.workflow_step_configs DROP CONSTRAINT IF EXISTS workflow_step_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.units_of_measure DROP CONSTRAINT IF EXISTS units_of_measure_pkey;
ALTER TABLE IF EXISTS ONLY public.submission_deadlines DROP CONSTRAINT IF EXISTS submission_deadlines_pkey;
ALTER TABLE IF EXISTS ONLY public.sdbip_revisions DROP CONSTRAINT IF EXISTS sdbip_revisions_pkey;
ALTER TABLE IF EXISTS ONLY public.sdbip_revision_logs DROP CONSTRAINT IF EXISTS sdbip_revision_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.sdbip_items DROP CONSTRAINT IF EXISTS sdbip_items_pkey;
ALTER TABLE IF EXISTS ONLY public.sdbip_field_configs DROP CONSTRAINT IF EXISTS sdbip_field_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecards DROP CONSTRAINT IF EXISTS scorecards_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecard_types DROP CONSTRAINT IF EXISTS scorecard_types_pkey;
ALTER TABLE IF EXISTS ONLY public.scorecard_kpis DROP CONSTRAINT IF EXISTS scorecard_kpis_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_code_unique;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.reviewer_assignments DROP CONSTRAINT IF EXISTS reviewer_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.report_runs DROP CONSTRAINT IF EXISTS report_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.report_fields DROP CONSTRAINT IF EXISTS report_fields_pkey;
ALTER TABLE IF EXISTS ONLY public.remedial_action_plans DROP CONSTRAINT IF EXISTS remedial_action_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.progress_statuses DROP CONSTRAINT IF EXISTS progress_statuses_pkey;
ALTER TABLE IF EXISTS ONLY public.period_locks DROP CONSTRAINT IF EXISTS period_locks_pkey;
ALTER TABLE IF EXISTS ONLY public.performance_cycles DROP CONSTRAINT IF EXISTS performance_cycles_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_configs DROP CONSTRAINT IF EXISTS notification_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.nkpa_weightings DROP CONSTRAINT IF EXISTS nkpa_weightings_pkey;
ALTER TABLE IF EXISTS ONLY public.national_kpas DROP CONSTRAINT IF EXISTS national_kpas_pkey;
ALTER TABLE IF EXISTS ONLY public.moderation_records_individual DROP CONSTRAINT IF EXISTS moderation_records_individual_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_variances DROP CONSTRAINT IF EXISTS kpi_variances_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_review_submissions DROP CONSTRAINT IF EXISTS kpi_review_submissions_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_rating_thresholds DROP CONSTRAINT IF EXISTS kpi_rating_thresholds_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_targets DROP CONSTRAINT IF EXISTS kpi_quarter_targets_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_quarter_actuals DROP CONSTRAINT IF EXISTS kpi_quarter_actuals_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_month_activities DROP CONSTRAINT IF EXISTS kpi_month_activities_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_moderation_outcomes DROP CONSTRAINT IF EXISTS kpi_moderation_outcomes_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_groups DROP CONSTRAINT IF EXISTS kpi_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_evidence_documents DROP CONSTRAINT IF EXISTS kpi_evidence_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.kpi_data_types DROP CONSTRAINT IF EXISTS kpi_data_types_pkey;
ALTER TABLE IF EXISTS ONLY public.integration_sync_log DROP CONSTRAINT IF EXISTS integration_sync_log_pkey;
ALTER TABLE IF EXISTS ONLY public.individual_performance_agreements DROP CONSTRAINT IF EXISTS individual_performance_agreements_pkey;
ALTER TABLE IF EXISTS ONLY public.individual_assessment_records DROP CONSTRAINT IF EXISTS individual_assessment_records_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_kpis DROP CONSTRAINT IF EXISTS employee_kpis_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_kpas DROP CONSTRAINT IF EXISTS employee_kpas_pkey;
ALTER TABLE IF EXISTS ONLY public.employee_competency_scores DROP CONSTRAINT IF EXISTS employee_competency_scores_pkey;
ALTER TABLE IF EXISTS ONLY public.divisions DROP CONSTRAINT IF EXISTS divisions_pkey;
ALTER TABLE IF EXISTS ONLY public.dept_scorecards DROP CONSTRAINT IF EXISTS dept_scorecards_pkey;
ALTER TABLE IF EXISTS ONLY public.dept_scorecard_kpis DROP CONSTRAINT IF EXISTS dept_scorecard_kpis_pkey;
ALTER TABLE IF EXISTS ONLY public.departments DROP CONSTRAINT IF EXISTS departments_pkey;
ALTER TABLE IF EXISTS ONLY public.constraint_register DROP CONSTRAINT IF EXISTS constraint_register_pkey;
ALTER TABLE IF EXISTS ONLY public.competency_templates DROP CONSTRAINT IF EXISTS competency_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.competency_template_items DROP CONSTRAINT IF EXISTS competency_template_items_pkey;
ALTER TABLE IF EXISTS ONLY public.competency_requirements DROP CONSTRAINT IF EXISTS competency_requirements_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_insight_log DROP CONSTRAINT IF EXISTS ai_insight_log_pkey;
ALTER TABLE IF EXISTS public.workflow_step_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.units_of_measure ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.submission_deadlines ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sdbip_revisions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sdbip_revision_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sdbip_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sdbip_field_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scorecards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scorecard_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scorecard_kpis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_permissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reviewer_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.report_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.report_fields ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.remedial_action_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.progress_statuses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.period_locks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.performance_cycles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notification_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.nkpa_weightings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.national_kpas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.moderation_records_individual ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_variances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_review_submissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_rating_thresholds ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_quarter_targets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_quarter_actuals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_month_activities ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_moderation_outcomes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_evidence_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kpi_data_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.integration_sync_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.individual_performance_agreements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.individual_assessment_records ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_kpis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_kpas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.employee_competency_scores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.divisions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dept_scorecards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.dept_scorecard_kpis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.departments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.constraint_register ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.competency_templates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.competency_template_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.competency_requirements ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_insight_log ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.workflow_step_configs_id_seq;
DROP TABLE IF EXISTS public.workflow_step_configs;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.units_of_measure_id_seq;
DROP TABLE IF EXISTS public.units_of_measure;
DROP SEQUENCE IF EXISTS public.submission_deadlines_id_seq;
DROP TABLE IF EXISTS public.submission_deadlines;
DROP SEQUENCE IF EXISTS public.sdbip_revisions_id_seq;
DROP TABLE IF EXISTS public.sdbip_revisions;
DROP SEQUENCE IF EXISTS public.sdbip_revision_logs_id_seq;
DROP TABLE IF EXISTS public.sdbip_revision_logs;
DROP SEQUENCE IF EXISTS public.sdbip_items_id_seq;
DROP TABLE IF EXISTS public.sdbip_items;
DROP SEQUENCE IF EXISTS public.sdbip_field_configs_id_seq;
DROP TABLE IF EXISTS public.sdbip_field_configs;
DROP SEQUENCE IF EXISTS public.scorecards_id_seq;
DROP TABLE IF EXISTS public.scorecards;
DROP SEQUENCE IF EXISTS public.scorecard_types_id_seq;
DROP TABLE IF EXISTS public.scorecard_types;
DROP SEQUENCE IF EXISTS public.scorecard_kpis_id_seq;
DROP TABLE IF EXISTS public.scorecard_kpis;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.role_permissions_id_seq;
DROP TABLE IF EXISTS public.role_permissions;
DROP SEQUENCE IF EXISTS public.reviewer_assignments_id_seq;
DROP TABLE IF EXISTS public.reviewer_assignments;
DROP SEQUENCE IF EXISTS public.report_runs_id_seq;
DROP TABLE IF EXISTS public.report_runs;
DROP SEQUENCE IF EXISTS public.report_fields_id_seq;
DROP TABLE IF EXISTS public.report_fields;
DROP SEQUENCE IF EXISTS public.remedial_action_plans_id_seq;
DROP TABLE IF EXISTS public.remedial_action_plans;
DROP SEQUENCE IF EXISTS public.progress_statuses_id_seq;
DROP TABLE IF EXISTS public.progress_statuses;
DROP SEQUENCE IF EXISTS public.period_locks_id_seq;
DROP TABLE IF EXISTS public.period_locks;
DROP SEQUENCE IF EXISTS public.performance_cycles_id_seq;
DROP TABLE IF EXISTS public.performance_cycles;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.notification_configs_id_seq;
DROP TABLE IF EXISTS public.notification_configs;
DROP SEQUENCE IF EXISTS public.nkpa_weightings_id_seq;
DROP TABLE IF EXISTS public.nkpa_weightings;
DROP SEQUENCE IF EXISTS public.national_kpas_id_seq;
DROP TABLE IF EXISTS public.national_kpas;
DROP SEQUENCE IF EXISTS public.moderation_records_individual_id_seq;
DROP TABLE IF EXISTS public.moderation_records_individual;
DROP SEQUENCE IF EXISTS public.kpi_variances_id_seq;
DROP TABLE IF EXISTS public.kpi_variances;
DROP SEQUENCE IF EXISTS public.kpi_review_submissions_id_seq;
DROP TABLE IF EXISTS public.kpi_review_submissions;
DROP SEQUENCE IF EXISTS public.kpi_rating_thresholds_id_seq;
DROP TABLE IF EXISTS public.kpi_rating_thresholds;
DROP SEQUENCE IF EXISTS public.kpi_quarter_targets_id_seq;
DROP TABLE IF EXISTS public.kpi_quarter_targets;
DROP SEQUENCE IF EXISTS public.kpi_quarter_actuals_id_seq;
DROP TABLE IF EXISTS public.kpi_quarter_actuals;
DROP SEQUENCE IF EXISTS public.kpi_month_activities_id_seq;
DROP TABLE IF EXISTS public.kpi_month_activities;
DROP SEQUENCE IF EXISTS public.kpi_moderation_outcomes_id_seq;
DROP TABLE IF EXISTS public.kpi_moderation_outcomes;
DROP SEQUENCE IF EXISTS public.kpi_groups_id_seq;
DROP TABLE IF EXISTS public.kpi_groups;
DROP SEQUENCE IF EXISTS public.kpi_evidence_documents_id_seq;
DROP TABLE IF EXISTS public.kpi_evidence_documents;
DROP SEQUENCE IF EXISTS public.kpi_data_types_id_seq;
DROP TABLE IF EXISTS public.kpi_data_types;
DROP SEQUENCE IF EXISTS public.integration_sync_log_id_seq;
DROP TABLE IF EXISTS public.integration_sync_log;
DROP SEQUENCE IF EXISTS public.individual_performance_agreements_id_seq;
DROP TABLE IF EXISTS public.individual_performance_agreements;
DROP SEQUENCE IF EXISTS public.individual_assessment_records_id_seq;
DROP TABLE IF EXISTS public.individual_assessment_records;
DROP SEQUENCE IF EXISTS public.employee_kpis_id_seq;
DROP TABLE IF EXISTS public.employee_kpis;
DROP SEQUENCE IF EXISTS public.employee_kpas_id_seq;
DROP TABLE IF EXISTS public.employee_kpas;
DROP SEQUENCE IF EXISTS public.employee_competency_scores_id_seq;
DROP TABLE IF EXISTS public.employee_competency_scores;
DROP SEQUENCE IF EXISTS public.divisions_id_seq;
DROP TABLE IF EXISTS public.divisions;
DROP SEQUENCE IF EXISTS public.dept_scorecards_id_seq;
DROP TABLE IF EXISTS public.dept_scorecards;
DROP SEQUENCE IF EXISTS public.dept_scorecard_kpis_id_seq;
DROP TABLE IF EXISTS public.dept_scorecard_kpis;
DROP SEQUENCE IF EXISTS public.departments_id_seq;
DROP TABLE IF EXISTS public.departments;
DROP SEQUENCE IF EXISTS public.constraint_register_id_seq;
DROP TABLE IF EXISTS public.constraint_register;
DROP SEQUENCE IF EXISTS public.competency_templates_id_seq;
DROP TABLE IF EXISTS public.competency_templates;
DROP SEQUENCE IF EXISTS public.competency_template_items_id_seq;
DROP TABLE IF EXISTS public.competency_template_items;
DROP SEQUENCE IF EXISTS public.competency_requirements_id_seq;
DROP TABLE IF EXISTS public.competency_requirements;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.ai_insight_log_id_seq;
DROP TABLE IF EXISTS public.ai_insight_log;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_insight_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_insight_log (
    id integer NOT NULL,
    insight_type text NOT NULL,
    cycle_id integer,
    department_id integer,
    kpi_id integer,
    request_payload jsonb,
    response_payload jsonb,
    summary text,
    risk_level text,
    is_advisory boolean DEFAULT true NOT NULL,
    generated_by_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_insight_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_insight_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_insight_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_insight_log_id_seq OWNED BY public.ai_insight_log.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer NOT NULL,
    old_value text,
    new_value text,
    cycle_id integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: competency_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competency_requirements (
    id integer NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    weight double precision NOT NULL,
    cycle_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: competency_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competency_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competency_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competency_requirements_id_seq OWNED BY public.competency_requirements.id;


--
-- Name: competency_template_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competency_template_items (
    id integer NOT NULL,
    template_id integer NOT NULL,
    competency_name text NOT NULL,
    description text,
    weighting double precision DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: competency_template_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competency_template_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competency_template_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competency_template_items_id_seq OWNED BY public.competency_template_items.id;


--
-- Name: competency_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competency_templates (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    post_level text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: competency_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competency_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competency_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competency_templates_id_seq OWNED BY public.competency_templates.id;


--
-- Name: constraint_register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.constraint_register (
    id integer NOT NULL,
    kpi_id integer,
    department_id integer,
    category text NOT NULL,
    description text NOT NULL,
    impact text,
    mitigation_action text,
    status text DEFAULT 'Open'::text NOT NULL,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: constraint_register_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.constraint_register_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: constraint_register_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.constraint_register_id_seq OWNED BY public.constraint_register.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name text NOT NULL,
    cycle_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: dept_scorecard_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dept_scorecard_kpis (
    id integer NOT NULL,
    dept_scorecard_id integer NOT NULL,
    parent_kpi_id integer,
    kpi_number text NOT NULL,
    description text NOT NULL,
    strategic_objective text,
    nkpa_link text,
    responsible_post_id integer,
    baseline text,
    annual_target text NOT NULL,
    annual_budget_target double precision,
    weighting double precision DEFAULT 0 NOT NULL,
    unit_of_measure_id integer,
    is_cumulative boolean DEFAULT false NOT NULL,
    is_inherited boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    custom_fields jsonb
);


--
-- Name: dept_scorecard_kpis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dept_scorecard_kpis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dept_scorecard_kpis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dept_scorecard_kpis_id_seq OWNED BY public.dept_scorecard_kpis.id;


--
-- Name: dept_scorecards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dept_scorecards (
    id integer NOT NULL,
    name text NOT NULL,
    cycle_id integer NOT NULL,
    department_id integer NOT NULL,
    department_name text NOT NULL,
    parent_scorecard_id integer,
    owner_id integer,
    status text DEFAULT 'Draft'::text NOT NULL,
    approved_by_id integer,
    approved_at timestamp without time zone,
    approval_comments text,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dept_scorecards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dept_scorecards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dept_scorecards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dept_scorecards_id_seq OWNED BY public.dept_scorecards.id;


--
-- Name: divisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.divisions (
    id integer NOT NULL,
    department_id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: divisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.divisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: divisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.divisions_id_seq OWNED BY public.divisions.id;


--
-- Name: employee_competency_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_competency_scores (
    id integer NOT NULL,
    agreement_id integer NOT NULL,
    competency_item_id integer NOT NULL,
    competency_name text NOT NULL,
    weighting double precision DEFAULT 0 NOT NULL,
    self_score double precision,
    reviewer_score double precision,
    moderated_score double precision,
    development_need text,
    scored_by_id integer,
    scored_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_competency_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_competency_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_competency_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_competency_scores_id_seq OWNED BY public.employee_competency_scores.id;


--
-- Name: employee_kpas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_kpas (
    id integer NOT NULL,
    agreement_id integer NOT NULL,
    title text NOT NULL,
    description text,
    weighting double precision DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_kpas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_kpas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_kpas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_kpas_id_seq OWNED BY public.employee_kpas.id;


--
-- Name: employee_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_kpis (
    id integer NOT NULL,
    kpa_id integer NOT NULL,
    agreement_id integer NOT NULL,
    dept_kpi_id integer,
    kpi_number text NOT NULL,
    description text NOT NULL,
    unit_of_measure text,
    baseline text,
    annual_target text NOT NULL,
    weighting double precision DEFAULT 0 NOT NULL,
    q1_target text,
    q2_target text,
    q3_target text,
    q4_target text,
    q1_actual text,
    q2_actual text,
    q3_actual text,
    q4_actual text,
    q1_score double precision,
    q2_score double precision,
    q3_score double precision,
    q4_score double precision,
    annual_score double precision,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_kpis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_kpis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_kpis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_kpis_id_seq OWNED BY public.employee_kpis.id;


--
-- Name: individual_assessment_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.individual_assessment_records (
    id integer NOT NULL,
    agreement_id integer NOT NULL,
    assessment_type text NOT NULL,
    quarter integer,
    reviewer_id integer NOT NULL,
    kpi_score double precision,
    competency_score double precision,
    overall_score double precision,
    comments text,
    development_needs text,
    performance_gaps text,
    status text DEFAULT 'Draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: individual_assessment_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.individual_assessment_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: individual_assessment_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.individual_assessment_records_id_seq OWNED BY public.individual_assessment_records.id;


--
-- Name: individual_performance_agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.individual_performance_agreements (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_name text NOT NULL,
    post_title text NOT NULL,
    department_id integer NOT NULL,
    department_name text NOT NULL,
    dept_scorecard_id integer,
    primary_reviewer_id integer,
    secondary_reviewer_id integer,
    status text DEFAULT 'Draft'::text NOT NULL,
    kpi_weight_pct double precision DEFAULT 70 NOT NULL,
    competency_weight_pct double precision DEFAULT 30 NOT NULL,
    final_score double precision,
    approved_by_id integer,
    approved_at timestamp without time zone,
    approval_comments text,
    locked_at timestamp without time zone,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: individual_performance_agreements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.individual_performance_agreements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: individual_performance_agreements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.individual_performance_agreements_id_seq OWNED BY public.individual_performance_agreements.id;


--
-- Name: integration_sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integration_sync_log (
    id integer NOT NULL,
    integration_type text NOT NULL,
    direction text DEFAULT 'pull'::text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    status text DEFAULT 'Pending'::text NOT NULL,
    record_count integer,
    error_message text,
    synced_by_id integer,
    synced_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: integration_sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.integration_sync_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: integration_sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.integration_sync_log_id_seq OWNED BY public.integration_sync_log.id;


--
-- Name: kpi_data_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_data_types (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: kpi_data_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_data_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_data_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_data_types_id_seq OWNED BY public.kpi_data_types.id;


--
-- Name: kpi_evidence_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_evidence_documents (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    file_path text NOT NULL,
    document_type text,
    description text,
    uploaded_by_id integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    verification_status text DEFAULT 'Pending'::text NOT NULL,
    verified_by_id integer,
    verified_at timestamp without time zone,
    rejection_reason text,
    period_type text DEFAULT 'quarterly'::text NOT NULL
);


--
-- Name: kpi_evidence_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_evidence_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_evidence_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_evidence_documents_id_seq OWNED BY public.kpi_evidence_documents.id;


--
-- Name: kpi_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_groups (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    parent_id integer,
    cycle_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: kpi_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_groups_id_seq OWNED BY public.kpi_groups.id;


--
-- Name: kpi_moderation_outcomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_moderation_outcomes (
    id integer NOT NULL,
    actual_id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    moderator_user_id integer NOT NULL,
    outcome text NOT NULL,
    score_adjustment_reason text,
    adjusted_score double precision,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: kpi_moderation_outcomes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_moderation_outcomes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_moderation_outcomes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_moderation_outcomes_id_seq OWNED BY public.kpi_moderation_outcomes.id;


--
-- Name: kpi_month_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_month_activities (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    month integer NOT NULL,
    description text NOT NULL,
    due_date date NOT NULL,
    owner_id integer,
    status text DEFAULT 'Pending'::text NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: kpi_month_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_month_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_month_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_month_activities_id_seq OWNED BY public.kpi_month_activities.id;


--
-- Name: kpi_quarter_actuals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_quarter_actuals (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    actual_value text NOT NULL,
    commentary text,
    is_achieved boolean,
    progress_status_id integer,
    is_on_hold boolean DEFAULT false NOT NULL,
    on_hold_reason text,
    challenge_narrative text,
    corrective_action text,
    underperformance_reason text,
    overperformance_reason text,
    budget_implication text,
    analysis_notes text,
    submitted_by_id integer NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL,
    is_late_submission boolean DEFAULT false NOT NULL,
    late_override_reason text,
    status text DEFAULT 'Draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    review_level text,
    review_status text,
    review_comments text,
    reviewed_by_id integer,
    reviewed_at timestamp without time zone,
    period_type text DEFAULT 'quarterly'::text NOT NULL,
    assessment text,
    score_pct double precision,
    rating_level integer,
    rating_label text,
    qualitative_score_pct double precision,
    ai_rationale text
);


--
-- Name: kpi_quarter_actuals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_quarter_actuals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_quarter_actuals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_quarter_actuals_id_seq OWNED BY public.kpi_quarter_actuals.id;


--
-- Name: kpi_quarter_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_quarter_targets (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    target_value text NOT NULL,
    budget_value double precision,
    evidence_expected text,
    is_approved_baseline boolean DEFAULT false NOT NULL,
    baseline_target_value text,
    baseline_budget_value double precision,
    revision_reason text,
    revised_at timestamp without time zone,
    revised_by_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    target_status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: kpi_quarter_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_quarter_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_quarter_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_quarter_targets_id_seq OWNED BY public.kpi_quarter_targets.id;


--
-- Name: kpi_rating_thresholds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_rating_thresholds (
    id integer NOT NULL,
    level integer NOT NULL,
    label text NOT NULL,
    descriptor text DEFAULT ''::text NOT NULL,
    min_pct integer,
    max_pct integer
);


--
-- Name: kpi_rating_thresholds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_rating_thresholds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_rating_thresholds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_rating_thresholds_id_seq OWNED BY public.kpi_rating_thresholds.id;


--
-- Name: kpi_review_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_review_submissions (
    id integer NOT NULL,
    actual_id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    reviewer_user_id integer NOT NULL,
    action text NOT NULL,
    comments text,
    return_reason text,
    assessment_rating double precision,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: kpi_review_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_review_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_review_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_review_submissions_id_seq OWNED BY public.kpi_review_submissions.id;


--
-- Name: kpi_variances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_variances (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    variance_percentage double precision,
    variance_reason text NOT NULL,
    is_underperformance boolean DEFAULT true NOT NULL,
    budget_impact text,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: kpi_variances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpi_variances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpi_variances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpi_variances_id_seq OWNED BY public.kpi_variances.id;


--
-- Name: moderation_records_individual; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_records_individual (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    agreement_id integer NOT NULL,
    moderator_id integer NOT NULL,
    outcome text NOT NULL,
    original_score double precision,
    adjusted_score double precision,
    adjustment_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: moderation_records_individual_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.moderation_records_individual_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: moderation_records_individual_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.moderation_records_individual_id_seq OWNED BY public.moderation_records_individual.id;


--
-- Name: national_kpas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.national_kpas (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: national_kpas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.national_kpas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: national_kpas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.national_kpas_id_seq OWNED BY public.national_kpas.id;


--
-- Name: nkpa_weightings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nkpa_weightings (
    id integer NOT NULL,
    nkpa_name text NOT NULL,
    weight double precision NOT NULL,
    scope text NOT NULL,
    cycle_id integer NOT NULL,
    department_id integer
);


--
-- Name: nkpa_weightings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nkpa_weightings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nkpa_weightings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nkpa_weightings_id_seq OWNED BY public.nkpa_weightings.id;


--
-- Name: notification_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_configs (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    event_type text NOT NULL,
    days_before integer DEFAULT 7 NOT NULL,
    is_email boolean DEFAULT false NOT NULL,
    is_in_app boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: notification_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notification_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notification_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notification_configs_id_seq OWNED BY public.notification_configs.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    link text,
    dedupe_key text
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: performance_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_cycles (
    id integer NOT NULL,
    financial_year_label text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: performance_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.performance_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: performance_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.performance_cycles_id_seq OWNED BY public.performance_cycles.id;


--
-- Name: period_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.period_locks (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    quarter integer,
    period_type text NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    locked_by_id integer,
    locked_at timestamp without time zone,
    lock_comments text,
    reopened_by_id integer,
    reopened_at timestamp without time zone,
    reopen_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: period_locks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.period_locks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: period_locks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.period_locks_id_seq OWNED BY public.period_locks.id;


--
-- Name: progress_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress_statuses (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    cycle_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: progress_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.progress_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: progress_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.progress_statuses_id_seq OWNED BY public.progress_statuses.id;


--
-- Name: remedial_action_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remedial_action_plans (
    id integer NOT NULL,
    kpi_id integer NOT NULL,
    quarter integer NOT NULL,
    action_description text NOT NULL,
    action_owner_id text,
    due_date text NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    evidence_document_id integer,
    completed_at timestamp without time zone,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: remedial_action_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remedial_action_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: remedial_action_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remedial_action_plans_id_seq OWNED BY public.remedial_action_plans.id;


--
-- Name: report_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_fields (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    report_type text NOT NULL,
    field_name text NOT NULL,
    field_label text NOT NULL,
    field_type text NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: report_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_fields_id_seq OWNED BY public.report_fields.id;


--
-- Name: report_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_runs (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    report_type text NOT NULL,
    quarter integer,
    department_id integer,
    scorecard_type text,
    title text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    generated_by_id integer NOT NULL,
    generated_at timestamp without time zone,
    file_path text,
    file_format text,
    metadata text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: report_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.report_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: report_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.report_runs_id_seq OWNED BY public.report_runs.id;


--
-- Name: reviewer_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviewer_assignments (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    employee_id integer NOT NULL,
    primary_reviewer_id integer NOT NULL,
    secondary_reviewer_id integer,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    changed_by_id integer NOT NULL,
    change_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviewer_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviewer_assignments_id_seq OWNED BY public.reviewer_assignments.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_code text NOT NULL,
    permission text NOT NULL
);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text DEFAULT ''::text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: scorecard_kpis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scorecard_kpis (
    id integer NOT NULL,
    scorecard_id integer NOT NULL,
    kpi_number text NOT NULL,
    description text NOT NULL,
    idp_reference text,
    strategic_objective text,
    programme text,
    responsible_post_id integer,
    custodian_post_id integer,
    baseline text,
    annual_target text NOT NULL,
    annual_budget_target double precision,
    evidence_source text,
    evidence_portfolio text,
    weighting double precision DEFAULT 0 NOT NULL,
    funding_source text,
    budget_description text,
    unit_of_measure_id integer,
    data_type_id integer,
    kpi_group_id integer,
    status text DEFAULT 'Draft'::text NOT NULL,
    is_cumulative boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    custom_fields jsonb,
    return_comments text
);


--
-- Name: scorecard_kpis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scorecard_kpis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scorecard_kpis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scorecard_kpis_id_seq OWNED BY public.scorecard_kpis.id;


--
-- Name: scorecard_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scorecard_types (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: scorecard_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scorecard_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scorecard_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scorecard_types_id_seq OWNED BY public.scorecard_types.id;


--
-- Name: scorecards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scorecards (
    id integer NOT NULL,
    name text NOT NULL,
    cycle_id integer NOT NULL,
    scorecard_type text DEFAULT 'organisational'::text NOT NULL,
    department_id integer,
    status text DEFAULT 'Draft'::text NOT NULL,
    approved_by_id integer,
    approved_at timestamp without time zone,
    approval_comments text,
    created_by_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    return_comments text,
    field_config_snapshot jsonb,
    parent_scorecard_id integer
);


--
-- Name: scorecards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scorecards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scorecards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scorecards_id_seq OWNED BY public.scorecards.id;


--
-- Name: sdbip_field_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sdbip_field_configs (
    id integer NOT NULL,
    sdbip_type text NOT NULL,
    field_kind text DEFAULT 'primary'::text NOT NULL,
    field_key text NOT NULL,
    field_label text NOT NULL,
    field_type text DEFAULT 'text'::text NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sdbip_field_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sdbip_field_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sdbip_field_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sdbip_field_configs_id_seq OWNED BY public.sdbip_field_configs.id;


--
-- Name: sdbip_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sdbip_items (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    kpi_id integer,
    department_id integer,
    description text NOT NULL,
    q1_target text,
    q2_target text,
    q3_target text,
    q4_target text,
    q1_budget double precision,
    q2_budget double precision,
    q3_budget double precision,
    q4_budget double precision,
    annual_budget double precision,
    responsible_post_id integer,
    status text DEFAULT 'Draft'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sdbip_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sdbip_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sdbip_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sdbip_items_id_seq OWNED BY public.sdbip_items.id;


--
-- Name: sdbip_revision_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sdbip_revision_logs (
    id integer NOT NULL,
    scorecard_id integer NOT NULL,
    kpi_id integer,
    revision_type text NOT NULL,
    field_name text,
    old_value text,
    new_value text,
    revision_reason text,
    quarter integer,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sdbip_revision_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sdbip_revision_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sdbip_revision_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sdbip_revision_logs_id_seq OWNED BY public.sdbip_revision_logs.id;


--
-- Name: sdbip_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sdbip_revisions (
    id integer NOT NULL,
    sdbip_item_id integer NOT NULL,
    revision_number integer DEFAULT 1 NOT NULL,
    reason text NOT NULL,
    previous_q1_target text,
    previous_q2_target text,
    previous_q3_target text,
    previous_q4_target text,
    previous_q1_budget double precision,
    previous_q2_budget double precision,
    previous_q3_budget double precision,
    previous_q4_budget double precision,
    new_q1_target text,
    new_q2_target text,
    new_q3_target text,
    new_q4_target text,
    new_q1_budget double precision,
    new_q2_budget double precision,
    new_q3_budget double precision,
    new_q4_budget double precision,
    revised_by_id integer NOT NULL,
    approved_by_id integer,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone
);


--
-- Name: sdbip_revisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sdbip_revisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sdbip_revisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sdbip_revisions_id_seq OWNED BY public.sdbip_revisions.id;


--
-- Name: submission_deadlines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission_deadlines (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    quarter integer NOT NULL,
    deadline_date date NOT NULL,
    reminder_days_before integer DEFAULT 7 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: submission_deadlines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.submission_deadlines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: submission_deadlines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.submission_deadlines_id_seq OWNED BY public.submission_deadlines.id;


--
-- Name: units_of_measure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units_of_measure (
    id integer NOT NULL,
    name text NOT NULL,
    abbreviation text DEFAULT ''::text NOT NULL,
    cycle_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    data_type_id integer
);


--
-- Name: units_of_measure_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_of_measure_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_of_measure_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_of_measure_id_seq OWNED BY public.units_of_measure.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    display_name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'responsible_post'::text NOT NULL,
    department_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    employee_number text,
    job_title text,
    level text,
    supervisor_id integer,
    first_name text,
    surname text,
    id_number text,
    cellphone text,
    division_id integer,
    performance_category text,
    start_date date,
    termination_date date
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workflow_step_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_step_configs (
    id integer NOT NULL,
    scorecard_type_id integer,
    step_name text NOT NULL,
    step_order integer NOT NULL,
    required_role text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: workflow_step_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workflow_step_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workflow_step_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workflow_step_configs_id_seq OWNED BY public.workflow_step_configs.id;


--
-- Name: ai_insight_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insight_log ALTER COLUMN id SET DEFAULT nextval('public.ai_insight_log_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: competency_requirements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_requirements ALTER COLUMN id SET DEFAULT nextval('public.competency_requirements_id_seq'::regclass);


--
-- Name: competency_template_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_template_items ALTER COLUMN id SET DEFAULT nextval('public.competency_template_items_id_seq'::regclass);


--
-- Name: competency_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_templates ALTER COLUMN id SET DEFAULT nextval('public.competency_templates_id_seq'::regclass);


--
-- Name: constraint_register id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constraint_register ALTER COLUMN id SET DEFAULT nextval('public.constraint_register_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: dept_scorecard_kpis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecard_kpis ALTER COLUMN id SET DEFAULT nextval('public.dept_scorecard_kpis_id_seq'::regclass);


--
-- Name: dept_scorecards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards ALTER COLUMN id SET DEFAULT nextval('public.dept_scorecards_id_seq'::regclass);


--
-- Name: divisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisions ALTER COLUMN id SET DEFAULT nextval('public.divisions_id_seq'::regclass);


--
-- Name: employee_competency_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_competency_scores ALTER COLUMN id SET DEFAULT nextval('public.employee_competency_scores_id_seq'::regclass);


--
-- Name: employee_kpas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpas ALTER COLUMN id SET DEFAULT nextval('public.employee_kpas_id_seq'::regclass);


--
-- Name: employee_kpis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpis ALTER COLUMN id SET DEFAULT nextval('public.employee_kpis_id_seq'::regclass);


--
-- Name: individual_assessment_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_assessment_records ALTER COLUMN id SET DEFAULT nextval('public.individual_assessment_records_id_seq'::regclass);


--
-- Name: individual_performance_agreements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements ALTER COLUMN id SET DEFAULT nextval('public.individual_performance_agreements_id_seq'::regclass);


--
-- Name: integration_sync_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_sync_log ALTER COLUMN id SET DEFAULT nextval('public.integration_sync_log_id_seq'::regclass);


--
-- Name: kpi_data_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_data_types ALTER COLUMN id SET DEFAULT nextval('public.kpi_data_types_id_seq'::regclass);


--
-- Name: kpi_evidence_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_evidence_documents ALTER COLUMN id SET DEFAULT nextval('public.kpi_evidence_documents_id_seq'::regclass);


--
-- Name: kpi_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_groups ALTER COLUMN id SET DEFAULT nextval('public.kpi_groups_id_seq'::regclass);


--
-- Name: kpi_moderation_outcomes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_moderation_outcomes ALTER COLUMN id SET DEFAULT nextval('public.kpi_moderation_outcomes_id_seq'::regclass);


--
-- Name: kpi_month_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_month_activities ALTER COLUMN id SET DEFAULT nextval('public.kpi_month_activities_id_seq'::regclass);


--
-- Name: kpi_quarter_actuals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_actuals ALTER COLUMN id SET DEFAULT nextval('public.kpi_quarter_actuals_id_seq'::regclass);


--
-- Name: kpi_quarter_targets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_targets ALTER COLUMN id SET DEFAULT nextval('public.kpi_quarter_targets_id_seq'::regclass);


--
-- Name: kpi_rating_thresholds id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_rating_thresholds ALTER COLUMN id SET DEFAULT nextval('public.kpi_rating_thresholds_id_seq'::regclass);


--
-- Name: kpi_review_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_review_submissions ALTER COLUMN id SET DEFAULT nextval('public.kpi_review_submissions_id_seq'::regclass);


--
-- Name: kpi_variances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_variances ALTER COLUMN id SET DEFAULT nextval('public.kpi_variances_id_seq'::regclass);


--
-- Name: moderation_records_individual id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_records_individual ALTER COLUMN id SET DEFAULT nextval('public.moderation_records_individual_id_seq'::regclass);


--
-- Name: national_kpas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.national_kpas ALTER COLUMN id SET DEFAULT nextval('public.national_kpas_id_seq'::regclass);


--
-- Name: nkpa_weightings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nkpa_weightings ALTER COLUMN id SET DEFAULT nextval('public.nkpa_weightings_id_seq'::regclass);


--
-- Name: notification_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_configs ALTER COLUMN id SET DEFAULT nextval('public.notification_configs_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: performance_cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_cycles ALTER COLUMN id SET DEFAULT nextval('public.performance_cycles_id_seq'::regclass);


--
-- Name: period_locks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period_locks ALTER COLUMN id SET DEFAULT nextval('public.period_locks_id_seq'::regclass);


--
-- Name: progress_statuses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_statuses ALTER COLUMN id SET DEFAULT nextval('public.progress_statuses_id_seq'::regclass);


--
-- Name: remedial_action_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remedial_action_plans ALTER COLUMN id SET DEFAULT nextval('public.remedial_action_plans_id_seq'::regclass);


--
-- Name: report_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_fields ALTER COLUMN id SET DEFAULT nextval('public.report_fields_id_seq'::regclass);


--
-- Name: report_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_runs ALTER COLUMN id SET DEFAULT nextval('public.report_runs_id_seq'::regclass);


--
-- Name: reviewer_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments ALTER COLUMN id SET DEFAULT nextval('public.reviewer_assignments_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: scorecard_kpis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_kpis ALTER COLUMN id SET DEFAULT nextval('public.scorecard_kpis_id_seq'::regclass);


--
-- Name: scorecard_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_types ALTER COLUMN id SET DEFAULT nextval('public.scorecard_types_id_seq'::regclass);


--
-- Name: scorecards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecards ALTER COLUMN id SET DEFAULT nextval('public.scorecards_id_seq'::regclass);


--
-- Name: sdbip_field_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_field_configs ALTER COLUMN id SET DEFAULT nextval('public.sdbip_field_configs_id_seq'::regclass);


--
-- Name: sdbip_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_items ALTER COLUMN id SET DEFAULT nextval('public.sdbip_items_id_seq'::regclass);


--
-- Name: sdbip_revision_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revision_logs ALTER COLUMN id SET DEFAULT nextval('public.sdbip_revision_logs_id_seq'::regclass);


--
-- Name: sdbip_revisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revisions ALTER COLUMN id SET DEFAULT nextval('public.sdbip_revisions_id_seq'::regclass);


--
-- Name: submission_deadlines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_deadlines ALTER COLUMN id SET DEFAULT nextval('public.submission_deadlines_id_seq'::regclass);


--
-- Name: units_of_measure id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units_of_measure ALTER COLUMN id SET DEFAULT nextval('public.units_of_measure_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workflow_step_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_step_configs ALTER COLUMN id SET DEFAULT nextval('public.workflow_step_configs_id_seq'::regclass);


--
-- Data for Name: ai_insight_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_insight_log (id, insight_type, cycle_id, department_id, kpi_id, request_payload, response_payload, summary, risk_level, is_advisory, generated_by_id, created_at) FROM stdin;
9	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 18:10:12.100292
10	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 18:10:12.111627
11	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 18:10:12.113839
14	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 19:30:57.418496
15	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 19:30:57.420907
16	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 19:30:57.424734
17	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 19:30:57.426302
18	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 19:30:57.442277
19	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 20:14:32.970828
20	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 20:14:32.974186
21	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 20:14:32.974873
22	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 20:14:32.97764
23	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 20:14:33.357925
29	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 20:16:12.676256
30	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 20:16:13.055022
31	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 20:16:13.376711
32	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 20:16:13.3818
33	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 20:16:13.382875
35	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 20:41:04.948566
36	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 20:41:05.254928
37	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 20:41:05.563519
38	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 20:41:05.865526
39	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 20:41:06.469788
45	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 20:41:55.710818
46	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 20:41:56.015165
47	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 20:41:56.288395
48	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 20:41:56.306187
49	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 20:41:56.319028
53	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 20:49:53.84967
54	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 20:49:53.851242
55	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 20:49:53.853985
56	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 23 checks.	\N	t	1	2026-04-09 20:49:53.862335
57	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 20:49:53.868404
60	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-09 23:02:20.987951
61	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-09 23:02:21.304073
62	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-09 23:02:21.600691
63	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-09 23:02:21.62908
64	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-09 23:02:21.634755
66	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-10 03:25:32.999169
67	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-10 03:25:33.320764
68	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 2 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-10 03:25:33.62534
69	evidence-gaps	1	\N	\N	\N	\N	36 evidence gaps detected across 18 KPIs	high	t	1	2026-04-10 03:25:33.627089
70	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-10 03:25:33.630576
73	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-10 04:38:53.521345
74	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-10 04:38:53.523342
75	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-10 04:38:53.525518
76	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-10 04:38:53.531986
77	evidence-gaps	1	\N	\N	\N	\N	34 evidence gaps detected across 18 KPIs	high	t	1	2026-04-10 04:38:53.543722
79	evidence-gaps	1	\N	\N	\N	\N	34 evidence gaps detected across 18 KPIs	high	t	1	2026-04-10 05:09:44.283913
80	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-10 05:09:44.736385
81	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-10 05:09:44.917821
82	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-10 05:09:44.936475
83	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-10 05:09:44.937829
86	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-10 08:26:32.689537
87	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-10 08:26:32.978667
88	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-10 08:26:32.987023
89	evidence-gaps	1	\N	\N	\N	\N	34 evidence gaps detected across 18 KPIs	high	t	1	2026-04-10 08:26:33.01351
90	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-10 08:26:33.019648
93	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 9 high risk, 0 medium risk, 9 on track.	high	t	1	2026-04-10 12:58:04.422904
94	at-risk-kpis	1	\N	\N	\N	\N	9 KPIs flagged: 9 high risk, 0 medium risk.	high	t	1	2026-04-10 12:58:04.844002
95	alignment-check	1	\N	\N	\N	\N	Alignment score: 93%. 2 issues found across 29 checks.	medium	t	1	2026-04-10 12:58:05.118307
96	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.7/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-10 12:58:05.124814
97	evidence-gaps	1	\N	\N	\N	\N	34 evidence gaps detected across 18 KPIs	high	t	1	2026-04-10 12:58:05.136872
101	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 07:41:28.622758
102	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 07:41:28.940044
103	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 07:41:28.951107
104	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 07:41:28.955037
105	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 07:41:28.968136
108	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 10:50:34.441771
109	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 10:50:34.842031
110	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 10:50:35.061701
111	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 10:50:35.062402
112	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 10:50:35.070277
114	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 11:54:12.425734
115	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 11:54:12.842459
116	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 11:54:13.037608
117	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 11:54:13.050649
118	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 11:54:13.062406
124	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 11:54:22.788139
125	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 11:54:23.179571
126	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 11:54:23.18561
127	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 11:54:23.189428
128	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 11:54:23.199525
132	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 12:15:48.749013
133	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 12:15:49.069573
134	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 12:15:49.348231
135	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 12:15:49.364494
136	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 12:15:49.37359
140	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-04-21 12:55:45.429985
141	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-04-21 12:55:45.764184
142	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-04-21 12:55:46.042561
143	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-04-21 12:55:46.173411
144	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-04-21 12:55:46.186817
145	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-05-18 07:00:48.611921
146	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-05-18 07:00:49.169078
147	at-risk-kpis	1	\N	\N	\N	\N	8 KPIs flagged: 8 high risk, 0 medium risk.	high	t	1	2026-05-18 07:01:06.440606
148	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 18 KPIs tracked across 5 department scorecards. Average score: 2.8/5. 3 KPIs rated at 4 or above. 5 KPIs scored below 2 — requiring intervention	\N	t	1	2026-05-18 07:01:06.4604
149	dashboard	1	\N	\N	\N	\N	Cycle has 18 KPIs: 8 high risk, 0 medium risk, 10 on track.	high	t	1	2026-05-18 07:01:06.46298
150	alignment-check	1	\N	\N	\N	\N	Alignment score: 84%. 5 issues found across 32 checks.	high	t	1	2026-05-18 07:01:06.472785
151	evidence-gaps	1	\N	\N	\N	\N	33 evidence gaps detected across 18 KPIs	high	t	1	2026-05-18 07:01:06.483166
152	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-08 20:49:31.63692
153	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-08 20:49:31.658752
154	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-08 20:49:31.659847
155	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-08 20:49:31.664311
156	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-08 20:49:31.724326
157	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-08 21:28:06.023831
158	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-08 21:28:06.042238
159	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-08 21:28:06.050508
160	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-08 21:28:06.052781
161	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-08 21:28:06.055892
162	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 09:26:41.84833
163	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 09:26:41.900835
164	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 09:26:41.903594
165	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 09:26:41.913606
166	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 09:26:41.963751
167	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 10:58:20.429771
168	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 10:58:20.43428
169	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 10:58:20.440227
170	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 10:58:20.441547
171	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 10:58:20.452286
172	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 11:02:53.159517
173	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 11:02:53.160244
174	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 11:02:53.173123
175	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 11:02:53.172808
176	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 11:02:53.183701
177	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 11:25:37.356337
178	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 11:25:37.358238
179	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 11:25:37.372205
180	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 11:25:37.403253
181	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 11:25:37.434808
182	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 12:26:54.482423
184	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 12:26:54.493299
183	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 12:26:54.491551
185	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 12:26:54.538497
186	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 12:26:55.00075
187	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 12:46:45.525832
188	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 12:46:45.547641
189	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 12:46:45.55161
190	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 12:46:45.552413
191	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 12:46:45.553503
192	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 12:57:52.28667
193	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 12:57:52.309582
194	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 12:57:52.314217
195	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 12:57:52.321213
196	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 12:57:52.731457
197	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 12:59:44.265717
198	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 12:59:44.273825
199	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 12:59:44.283744
200	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 12:59:44.285688
201	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 12:59:44.59096
202	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 13:07:56.142504
203	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 13:07:56.155756
204	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 13:07:56.163349
205	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 13:07:56.164031
206	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 13:07:56.524235
207	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 13:12:20.26109
208	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 13:12:20.523269
209	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 13:12:20.526027
210	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 13:12:20.530974
211	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 13:12:20.534147
212	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 13:16:02.828325
213	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 13:16:02.856801
214	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 13:16:02.859972
215	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 13:16:02.87696
216	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 13:16:02.877908
217	narrative-summary	1	\N	\N	\N	\N	Performance cycle analysis: 0 KPIs tracked across 0 department scorecards. Average score: 0.0/5. . No KPI actuals have been captured yet for this cycle	\N	t	1	2026-07-09 18:49:35.205759
219	alignment-check	1	\N	\N	\N	\N	Alignment score: 100%. 0 issues found across 0 checks.	\N	t	1	2026-07-09 18:49:35.246331
218	at-risk-kpis	1	\N	\N	\N	\N	0 KPIs flagged: 0 high risk, 0 medium risk.	medium	t	1	2026-07-09 18:49:35.244014
220	evidence-gaps	1	\N	\N	\N	\N	0 evidence gaps detected across 0 KPIs	\N	t	1	2026-07-09 18:49:35.260699
221	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 18:49:35.409824
222	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 23:17:48.210816
223	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% indicates that the municipality's performance cascade is fully aligned with the mSCOA requirements. The absence of issues and total checks suggests that all aspects of performance management, budgeting, and reporting are being effectively integrated and managed.\n\n**Implications for mSCOA Compliance:**\n\n1. **Robust Financial Management:** The municipality demonstrates strong financial governance, ensuring that all financial transactions are recorded and reported in accordance with mSCOA standards.\n\n2. **Effective Resource Allocation:** A fully aligned performance cascade indicates that resources are being allocated efficiently, enhancing service delivery and project outcomes.\n\n3. **Improved Accountability:** With no identified issues, the municipality is likely to have clear accountability mechanisms in place, fostering transparency and trust among stakeholders.\n\n4. **Enhanced Reporting:** The alignment suggests that the municipality can produce accurate and timely reports, which is crucial for compliance with National Treasury requirements and for informed decision-making.\n\n5. **Sustainability:** Continuous adherence to mSCOA standards positions the municipality for long-term sustainability and resilience in financial and operational management.\n\nTo maintain this alignment, the municipality should regularly review its performance management systems and ensure ongoing training and support for staff involved in mSCOA processes.	\N	t	1	2026-07-09 23:17:51.713687
224	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a commendable compliance score of 100%, with no evidence gaps across any Key Performance Indicators (KPIs). This indicates a robust adherence to the mSCOA requirements and effective management of performance data.\n\n**Actionable Insights:**\n\n1. **Maintain Standards:** Continue the current practices that led to this level of compliance. Regularly review processes to ensure ongoing adherence to mSCOA requirements.\n\n2. **Documentation Practices:** Since there are no missing actuals or evidence documents, ensure that this level of documentation is sustained. Implement a routine audit of evidence collection processes to identify any potential risks early.\n\n3. **Performance Monitoring:** Leverage this compliance success to enhance performance monitoring mechanisms. Use the existing data to identify areas for improvement and set higher benchmarks for future performance.\n\n4. **Training and Capacity Building:** Consider ongoing training sessions for staff involved in performance reporting to ensure they are up-to-date with compliance requirements and best practices.\n\n5. **Stakeholder Communication:** Share this compliance achievement with stakeholders to build trust and transparency. This can enhance community engagement and support for municipal initiatives.\n\nBy maintaining these practices, the municipality can ensure continued compliance and improve overall performance management.	\N	t	1	2026-07-09 23:17:52.341908
225	narrative-summary	1	\N	\N	\N	\N	**Municipal Performance Report: Quarter Ending [Insert Date]**\n\n**Overview:**\nThis report provides an assessment of the municipal performance for the current reporting cycle, as aligned with the mSCOA requirements set forth by National Treasury. \n\n**Key Performance Indicators (KPIs):**\n- **Total KPIs Tracked:** 0\n- **Average Score:** 0.0/5\n- **High Performers:** 0\n- **Under Performers:** 0\n\n**Highlights:**\n- There are currently no recorded highlights for this reporting period due to the absence of tracked KPIs.\n\n**Concerns:**\n- A significant concern is the lack of captured KPI actuals for this cycle. The absence of performance data not only hinders the municipality's ability to assess progress and effectiveness but also limits transparency and accountability to stakeholders. \n\n**Recommendations:**\n1. **Immediate Action Required:** It is imperative that the municipality prioritizes the establishment and tracking of KPIs. This includes defining measurable objectives that align with strategic goals and ensuring that data collection processes are in place.\n   \n2. **Capacity Building:** Invest in training sessions for staff responsible for performance management to enhance their understanding of KPI development and data reporting.\n\n3. **Regular Monitoring:** Implement a robust monitoring framework that allows for periodic reviews of KPI progress, ensuring that actuals are captured consistently moving forward.\n\n4. **Stakeholder Engagement:** Engage with community stakeholders to gather input on relevant performance indicators that reflect community needs and priorities.\n\n**Conclusion:**\nThe current performance metrics indicate a critical gap in the municipality's ability to track and report on its performance. Addressing these issues promptly will be essential to fostering a culture of accountability and continuous improvement within the municipality. Immediate steps must be taken to rectify this situation in the upcoming cycles.	\N	t	1	2026-07-09 23:17:53.953474
226	at-risk-kpis	1	\N	\N	\N	\N	It seems that there are no specific KPIs provided for analysis. However, I can offer a general framework for analyzing at-risk KPIs for a South African municipality, aligned with mSCOA requirements. \n\n### Advisory Summary\n\n1. **Identify Key At-Risk KPIs**: Focus on KPIs that are critical to service delivery, financial management, and compliance with mSCOA. Common at-risk areas include revenue collection, expenditure control, service delivery timelines, and community satisfaction.\n\n2. **Root Cause Analysis**: Conduct a thorough investigation to understand the underlying causes of poor performance in these KPIs. This may involve stakeholder consultations, data analysis, and benchmarking against similar municipalities.\n\n3. **Prioritise Interventions**: Based on the severity and impact of each KPI, prioritize interventions. Focus on KPIs that affect financial sustainability and service delivery directly.\n\n### Prioritised Recommendations\n\n1. **Enhance Revenue Collection**:\n   - Implement a robust debt collection strategy.\n   - Use technology to streamline billing processes and improve accuracy.\n\n2. **Improve Expenditure Management**:\n   - Conduct regular expenditure reviews to identify wasteful spending.\n   - Align budget allocations with strategic priorities and community needs.\n\n3. **Strengthen Service Delivery Mechanisms**:\n   - Establish clear performance targets for service delivery units.\n   - Increase community engagement to gather feedback and improve responsiveness.\n\n4. **Capacity Building**:\n   - Invest in training for staff on mSCOA compliance and performance management.\n   - Foster a culture of accountability and performance within the municipality.\n\n5. **Regular Monitoring and Reporting**:\n   - Set up a dashboard for real-time monitoring of KPIs.\n   - Schedule regular performance review meetings to assess progress and adjust strategies.\n\n6. **Stakeholder Engagement**:\n   - Enhance communication with community members to understand their needs and expectations.\n   - Collaborate with local businesses and NGOs to leverage resources and expertise.\n\nBy implementing these recommendations, the municipality can improve its performance on at-risk KPIs, thereby enhancing service delivery and financial sustainability.	medium	t	1	2026-07-09 23:17:54.465118
227	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-09 23:40:52.830139
228	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a commendable compliance score of 100%, with no evidence gaps across all Key Performance Indicators (KPIs). This indicates robust adherence to the mSCOA requirements and effective performance management practices.\n\n**Key Insights:**\n- **Zero Evidence Gaps:** The absence of missing actuals and evidence documents signifies thorough documentation and monitoring processes.\n- **Sustained Compliance:** Maintaining this level of compliance reflects strong internal controls and accountability mechanisms.\n\n**Actionable Recommendations:**\n1. **Continuous Monitoring:** Regularly review and update KPIs to ensure they remain relevant and aligned with strategic objectives.\n2. **Documentation Practices:** Continue to uphold rigorous documentation standards to sustain compliance and facilitate audits.\n3. **Capacity Building:** Invest in training for staff on mSCOA requirements and performance management to further enhance compliance capabilities.\n4. **Performance Reviews:** Conduct periodic performance reviews to identify areas for improvement and celebrate compliance achievements to foster a culture of accountability.\n\n**Conclusion:**\nThe municipality is in an excellent position regarding compliance. By maintaining current practices and focusing on continuous improvement, it can further enhance its performance management framework.	\N	t	1	2026-07-09 23:40:56.123719
229	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% with no issues found and a total of 0 checks indicates that the municipality's performance cascade is fully compliant with the mSCOA requirements. This means that all performance indicators, targets, and reporting mechanisms are effectively aligned with the prescribed standards.\n\n**Implications for mSCOA Compliance:**\n\n1. **Regulatory Compliance**: The municipality is meeting the necessary legal and regulatory frameworks set by National Treasury, ensuring that financial and performance reporting is accurate and transparent.\n\n2. **Resource Allocation**: A fully aligned performance cascade suggests that resources are being allocated efficiently towards achieving strategic objectives, enhancing service delivery.\n\n3. **Performance Monitoring**: With no issues identified, the municipality can confidently monitor its performance metrics, facilitating informed decision-making and continuous improvement.\n\n4. **Stakeholder Confidence**: High compliance fosters trust among stakeholders, including citizens, government bodies, and potential investors, enhancing the municipality's reputation.\n\n5. **Future Readiness**: Maintaining a 100% alignment score positions the municipality favorably for future audits and assessments, ensuring ongoing adherence to evolving mSCOA requirements.\n\nOverall, this alignment reflects a robust performance management system that can effectively support the municipality's strategic goals and operational efficiency.	\N	t	1	2026-07-09 23:40:56.652466
230	at-risk-kpis	1	\N	\N	\N	\N	It seems that the list of at-risk KPIs was not included in your message. However, I can provide a general framework for analyzing at-risk KPIs for a South African municipality and suggest prioritised recommendations based on common performance indicators.\n\n### Advisory Summary\n\n1. **Identify Key At-Risk KPIs**: Common at-risk KPIs for municipalities may include:\n   - Revenue collection rates\n   - Expenditure against budget\n   - Service delivery timelines (e.g., water, sanitation, waste management)\n   - Asset management and maintenance\n   - Community satisfaction levels\n\n2. **Root Cause Analysis**: For each at-risk KPI, conduct a root cause analysis to determine underlying issues. This may involve stakeholder consultations, data reviews, and process evaluations.\n\n3. **Benchmarking**: Compare performance against similar municipalities to identify gaps and best practices.\n\n### Prioritised Recommendations\n\n1. **Enhance Revenue Collection**:\n   - Implement a robust billing and collection system.\n   - Increase public awareness campaigns on the importance of timely payments.\n   - Introduce incentives for early payments or penalties for late payments.\n\n2. **Budget Management**:\n   - Conduct a mid-year budget review to realign resources based on performance.\n   - Establish a financial oversight committee to monitor expenditure closely.\n\n3. **Improve Service Delivery**:\n   - Set clear service delivery targets and monitor progress weekly.\n   - Invest in training for staff to improve efficiency and responsiveness.\n   - Utilize technology for tracking service requests and complaints.\n\n4. **Asset Management**:\n   - Conduct a comprehensive asset audit to assess current conditions and maintenance needs.\n   - Develop a long-term asset management plan that includes regular maintenance schedules.\n\n5. **Community Engagement**:\n   - Increase community forums to gather feedback on service delivery and satisfaction.\n   - Use surveys to measure community satisfaction and identify areas for improvement.\n\n6. **Performance Monitoring**:\n   - Implement a performance dashboard that tracks KPIs in real-time.\n   - Regularly report on KPI performance to stakeholders, including the community.\n\nBy focusing on these areas, the municipality can address at-risk KPIs effectively and improve overall performance in line with mSCOA requirements. If you provide specific KPIs, I can tailor the recommendations further.	medium	t	1	2026-07-09 23:40:58.100315
231	narrative-summary	1	\N	\N	\N	\N	**Municipal Performance Report: Quarter Ending [Insert Date]**\n\n**Performance Overview:**\n\nThis quarter, the municipality has not tracked any Key Performance Indicators (KPIs), resulting in an average performance score of 0.0 out of 5. This lack of data presents significant challenges in assessing the municipality's operational effectiveness and service delivery outcomes.\n\n**Highlights:**\n\n- **No High Performers Identified:** Due to the absence of tracked KPIs, there are no high-performing departments or initiatives to report on this quarter.\n- **No Under Performers Identified:** Similarly, without any KPIs, there are no underperforming areas to address or improve upon.\n\n**Concerns:**\n\n- **Absence of KPI Tracking:** The most pressing concern is the failure to capture any KPI actuals for this cycle. This not only hinders performance evaluation but also impacts strategic planning and resource allocation. The lack of measurable data prevents the municipality from identifying areas for improvement or recognizing achievements.\n\n**Recommendations:**\n\n1. **Immediate KPI Implementation:** It is imperative that the municipality establishes and tracks relevant KPIs for the upcoming quarter. This should include defining clear objectives aligned with the municipality's strategic goals.\n\n2. **Capacity Building:** Invest in training for staff responsible for data collection and reporting to ensure they are equipped with the necessary skills to track and analyze performance metrics effectively.\n\n3. **Regular Monitoring and Reporting:** Establish a routine for monitoring and reporting on KPIs to ensure timely data capture and analysis. This will facilitate informed decision-making and enhance accountability.\n\n4. **Engagement with Stakeholders:** Engage with departmental heads and stakeholders to identify critical areas of focus for KPI development, ensuring alignment with community needs and service delivery expectations.\n\nIn conclusion, addressing the current lack of KPI tracking is essential for the municipality to enhance its performance management framework and improve service delivery outcomes. Immediate action is required to establish a robust system for monitoring and reporting on municipal performance.	\N	t	1	2026-07-09 23:41:02.255558
232	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-10 00:30:24.213424
233	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% with no issues found and a total of 0 checks indicates that the municipality's performance cascade is fully compliant with mSCOA requirements. This suggests that all elements of the performance management system, including strategic objectives, performance indicators, and reporting mechanisms, are effectively integrated and functioning as intended.\n\n**Implications for mSCOA Compliance:**\n\n1. **Regulatory Compliance:** The municipality is meeting the regulatory requirements set forth by National Treasury, which enhances its credibility and accountability.\n\n2. **Resource Allocation:** A fully aligned performance cascade allows for more efficient allocation of resources, ensuring that budgetary decisions are directly linked to strategic objectives.\n\n3. **Performance Monitoring:** The absence of issues indicates robust performance monitoring processes, which can lead to improved service delivery and better outcomes for residents.\n\n4. **Stakeholder Confidence:** High alignment fosters trust among stakeholders, including citizens and oversight bodies, as it demonstrates a commitment to transparency and effective governance.\n\n5. **Continuous Improvement:** While the current assessment is positive, the municipality should maintain regular reviews and updates to the performance cascade to adapt to changing circumstances and ensure ongoing compliance.\n\nIn summary, the municipality is in an excellent position regarding mSCOA compliance, but it should continue to monitor and refine its performance management processes to sustain this alignment.	\N	t	1	2026-07-10 00:30:27.559228
234	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a commendable compliance score of 100%, with no evidence gaps across any Key Performance Indicators (KPIs). This indicates that all required actuals and supporting documentation are in place and properly aligned with the mSCOA requirements.\n\n**Actionable Insights:**\n\n1. **Maintain Current Standards:**\n   - Continue to uphold the current level of compliance by regularly reviewing and updating documentation processes to ensure ongoing alignment with mSCOA requirements.\n\n2. **Regular Monitoring:**\n   - Implement a routine monitoring system to ensure that all KPIs remain compliant and that any changes in regulations or requirements are promptly addressed.\n\n3. **Knowledge Sharing:**\n   - Share best practices and compliance strategies with other departments or municipalities to foster a culture of excellence in performance management.\n\n4. **Training and Capacity Building:**\n   - Consider ongoing training for staff involved in performance management to ensure they are up-to-date with compliance requirements and best practices.\n\n5. **Documentation Backup:**\n   - Establish a robust backup system for all evidence documents to prevent potential loss and ensure easy retrieval during audits or reviews.\n\nBy maintaining these practices, the municipality can sustain its high compliance standards and enhance overall performance management.	\N	t	1	2026-07-10 00:30:27.809491
235	at-risk-kpis	1	\N	\N	\N	\N	It appears that the specific at-risk KPIs for the South African municipality were not provided in your message. However, I can offer a general framework for analyzing at-risk KPIs and provide prioritised recommendations based on common municipal performance indicators. \n\n### Advisory Summary\n\n**1. Identify Key At-Risk KPIs:**\n   - Common at-risk KPIs may include service delivery metrics (e.g., water supply reliability, waste management efficiency), financial health indicators (e.g., revenue collection rates, expenditure variances), and community satisfaction scores.\n\n**2. Root Cause Analysis:**\n   - Conduct a thorough analysis to identify the underlying causes of poor performance. This may involve stakeholder consultations, data analysis, and reviewing operational processes.\n\n### Prioritised Recommendations\n\n**1. Strengthen Financial Management:**\n   - **Action:** Implement stringent budget controls and enhance revenue collection strategies.\n   - **Outcome:** Improved financial sustainability and ability to fund essential services.\n\n**2. Enhance Service Delivery Mechanisms:**\n   - **Action:** Review and optimize service delivery processes, including maintenance schedules and resource allocation.\n   - **Outcome:** Increased efficiency and reliability in service provision, leading to higher community satisfaction.\n\n**3. Improve Data Quality and Reporting:**\n   - **Action:** Invest in training for staff on mSCOA compliance and data management practices.\n   - **Outcome:** More accurate and timely reporting, enabling better decision-making and performance tracking.\n\n**4. Foster Community Engagement:**\n   - **Action:** Establish regular forums for community feedback on service delivery and satisfaction.\n   - **Outcome:** Enhanced trust and collaboration between the municipality and residents, leading to improved service outcomes.\n\n**5. Monitor and Evaluate Performance Regularly:**\n   - **Action:** Set up a performance dashboard to track KPIs in real-time and conduct quarterly reviews.\n   - **Outcome:** Proactive identification of issues and timely interventions to mitigate risks.\n\nBy focusing on these areas, the municipality can address at-risk KPIs effectively and enhance overall performance in line with mSCOA requirements. If you can provide specific KPIs, I can tailor the recommendations further.	medium	t	1	2026-07-10 00:30:29.851235
236	narrative-summary	1	\N	\N	\N	\N	**Municipal Council Performance Narrative**\n\n**Reporting Period: [Insert Quarter/Year]**\n\n**Overview:**\nThis quarterly performance report reflects the current status of the municipality's Key Performance Indicators (KPIs) in alignment with the mSCOA framework as mandated by National Treasury. The data presented herein is critical for assessing the municipality's operational effectiveness and service delivery outcomes.\n\n**Performance Summary:**\nDuring this reporting cycle, the municipality has not tracked any KPIs, resulting in an average performance score of 0.0 out of 5. This absence of tracked KPIs indicates a significant gap in performance measurement and accountability.\n\n**High Performers:**\n- **Total High Performers:** 0\n- There are no identified high performers this quarter, which underscores the need for immediate intervention in performance management practices.\n\n**Under Performers:**\n- **Total Under Performers:** 0\n- The lack of tracked KPIs has resulted in no categorization of under performers, highlighting a critical area for development in performance tracking and reporting.\n\n**Highlights:**\n- There are no notable highlights to report this quarter, as the absence of KPI tracking limits the ability to showcase achievements or progress.\n\n**Concerns:**\n- The most pressing concern is the complete lack of captured KPI actuals for this cycle. This not only hampers the municipality's ability to evaluate its performance but also poses challenges in strategic planning and resource allocation. The absence of data prevents informed decision-making and undermines accountability to stakeholders.\n\n**Recommendations:**\n1. **Immediate KPI Development:** The municipality should prioritize the establishment and tracking of relevant KPIs that align with strategic objectives and service delivery mandates.\n2. **Capacity Building:** Invest in training for staff on performance management and the importance of data collection to ensure timely and accurate reporting.\n3. **Regular Monitoring:** Implement a robust monitoring system to ensure that KPIs are tracked consistently, with actuals reported in real-time to facilitate ongoing performance evaluation.\n4. **Stakeholder Engagement:** Engage with community stakeholders to identify key areas of concern and performance expectations, ensuring that municipal objectives align with community needs.\n\n**Conclusion:**\nThe current performance landscape indicates a critical need for improvement in KPI tracking and overall performance management. Addressing these concerns is essential for enhancing service delivery, fostering accountability, and ensuring that the municipality meets its strategic goals effectively. Immediate action is required to rectify the current deficiencies and establish a foundation for future performance monitoring and improvement.	\N	t	1	2026-07-10 00:30:30.447749
237	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-10 00:41:24.437909
238	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% with no issues found and a total of 0 checks indicates that the municipality's performance cascade is fully compliant with mSCOA requirements. \n\n**Implications for mSCOA Compliance:**\n\n1. **Robust Framework**: The municipality has established a robust performance management framework that aligns with the mSCOA standards, ensuring that financial and non-financial data are integrated effectively.\n\n2. **Enhanced Reporting**: Full alignment facilitates accurate and comprehensive reporting, which is crucial for transparency and accountability in municipal operations.\n\n3. **Resource Allocation**: A well-aligned performance cascade allows for better resource allocation, as performance indicators are directly linked to budgetary allocations and strategic objectives.\n\n4. **Continuous Improvement**: The absence of issues suggests that the municipality can focus on continuous improvement initiatives rather than addressing compliance gaps, fostering a culture of excellence.\n\n5. **Stakeholder Confidence**: High compliance levels enhance stakeholder confidence, including citizens and oversight bodies, reinforcing trust in municipal governance.\n\nOverall, maintaining this level of alignment should be a priority, with regular reviews to ensure ongoing compliance and adaptability to any changes in mSCOA regulations.	\N	t	1	2026-07-10 00:41:27.125126
239	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory:**\n\nCongratulations on achieving a compliance score of 100% with no evidence gaps across your KPIs. This indicates that your municipality is effectively tracking and documenting performance metrics in alignment with mSCOA requirements.\n\n**Actionable Insights:**\n\n1. **Maintain Current Standards:** Continue to uphold the rigorous documentation and tracking processes that have led to this compliance. Regular audits can help sustain this level of performance.\n\n2. **Benchmarking:** Consider benchmarking your KPIs against other municipalities to identify areas for potential improvement or innovation.\n\n3. **Training and Capacity Building:** Invest in ongoing training for staff to ensure they remain updated on compliance requirements and best practices.\n\n4. **Feedback Mechanism:** Establish a feedback loop to gather insights from stakeholders on the effectiveness of current KPIs and compliance processes.\n\n5. **Future Planning:** As you maintain compliance, start planning for the next cycle of performance management, including potential new KPIs that align with strategic objectives.\n\nBy following these recommendations, you can ensure continued compliance and enhance the overall performance management framework of your municipality.	\N	t	1	2026-07-10 00:41:27.498725
240	at-risk-kpis	1	\N	\N	\N	\N	It seems there are no specific KPIs provided for analysis. However, I can offer general guidance on how to approach at-risk KPIs for a South African municipality based on common challenges faced in the sector. \n\n### Advisory Summary\n\n**1. Identify Key At-Risk KPIs:**\n   - Focus on KPIs related to financial management, service delivery, and community engagement, as these are often critical indicators of municipal performance.\n   - Common at-risk KPIs may include budget variance, service delivery timelines, public satisfaction ratings, and revenue collection rates.\n\n**2. Prioritised Recommendations:**\n\n**A. Financial Management:**\n   - **Enhance Budget Monitoring:** Implement more frequent budget reviews and variance analyses to identify discrepancies early.\n   - **Improve Revenue Collection:** Strengthen revenue collection mechanisms, including the use of technology for billing and payment systems.\n\n**B. Service Delivery:**\n   - **Streamline Processes:** Review and optimize service delivery processes to reduce delays and improve efficiency.\n   - **Community Feedback Mechanisms:** Establish regular channels for community feedback to assess satisfaction and identify areas needing improvement.\n\n**C. Capacity Building:**\n   - **Training and Development:** Invest in capacity building for municipal staff to improve skills in financial management and service delivery.\n   - **Performance Management Systems:** Implement robust performance management systems to track progress against KPIs and hold departments accountable.\n\n**D. Stakeholder Engagement:**\n   - **Regular Reporting:** Increase transparency by providing regular reports to stakeholders on KPI performance and improvement plans.\n   - **Public Participation:** Engage the community in decision-making processes to enhance trust and accountability.\n\n**E. Data-Driven Decision Making:**\n   - **Utilize Data Analytics:** Leverage data analytics to gain insights into performance trends and inform strategic decisions.\n\n### Conclusion\nBy focusing on these areas, the municipality can address at-risk KPIs effectively, leading to improved performance and enhanced service delivery. Regular monitoring and adaptation of strategies will be crucial to sustaining improvements over time.	medium	t	1	2026-07-10 00:41:29.592591
241	narrative-summary	1	\N	\N	\N	\N	**Municipal Council Performance Narrative: Quarterly Report**\n\n**Reporting Period:** [Insert Period]  \n**Municipality:** [Insert Municipality Name]  \n**Date:** [Insert Date]\n\n**1. Overview**\n\nThis quarterly performance report provides an assessment of the municipality's performance against the established Key Performance Indicators (KPIs) for the reporting period. The data reflects a critical need for immediate attention to performance tracking and management processes.\n\n**2. Performance Summary**\n\n- **Total KPIs Tracked:** 0\n- **Average Score:** 0.0/5\n- **High Performers:** 0\n- **Under Performers:** 0\n\n**3. Highlights**\n\nCurrently, there are no highlights to report, as the absence of tracked KPIs indicates a significant gap in performance measurement and accountability. \n\n**4. Concerns**\n\nThe most pressing concern for this reporting cycle is the complete lack of captured KPI actuals. This absence not only hampers the municipality's ability to assess its performance but also undermines strategic planning and resource allocation. Without measurable data, it is impossible to identify areas of success or those requiring improvement.\n\n**5. Recommendations**\n\nTo address these issues, the following actionable insights are recommended:\n\n- **Immediate KPI Development:** Establish a task force to define and implement relevant KPIs aligned with municipal priorities and national standards. This should include stakeholder engagement to ensure buy-in and relevance.\n  \n- **Data Capture Mechanism:** Develop and deploy a robust data collection framework to ensure that KPI actuals are captured consistently and accurately. Training sessions for staff on data management and reporting should be prioritized.\n\n- **Regular Monitoring:** Implement a quarterly review process to monitor KPI performance and facilitate timely interventions where necessary. This will foster a culture of accountability and continuous improvement.\n\n- **Capacity Building:** Invest in capacity building for municipal staff to enhance skills in performance management and data analysis, ensuring that future reporting cycles reflect accurate and actionable insights.\n\n**6. Conclusion**\n\nThe current performance landscape indicates a critical need for enhanced focus on KPI tracking and management. By implementing the recommended actions, the municipality can move towards a more data-driven approach, ultimately improving service delivery and accountability to the community.\n\n**End of Report**	\N	t	1	2026-07-10 00:41:42.021536
242	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-10 01:06:18.373903
243	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a compliance score of 100%, with no evidence gaps across all Key Performance Indicators (KPIs). This indicates a robust adherence to reporting and documentation standards as per the mSCOA requirements.\n\n**Key Insights:**\n- **Zero Evidence Gaps:** The absence of missing actuals and evidence documents reflects strong internal controls and effective data management practices.\n- **Sustained Compliance:** Maintaining a perfect compliance score is commendable and suggests that the municipality is effectively monitoring its performance metrics.\n\n**Actionable Recommendations:**\n1. **Maintain Current Practices:** Continue the existing processes that have led to this level of compliance. Regular audits and reviews should be scheduled to ensure ongoing adherence.\n2. **Documentation Best Practices:** Share successful documentation strategies across departments to promote a culture of compliance and accountability.\n3. **Performance Monitoring:** Regularly assess KPIs to ensure they remain relevant and aligned with strategic objectives. Consider introducing new KPIs if necessary to drive continuous improvement.\n4. **Training and Capacity Building:** Invest in training sessions for staff to reinforce the importance of compliance and the processes involved in evidence collection and reporting.\n\n**Conclusion:**\nThe municipality is currently in an excellent position regarding compliance. By sustaining and enhancing these practices, it can continue to serve as a model for effective governance and accountability within the region.	\N	t	1	2026-07-10 01:06:22.349612
244	narrative-summary	1	\N	\N	\N	\N	**Municipal Council Performance Narrative**\n\n**Quarterly Performance Report: [Insert Quarter and Year]**\n\n**Overview:**\nThis report presents the performance metrics of the municipal council for the current reporting cycle. It is essential to note that the tracking of Key Performance Indicators (KPIs) is a critical component of our performance management framework, as outlined by the mSCOA requirements set forth by National Treasury.\n\n**Performance Summary:**\n- **Total KPIs Tracked:** 0\n- **Average Score:** 0.0/5\n- **High Performers:** 0\n- **Under Performers:** 0\n\n**Highlights:**\nCurrently, there are no highlights to report, as no KPIs have been established or tracked for this reporting period. \n\n**Concerns:**\nThe absence of captured KPI actuals is a significant concern. This lack of data not only hampers our ability to assess performance but also limits our capacity to identify areas for improvement and to make informed decisions moving forward. It is imperative that we establish a framework for KPI tracking to ensure accountability and transparency in our operations.\n\n**Recommendations:**\n1. **Immediate Action Plan:** Develop and implement a robust KPI framework that aligns with the municipality's strategic objectives. This should include the identification of relevant KPIs across all departments.\n   \n2. **Capacity Building:** Conduct training sessions for staff on the importance of KPI tracking and data management to ensure that all departments are equipped to capture and report on performance metrics effectively.\n\n3. **Regular Monitoring:** Establish a schedule for regular reviews of KPI data to ensure timely capture and reporting, enabling proactive management of performance issues.\n\n4. **Stakeholder Engagement:** Engage with stakeholders to communicate the importance of performance tracking and to solicit input on relevant KPIs that reflect community needs and priorities.\n\nIn conclusion, the current performance metrics indicate a critical need for immediate intervention to establish a culture of performance management within the municipality. By addressing these concerns, we can enhance our service delivery and accountability to the community we serve.\n\n**End of Report**	\N	t	1	2026-07-10 01:06:22.894017
245	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% with no issues found and a total of 0 checks indicates that the municipality's performance cascade is fully compliant with mSCOA requirements. This suggests that the municipality has effectively integrated its performance management systems with financial reporting and budgeting processes, ensuring that all performance indicators are aligned with the mSCOA framework.\n\n**Implications for mSCOA Compliance:**\n\n1. **Enhanced Accountability:** A perfect alignment score signifies that the municipality is likely to have clear accountability mechanisms in place, facilitating better governance and transparency.\n\n2. **Improved Resource Allocation:** With no issues found, the municipality can confidently allocate resources based on performance data, leading to more efficient service delivery.\n\n3. **Risk Mitigation:** The absence of issues indicates a low risk of non-compliance, reducing the likelihood of audits revealing discrepancies that could lead to financial penalties or reputational damage.\n\n4. **Strategic Planning:** The alignment supports strategic planning efforts, as performance metrics are directly tied to financial and operational goals, enabling informed decision-making.\n\n5. **Stakeholder Confidence:** A strong alignment fosters trust among stakeholders, including citizens and oversight bodies, as it demonstrates a commitment to effective management and service delivery.\n\nOverall, maintaining this level of alignment will be crucial for ongoing compliance and for achieving the municipality's strategic objectives. Regular reviews and updates to the performance cascade should be conducted to sustain this high standard.	\N	t	1	2026-07-10 01:06:23.707372
246	at-risk-kpis	1	\N	\N	\N	\N	It appears that the specific at-risk KPIs for the South African municipality were not included in your message. However, I can provide a general framework for analyzing at-risk KPIs and offer prioritised recommendations based on common challenges faced by municipalities.\n\n### Advisory Summary\n\n1. **Identify Key Areas of Concern**: Focus on KPIs that reflect financial health, service delivery efficiency, and community satisfaction. Common at-risk areas include revenue collection, expenditure management, service delivery timelines, and public engagement.\n\n2. **Data Analysis**: Utilize mSCOA data to identify trends and anomalies in performance. Look for patterns in underperformance, such as consistent budget overruns or declining service delivery metrics.\n\n3. **Stakeholder Engagement**: Involve key stakeholders, including department heads and community representatives, to gain insights into the root causes of underperformance.\n\n### Prioritised Recommendations\n\n1. **Revenue Enhancement Strategies**:\n   - Implement targeted campaigns to improve revenue collection, focusing on areas with the highest delinquency rates.\n   - Review and optimize tariff structures to ensure they are equitable and reflective of service delivery costs.\n\n2. **Expenditure Control Measures**:\n   - Conduct a thorough review of expenditure patterns to identify wasteful spending.\n   - Implement stricter procurement processes and regular audits to ensure compliance and efficiency.\n\n3. **Service Delivery Improvement Plans**:\n   - Develop action plans for KPIs related to service delivery, setting clear targets and timelines.\n   - Invest in training and capacity building for staff to enhance service delivery capabilities.\n\n4. **Community Engagement Initiatives**:\n   - Increase transparency and communication with the community to build trust and gather feedback on service delivery.\n   - Establish regular forums for community input on municipal performance and priorities.\n\n5. **Performance Monitoring and Reporting**:\n   - Enhance the frequency and detail of performance reporting to ensure timely identification of issues.\n   - Utilize dashboards and visual analytics to track KPIs in real-time, allowing for swift corrective actions.\n\n6. **Risk Management Framework**:\n   - Develop a comprehensive risk management framework to proactively identify and mitigate potential risks affecting performance.\n   - Regularly review and update the framework based on changing conditions and feedback.\n\nBy focusing on these areas, the municipality can address at-risk KPIs effectively, leading to improved performance and enhanced service delivery to the community. If you can provide the specific at-risk KPIs, I can tailor the recommendations further.	medium	t	1	2026-07-10 01:06:25.558517
247	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-10 04:01:53.385771
248	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a commendable compliance score of 100%, with no evidence gaps across any Key Performance Indicators (KPIs). This indicates a robust adherence to the mSCOA requirements and effective performance management practices.\n\n**Key Insights:**\n- **Zero Evidence Gaps:** The absence of missing actuals and evidence documents reflects a strong data management system and diligent record-keeping.\n- **Sustained Performance:** Maintaining a compliance score of 100% is indicative of effective governance and accountability mechanisms in place.\n\n**Actionable Recommendations:**\n1. **Continuous Monitoring:** Regularly review and update KPIs to ensure they remain relevant and aligned with strategic objectives.\n2. **Documentation Practices:** Continue to uphold rigorous documentation standards to sustain compliance and prepare for future audits.\n3. **Capacity Building:** Invest in training for staff to further enhance skills in performance management and compliance monitoring.\n4. **Stakeholder Engagement:** Share compliance achievements with stakeholders to foster transparency and build trust within the community.\n\nBy maintaining these practices, the municipality can ensure ongoing compliance and enhance its performance management framework.	\N	t	1	2026-07-10 04:01:57.110042
249	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% indicates that the municipality's performance cascade is fully compliant with the mSCOA requirements. The absence of issues and total checks signifies that all performance indicators, objectives, and reporting mechanisms are effectively integrated and functioning as intended.\n\n**Implications for mSCOA Compliance:**\n\n1. **Regulatory Compliance**: The municipality is meeting all necessary regulatory standards set by National Treasury, reducing the risk of non-compliance penalties.\n\n2. **Performance Transparency**: A fully aligned performance cascade enhances transparency and accountability, allowing stakeholders to easily track progress against strategic objectives.\n\n3. **Resource Allocation**: With no identified issues, the municipality can confidently allocate resources towards achieving its goals, knowing that performance management systems are robust.\n\n4. **Continuous Improvement**: Maintaining this level of alignment encourages a culture of continuous improvement, as the municipality can focus on sustaining high performance and addressing any emerging challenges proactively.\n\n5. **Stakeholder Confidence**: A clean alignment score fosters trust among stakeholders, including citizens and government entities, reinforcing the municipality's credibility and commitment to effective governance.\n\nOverall, the municipality should continue monitoring and reviewing its performance systems to maintain this high standard of alignment and ensure ongoing compliance with mSCOA requirements.	\N	t	1	2026-07-10 04:01:57.124506
250	narrative-summary	1	\N	\N	\N	\N	**Municipal Performance Report: Quarter Ending [Insert Date]**\n\n**Council Overview:**\n\nIn the current reporting cycle, the municipality has not tracked any Key Performance Indicators (KPIs), resulting in an average performance score of 0.0 out of 5. This lack of KPI tracking indicates a significant gap in performance measurement and accountability within the municipality.\n\n**Performance Analysis:**\n\n- **KPI Tracking:** There are currently no KPIs being monitored, which limits our ability to assess the effectiveness of municipal services and initiatives. The absence of tracked KPIs is a critical concern that must be addressed to ensure transparency and performance accountability.\n  \n- **Performance Categorization:** As no KPIs have been recorded, there are no identified high performers or underperformers within the municipality. This situation underscores the urgent need for the establishment and implementation of a robust performance management framework.\n\n**Highlights:**\n\n- **N/A:** No highlights can be reported due to the absence of tracked performance data.\n\n**Concerns:**\n\n- **Lack of KPI Actuals:** The most pressing concern is the failure to capture any KPI actuals for this cycle. This not only hampers our ability to evaluate service delivery but also undermines the municipality's commitment to performance management and improvement.\n\n**Recommendations:**\n\n1. **Immediate KPI Development:** The municipality should prioritize the identification and establishment of relevant KPIs across all departments. This will facilitate effective monitoring and evaluation of service delivery.\n\n2. **Training and Capacity Building:** Implement training sessions for municipal staff on the importance of KPI tracking and the mSCOA framework to enhance understanding and compliance.\n\n3. **Regular Monitoring and Reporting:** Establish a routine for capturing and reporting KPI actuals to ensure that performance data is available for future assessments.\n\n4. **Engagement with Stakeholders:** Foster engagement with community stakeholders to identify key areas of concern and potential KPIs that reflect the needs and priorities of the community.\n\n**Conclusion:**\n\nThe current performance landscape indicates a critical need for immediate action to establish a performance management system that aligns with National Treasury requirements. By addressing the gaps in KPI tracking, the municipality can enhance accountability, improve service delivery, and better serve its constituents. Immediate steps must be taken to rectify this situation to ensure that future reports reflect meaningful performance data.	\N	t	1	2026-07-10 04:01:59.593121
251	at-risk-kpis	1	\N	\N	\N	\N	It seems that the list of at-risk KPIs was not included in your message. However, I can provide a general framework for analyzing at-risk KPIs for a South African municipality aligned with mSCOA requirements. \n\n### Advisory Summary\n\n1. **Identify Key At-Risk KPIs**: Begin by identifying which specific KPIs are underperforming. Common at-risk KPIs may include budget variance, service delivery timelines, revenue collection rates, and community satisfaction scores.\n\n2. **Root Cause Analysis**: Conduct a thorough analysis to determine the underlying causes of the underperformance. This may involve stakeholder interviews, data analysis, and reviewing operational processes.\n\n3. **Prioritization of KPIs**: Rank the at-risk KPIs based on their impact on service delivery and financial sustainability. Focus on those that have the most significant implications for the municipality's overall performance.\n\n### Prioritised Recommendations\n\n1. **Enhance Revenue Collection Strategies**:\n   - Implement targeted campaigns to improve revenue collection, especially in areas with low compliance.\n   - Utilize technology for better tracking and management of outstanding debts.\n\n2. **Improve Service Delivery Processes**:\n   - Streamline operational processes to reduce delays in service delivery.\n   - Invest in training for staff to enhance efficiency and responsiveness.\n\n3. **Strengthen Community Engagement**:\n   - Increase communication with residents to understand their needs and expectations.\n   - Establish feedback mechanisms to monitor community satisfaction and adjust services accordingly.\n\n4. **Regular Monitoring and Reporting**:\n   - Set up a dashboard for real-time monitoring of KPIs to facilitate timely interventions.\n   - Schedule regular performance reviews to assess progress and recalibrate strategies as needed.\n\n5. **Capacity Building**:\n   - Provide training and resources for municipal staff to improve their skills in areas related to the at-risk KPIs.\n   - Foster a culture of accountability and performance management within the municipality.\n\n6. **Collaborate with Stakeholders**:\n   - Engage with local businesses, NGOs, and community organizations to leverage resources and expertise.\n   - Foster partnerships that can help address specific challenges related to the at-risk KPIs.\n\nBy focusing on these recommendations, the municipality can enhance its performance management framework, align with mSCOA requirements, and ultimately improve service delivery to its residents. If you provide the specific KPIs, I can tailor the recommendations further.	medium	t	1	2026-07-10 04:01:59.960033
252	dashboard	1	\N	\N	\N	\N	Cycle has 0 KPIs: 0 high risk, 0 medium risk, 0 on track.	\N	t	1	2026-07-10 04:05:34.126462
253	alignment-check	1	\N	\N	\N	\N	An overall alignment score of 100% with no issues found and a total of 0 checks indicates that the municipality's performance cascade is fully compliant with mSCOA requirements. This implies:\n\n1. **Robust Framework**: The municipality has established a strong performance management framework that aligns with the mSCOA standards, ensuring that financial and non-financial performance indicators are effectively integrated.\n\n2. **Data Integrity**: The absence of issues suggests that data collection and reporting mechanisms are reliable, which is crucial for accurate financial reporting and accountability.\n\n3. **Resource Allocation**: With full alignment, the municipality can confidently allocate resources based on performance data, enhancing service delivery and operational efficiency.\n\n4. **Audit Readiness**: A perfect score indicates preparedness for audits, reducing the risk of non-compliance findings and potential financial penalties.\n\n5. **Continuous Improvement**: The municipality should maintain this high standard by regularly reviewing and updating performance metrics, ensuring ongoing alignment with mSCOA and adapting to any changes in regulations.\n\nIn summary, the municipality is well-positioned for compliance and can leverage this alignment to improve service delivery and stakeholder trust. Regular monitoring and proactive adjustments will be key to sustaining this performance level.	\N	t	1	2026-07-10 04:05:37.375939
254	evidence-gaps	1	\N	\N	\N	\N	**Compliance Advisory for Municipality**\n\n**Overview:**\nThe municipality has achieved a commendable compliance score of 100%, with no evidence gaps across all Key Performance Indicators (KPIs). This indicates that all required actuals and supporting documentation are present and in order.\n\n**Actionable Insights:**\n\n1. **Maintain Standards:** Continue to uphold the current standards of documentation and reporting. Regularly review processes to ensure that all KPIs remain compliant with mSCOA requirements.\n\n2. **Continuous Monitoring:** Implement a routine compliance check to ensure ongoing adherence to evidence requirements. This will help in identifying any potential issues before they arise.\n\n3. **Training and Capacity Building:** Consider periodic training sessions for staff involved in performance management to reinforce the importance of compliance and familiarize them with any updates in mSCOA regulations.\n\n4. **Documentation Management:** Establish a robust documentation management system to streamline the collection and storage of evidence, ensuring easy access and retrieval when needed.\n\n5. **Feedback Mechanism:** Create a feedback loop with stakeholders to ensure that the performance management process is transparent and continuously improving.\n\nBy maintaining these practices, the municipality can sustain its high compliance levels and enhance its overall performance management framework.	\N	t	1	2026-07-10 04:05:37.81102
255	narrative-summary	1	\N	\N	\N	\N	**Municipal Performance Narrative: Quarterly Report**\n\n**Reporting Period:** [Insert Quarter and Year]\n\n**Overview:**\nThis report presents the performance metrics of the municipal council for the current reporting cycle. It is essential to note that the tracking of Key Performance Indicators (KPIs) is a critical component of our performance management framework, as outlined by the National Treasury’s mSCOA requirements.\n\n**Performance Summary:**\n- **Total KPIs Tracked:** 0\n- **Average Score:** 0.0/5\n- **High Performers:** 0\n- **Under Performers:** 0\n\n**Highlights:**\n- There are no highlights to report for this cycle due to the absence of tracked KPIs.\n\n**Concerns:**\n- The most significant concern for this reporting period is the lack of captured KPI actuals. The absence of data not only hampers our ability to assess performance but also limits our capacity to identify areas for improvement and strategic planning.\n- The failure to track and report on KPIs raises questions about the effectiveness of our current performance management systems and processes. It is imperative that we address these gaps to ensure accountability and transparency in our operations.\n\n**Recommendations:**\n1. **Immediate Action Plan:** Develop and implement a robust action plan to establish a framework for KPI tracking. This should include identifying relevant KPIs aligned with municipal objectives and ensuring that data collection processes are in place.\n   \n2. **Capacity Building:** Conduct training sessions for staff responsible for performance management to enhance their understanding of KPI tracking and reporting requirements.\n\n3. **Regular Monitoring:** Establish a schedule for regular monitoring and reporting of KPIs to ensure timely capture of actuals and facilitate ongoing performance assessment.\n\n4. **Engagement with Stakeholders:** Engage with relevant stakeholders to gather insights and feedback on performance metrics that are critical for municipal service delivery.\n\n**Conclusion:**\nThe current performance metrics indicate a critical need for immediate intervention to establish a functioning performance management system. By addressing the concerns highlighted in this report, we can work towards achieving our municipal objectives and enhancing service delivery to our communities. It is essential that we prioritize the tracking of KPIs to foster a culture of accountability and continuous improvement within the municipality.\n\n**Next Steps:**\nThe municipal council is urged to prioritize the implementation of the recommendations outlined above in the upcoming quarter to ensure that we are on track to meet our performance management obligations.	\N	t	1	2026-07-10 04:05:40.025761
256	at-risk-kpis	1	\N	\N	\N	\N	It appears that there are no specific KPIs listed for analysis. However, I can provide a general framework for assessing at-risk KPIs in a South African municipality, aligned with mSCOA requirements. \n\n### Advisory Summary for At-Risk KPIs\n\n1. **Identify Key Performance Indicators (KPIs)**:\n   - Ensure that KPIs are aligned with the municipality's strategic objectives and mSCOA requirements.\n   - Common at-risk KPIs may include service delivery times, budget variance, revenue collection rates, and community satisfaction levels.\n\n2. **Data Analysis**:\n   - Conduct a thorough analysis of the data associated with each KPI to identify trends, anomalies, and root causes of underperformance.\n   - Utilize mSCOA reporting tools to ensure compliance and accuracy in data reporting.\n\n3. **Stakeholder Engagement**:\n   - Engage with relevant stakeholders, including department heads and community representatives, to gather insights on challenges faced in achieving KPIs.\n   - Foster a culture of accountability and transparency.\n\n### Prioritised Recommendations\n\n1. **Immediate Action Plans**:\n   - Develop targeted action plans for the top three at-risk KPIs, focusing on quick wins that can show immediate improvement.\n   - Assign clear responsibilities and timelines for implementation.\n\n2. **Resource Allocation**:\n   - Assess whether adequate resources (financial, human, and technological) are allocated to departments responsible for at-risk KPIs.\n   - Reallocate resources if necessary to ensure critical areas are adequately supported.\n\n3. **Capacity Building**:\n   - Invest in training and capacity-building initiatives for staff to enhance their skills in performance management and service delivery.\n   - Encourage cross-departmental collaboration to share best practices and solutions.\n\n4. **Monitoring and Reporting**:\n   - Implement a robust monitoring and reporting framework to track progress on at-risk KPIs regularly.\n   - Schedule quarterly reviews to assess the effectiveness of interventions and adjust strategies as needed.\n\n5. **Community Engagement**:\n   - Increase community engagement initiatives to gather feedback and improve service delivery based on citizen needs and expectations.\n   - Utilize social media and community forums to enhance communication and transparency.\n\nBy following these recommendations, the municipality can effectively address at-risk KPIs, improve service delivery, and enhance overall performance in alignment with mSCOA requirements.	medium	t	1	2026-07-10 04:05:40.466857
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, user_name, action, entity_type, entity_id, old_value, new_value, cycle_id, "timestamp") FROM stdin;
1	1	System Administrator	create	scorecard	2	\N	{"id":2,"name":"SDBIP 2025/2026","cycleId":1,"scorecardType":"organisational","departmentId":null,"status":"Draft","approvedById":null,"approvedAt":null,"approvalComments":null,"createdById":1,"createdAt":"2026-04-09T18:47:53.455Z","updatedAt":"2026-04-09T18:47:53.455Z"}	1	2026-04-09 18:47:53.608305
2	1	System Administrator	transition:reopen	scorecard	1	{"status":"Approved"}	{"status":"Draft"}	1	2026-04-09 19:43:37.062745
3	1	System Administrator	transition:reopen	scorecard_kpi	1	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:37.681801
4	1	System Administrator	transition:reopen	scorecard_kpi	2	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:37.98794
5	1	System Administrator	transition:reopen	scorecard_kpi	3	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:38.295299
6	1	System Administrator	transition:reopen	scorecard_kpi	4	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:38.602781
7	1	System Administrator	transition:reopen	scorecard_kpi	5	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:38.909071
8	1	System Administrator	transition:reopen	scorecard_kpi	6	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:39.215006
9	1	System Administrator	transition:reopen	scorecard_kpi	7	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:39.518805
10	1	System Administrator	transition:reopen	scorecard_kpi	8	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:39.825936
11	1	System Administrator	transition:reopen	scorecard_kpi	9	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:40.131757
12	1	System Administrator	transition:reopen	scorecard_kpi	10	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:40.437678
13	1	System Administrator	transition:reopen	scorecard_kpi	11	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:40.746662
14	1	System Administrator	transition:reopen	scorecard_kpi	12	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:41.059654
15	1	System Administrator	transition:reopen	scorecard_kpi	13	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:41.365984
16	1	System Administrator	transition:reopen	scorecard_kpi	14	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:41.671724
17	1	System Administrator	transition:reopen	scorecard_kpi	15	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:41.975185
18	1	System Administrator	transition:reopen	scorecard_kpi	16	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:42.281504
19	1	System Administrator	transition:reopen	scorecard_kpi	17	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:42.591136
20	1	System Administrator	transition:reopen	scorecard_kpi	18	{"status":"Approved"}	{"status":"Draft"}	\N	2026-04-09 19:43:42.927537
21	1	System Administrator	update	scorecard_kpi	1	{"id":1,"scorecardId":1,"kpiNumber":"BSD-01","description":"Percentage of households with access to basic water supply","idpReference":null,"strategicObjective":"Universal access to clean water","programme":"Water Services","responsiblePostId":1,"custodianPostId":1,"baseline":"0","annualTarget":"98","annualBudgetTarget":12000000,"evidenceSource":null,"evidencePortfolio":null,"weighting":8,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":1,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T18:05:08.097Z","updatedAt":"2026-04-09T19:43:37.677Z"}	{"id":1,"scorecardId":1,"kpiNumber":"BSD-01","description":"Percentage of households with access to basic water supply","idpReference":"BSD-01","strategicObjective":"Universal access to clean water","programme":"Water Services","responsiblePostId":1,"custodianPostId":1,"baseline":"80%","annualTarget":"80%","annualBudgetTarget":12000000,"evidenceSource":"Technical Department","evidencePortfolio":"Billing report","weighting":60,"fundingSource":"MIG","budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":1,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T18:05:08.097Z","updatedAt":"2026-04-09T19:54:09.322Z"}	\N	2026-04-09 19:54:09.327548
22	1	System Administrator	transition:submit	scorecard_kpi	1	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 19:54:16.339684
23	1	System Administrator	transition:review	scorecard_kpi	1	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 19:57:00.085997
24	1	System Administrator	upsert	kpi_quarter_targets	1	\N	{"targets":[{"id":1,"kpiId":1,"quarter":1,"targetValue":"92","budgetValue":3000000,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.099Z","updatedAt":"2026-04-09T19:59:05.810Z"},{"id":2,"kpiId":1,"quarter":2,"targetValue":"94","budgetValue":3000000,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.102Z","updatedAt":"2026-04-09T19:59:05.842Z"},{"id":3,"kpiId":1,"quarter":3,"targetValue":"96","budgetValue":3000000,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.104Z","updatedAt":"2026-04-09T19:59:05.847Z"},{"id":4,"kpiId":1,"quarter":4,"targetValue":"98","budgetValue":3000000,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.108Z","updatedAt":"2026-04-09T19:59:05.849Z"}]}	\N	2026-04-09 19:59:05.853244
25	1	System Administrator	transition:approve	scorecard_kpi	1	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 19:59:43.187996
26	1	System Administrator	generate	report_run	1	\N	{"id":1,"cycleId":1,"reportType":"mid-year","quarter":1,"departmentId":null,"scorecardType":null,"title":"Mid-Year Report Test 1","status":"Generated","generatedById":1,"generatedAt":"2026-04-09T20:01:40.927Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-04-09T20:01:40.927Z\\"}","createdAt":"2026-04-09T20:01:40.928Z"}	1	2026-04-09 20:01:40.964292
61	1	System Administrator	transition:review	scorecard_kpi	3	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:51.340073
62	1	System Administrator	transition:review	scorecard_kpi	5	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:52.977948
63	1	System Administrator	transition:review	scorecard_kpi	6	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:54.991744
64	1	System Administrator	transition:review	scorecard_kpi	7	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:57.351843
65	1	System Administrator	transition:approve	scorecard_kpi	13	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:02.915699
66	1	System Administrator	transition:approve	scorecard_kpi	14	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:06.604785
27	1	System Administrator	upsert	kpi_quarter_targets	4	\N	{"targets":[{"id":13,"kpiId":4,"quarter":1,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payments certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.168Z","updatedAt":"2026-04-09T20:23:26.878Z"},{"id":14,"kpiId":4,"quarter":2,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payment certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.170Z","updatedAt":"2026-04-09T20:23:27.155Z"},{"id":15,"kpiId":4,"quarter":3,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payment certificate","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.173Z","updatedAt":"2026-04-09T20:23:27.159Z"},{"id":16,"kpiId":4,"quarter":4,"targetValue":"25 Kms ","budgetValue":4500000,"evidenceExpected":"Payment Certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.176Z","updatedAt":"2026-04-09T20:23:27.162Z"}]}	\N	2026-04-09 20:23:27.16586
28	1	System Administrator	upsert	kpi_quarter_targets	4	\N	{"targets":[{"id":13,"kpiId":4,"quarter":1,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payments certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.168Z","updatedAt":"2026-04-09T20:23:29.498Z"},{"id":14,"kpiId":4,"quarter":2,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payment certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.170Z","updatedAt":"2026-04-09T20:23:29.502Z"},{"id":15,"kpiId":4,"quarter":3,"targetValue":"25 Kms","budgetValue":4500000,"evidenceExpected":"Payment certificate","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.173Z","updatedAt":"2026-04-09T20:23:29.504Z"},{"id":16,"kpiId":4,"quarter":4,"targetValue":"25 Kms ","budgetValue":4500000,"evidenceExpected":"Payment Certificates","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T18:05:08.176Z","updatedAt":"2026-04-09T20:23:29.507Z"}]}	\N	2026-04-09 20:23:29.510097
29	1	System Administrator	transition:submit	scorecard_kpi	4	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:23:30.975352
30	1	System Administrator	transition:review	scorecard_kpi	4	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:23:42.33749
31	1	System Administrator	transition:approve	scorecard_kpi	4	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:23:46.247295
32	1	System Administrator	transition:submit	scorecard_kpi	2	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:13.24797
33	1	System Administrator	transition:submit	scorecard_kpi	3	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:15.607536
34	1	System Administrator	transition:submit	scorecard_kpi	5	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:17.288669
35	1	System Administrator	transition:submit	scorecard_kpi	6	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:18.556431
36	1	System Administrator	transition:submit	scorecard_kpi	7	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:19.84136
37	1	System Administrator	transition:submit	scorecard_kpi	8	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:20.870207
38	1	System Administrator	transition:submit	scorecard_kpi	9	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:32.729588
39	1	System Administrator	transition:submit	scorecard_kpi	10	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:34.439337
40	1	System Administrator	transition:submit	scorecard_kpi	11	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:36.403728
41	1	System Administrator	transition:submit	scorecard_kpi	12	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:37.736609
42	1	System Administrator	transition:submit	scorecard_kpi	13	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:39.595629
43	1	System Administrator	transition:submit	scorecard_kpi	14	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:41.695795
44	1	System Administrator	transition:submit	scorecard_kpi	15	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:43.049781
45	1	System Administrator	transition:submit	scorecard_kpi	17	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:26:44.652737
46	1	System Administrator	transition:submit	scorecard_kpi	16	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:27:01.278823
47	1	System Administrator	transition:submit	scorecard_kpi	18	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:27:04.433275
48	1	System Administrator	transition:review	scorecard_kpi	8	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:11.191095
49	1	System Administrator	transition:review	scorecard_kpi	9	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:13.812584
50	1	System Administrator	transition:review	scorecard_kpi	10	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:15.333559
51	1	System Administrator	transition:review	scorecard_kpi	11	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:16.875185
52	1	System Administrator	transition:review	scorecard_kpi	12	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:18.322579
53	1	System Administrator	transition:approve	scorecard_kpi	12	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:27:20.360174
54	1	System Administrator	transition:review	scorecard_kpi	13	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:35.96227
55	1	System Administrator	transition:review	scorecard_kpi	14	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:37.806697
56	1	System Administrator	transition:review	scorecard_kpi	15	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:39.602976
57	1	System Administrator	transition:review	scorecard_kpi	17	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:41.366733
58	1	System Administrator	transition:review	scorecard_kpi	16	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:43.281462
59	1	System Administrator	transition:review	scorecard_kpi	18	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:45.528014
60	1	System Administrator	transition:review	scorecard_kpi	2	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:27:49.977332
67	1	System Administrator	transition:approve	scorecard_kpi	15	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:09.726395
68	1	System Administrator	transition:approve	scorecard_kpi	17	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:11.699723
69	1	System Administrator	transition:approve	scorecard_kpi	16	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:14.565
70	1	System Administrator	transition:approve	scorecard_kpi	18	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:16.675445
71	1	System Administrator	transition:approve	scorecard_kpi	2	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:19.345406
72	1	System Administrator	transition:approve	scorecard_kpi	3	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:21.174901
73	1	System Administrator	transition:approve	scorecard_kpi	5	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:23.279916
74	1	System Administrator	transition:approve	scorecard_kpi	6	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:27.890159
75	1	System Administrator	transition:approve	scorecard_kpi	7	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:30.220496
76	1	System Administrator	transition:approve	scorecard_kpi	8	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:34.689135
77	1	System Administrator	transition:approve	scorecard_kpi	9	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:37.701285
78	1	System Administrator	transition:approve	scorecard_kpi	10	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:39.913997
79	1	System Administrator	transition:approve	scorecard_kpi	11	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:28:42.235591
80	1	System Administrator	generate	report_run	2	\N	{"id":2,"cycleId":1,"reportType":"quarterly","quarter":1,"departmentId":null,"scorecardType":null,"title":"Quarter 1 Test","status":"Generated","generatedById":1,"generatedAt":"2026-04-09T20:38:09.207Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-04-09T20:38:09.207Z\\"}","createdAt":"2026-04-09T20:38:09.208Z"}	1	2026-04-09 20:38:09.241823
81	1	System Administrator	create	scorecard_kpi	19	\N	{"id":19,"scorecardId":2,"kpiNumber":"BSD-01","description":"Percentage of households with access to basic water","idpReference":"BSD-01","strategicObjective":null,"programme":null,"responsiblePostId":1,"custodianPostId":1,"baseline":"80%","annualTarget":"80%","annualBudgetTarget":12000000,"evidenceSource":"Water Department","evidencePortfolio":"Quarterly billing report","weighting":100,"fundingSource":"MIG","budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:49:21.713Z","updatedAt":"2026-04-09T20:49:21.713Z"}	1	2026-04-09 20:49:21.746917
82	1	System Administrator	update	scorecard_kpi	19	{"id":19,"scorecardId":2,"kpiNumber":"BSD-01","description":"Percentage of households with access to basic water","idpReference":"BSD-01","strategicObjective":null,"programme":null,"responsiblePostId":1,"custodianPostId":1,"baseline":"80%","annualTarget":"80%","annualBudgetTarget":12000000,"evidenceSource":"Water Department","evidencePortfolio":"Quarterly billing report","weighting":100,"fundingSource":"MIG","budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:49:21.713Z","updatedAt":"2026-04-09T20:49:21.713Z"}	{"id":19,"scorecardId":2,"kpiNumber":"BSD-01","description":"Percentage of households with access to basic water","idpReference":"BSD-01","strategicObjective":"KPA2: Service Delivery and Infrastructure Development","programme":"Water","responsiblePostId":1,"custodianPostId":1,"baseline":"80%","annualTarget":"80%","annualBudgetTarget":12000000,"evidenceSource":"Water Department","evidencePortfolio":"Quarterly billing report","weighting":100,"fundingSource":"MIG","budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:49:21.713Z","updatedAt":"2026-04-09T20:50:58.850Z"}	\N	2026-04-09 20:50:58.858296
83	1	System Administrator	upsert	kpi_quarter_targets	19	\N	{"targets":[{"id":73,"kpiId":19,"quarter":1,"targetValue":"20%","budgetValue":3000000,"evidenceExpected":"Quarterly billing report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T20:52:46.935Z","updatedAt":"2026-04-09T20:52:46.935Z"},{"id":74,"kpiId":19,"quarter":2,"targetValue":"20%","budgetValue":3000000,"evidenceExpected":"Quarterly billing report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T20:52:46.940Z","updatedAt":"2026-04-09T20:52:46.940Z"},{"id":75,"kpiId":19,"quarter":3,"targetValue":"20%","budgetValue":3000000,"evidenceExpected":"Quarterly billing report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T20:52:46.942Z","updatedAt":"2026-04-09T20:52:46.942Z"},{"id":76,"kpiId":19,"quarter":4,"targetValue":"20%","budgetValue":3000000,"evidenceExpected":"Quarterly billing report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T20:52:46.946Z","updatedAt":"2026-04-09T20:52:46.946Z"}]}	\N	2026-04-09 20:52:46.949234
84	1	System Administrator	transition:submit	scorecard_kpi	19	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 20:52:53.443671
85	1	System Administrator	transition:review	scorecard_kpi	19	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 20:53:31.90645
86	1	System Administrator	transition:approve	scorecard_kpi	19	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 20:53:35.251104
87	1	System Administrator	create	scorecard_kpi	20	\N	{"id":20,"scorecardId":2,"kpiNumber":"BSD-02","description":"% of valid supplier invoices paid within 30 days from date of receipt","idpReference":"BSD-02","strategicObjective":null,"programme":null,"responsiblePostId":1,"custodianPostId":1,"baseline":"100%","annualTarget":"100%","annualBudgetTarget":5000000,"evidenceSource":"BTO Department","evidencePortfolio":"Creditors listing, payment vouchers","weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:58:45.872Z","updatedAt":"2026-04-09T20:58:45.872Z"}	1	2026-04-09 20:58:45.908094
107	1	System Administrator	actual:approve	kpi_quarter_actual	55	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-04-09 21:36:49.228661
132	1	System Administrator	create	competency_requirement	3	\N	{"id":3,"name":"Programme & Project Management","description":"","weight":20,"cycleId":1,"isActive":true,"sortOrder":3}	1	2026-04-10 03:42:18.072613
133	1	System Administrator	create	competency_requirement	4	\N	{"id":4,"name":"People Management & Empowerment","description":"","weight":20,"cycleId":1,"isActive":true,"sortOrder":4}	1	2026-04-10 03:42:42.295368
88	1	System Administrator	update	scorecard_kpi	20	{"id":20,"scorecardId":2,"kpiNumber":"BSD-02","description":"% of valid supplier invoices paid within 30 days from date of receipt","idpReference":"BSD-02","strategicObjective":null,"programme":null,"responsiblePostId":1,"custodianPostId":1,"baseline":"100%","annualTarget":"100%","annualBudgetTarget":5000000,"evidenceSource":"BTO Department","evidencePortfolio":"Creditors listing, payment vouchers","weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:58:45.872Z","updatedAt":"2026-04-09T20:58:45.872Z"}	{"id":20,"scorecardId":2,"kpiNumber":"BSD-02","description":"% of valid supplier invoices paid within 30 days from date of receipt","idpReference":"BSD-02","strategicObjective":"KPA 3: Financial Viability","programme":"Finance","responsiblePostId":1,"custodianPostId":1,"baseline":"100%","annualTarget":"100%","annualBudgetTarget":5000000,"evidenceSource":"BTO Department","evidencePortfolio":"Creditors listing, payment vouchers","weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:58:45.872Z","updatedAt":"2026-04-09T21:00:06.247Z"}	\N	2026-04-09 21:00:06.28251
89	1	System Administrator	upsert	kpi_quarter_targets	20	\N	{"targets":[{"id":77,"kpiId":20,"quarter":1,"targetValue":"100%","budgetValue":5000000,"evidenceExpected":"Creditors listing, payment vouchers","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T21:02:31.188Z","updatedAt":"2026-04-09T21:02:31.188Z"},{"id":78,"kpiId":20,"quarter":2,"targetValue":"100%","budgetValue":5000000,"evidenceExpected":"Creditors listing, payment vouchersrt","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T21:02:31.222Z","updatedAt":"2026-04-09T21:02:31.222Z"},{"id":79,"kpiId":20,"quarter":3,"targetValue":"100%","budgetValue":5000000,"evidenceExpected":"Quarterly billing report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T21:02:31.234Z","updatedAt":"2026-04-09T21:02:31.234Z"},{"id":80,"kpiId":20,"quarter":4,"targetValue":"100%","budgetValue":5000000,"evidenceExpected":"Creditors listing, payment vouchers","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-04-09T21:02:31.238Z","updatedAt":"2026-04-09T21:02:31.238Z"}]}	\N	2026-04-09 21:02:31.241972
90	1	System Administrator	update	scorecard_kpi	20	{"id":20,"scorecardId":2,"kpiNumber":"BSD-02","description":"% of valid supplier invoices paid within 30 days from date of receipt","idpReference":"BSD-02","strategicObjective":"KPA 3: Financial Viability","programme":"Finance","responsiblePostId":1,"custodianPostId":1,"baseline":"100%","annualTarget":"100%","annualBudgetTarget":5000000,"evidenceSource":"BTO Department","evidencePortfolio":"Creditors listing, payment vouchers","weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:58:45.872Z","updatedAt":"2026-04-09T21:00:06.247Z"}	{"id":20,"scorecardId":2,"kpiNumber":"BSD-02","description":"% of valid supplier invoices paid within 30 days from date of receipt","idpReference":"BSD-02","strategicObjective":"KPA 3: Financial Viability","programme":"Finance","responsiblePostId":1,"custodianPostId":1,"baseline":"100%","annualTarget":"100%","annualBudgetTarget":20000000,"evidenceSource":"BTO Department","evidencePortfolio":"Creditors listing, payment vouchers","weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"sortOrder":0,"createdAt":"2026-04-09T20:58:45.872Z","updatedAt":"2026-04-09T21:02:33.099Z"}	\N	2026-04-09 21:02:33.10384
91	1	System Administrator	transition:submit	scorecard_kpi	20	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-04-09 21:02:41.969932
92	1	System Administrator	transition:review	scorecard_kpi	20	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-04-09 21:02:59.462584
93	1	System Administrator	transition:approve	scorecard_kpi	20	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-04-09 21:03:01.803892
94	1	System Administrator	transition:submit	scorecard	1	{"status":"Draft"}	{"status":"Submitted"}	1	2026-04-09 21:10:54.430121
95	1	System Administrator	transition:submit	scorecard	1	{"status":"Draft"}	{"status":"Submitted"}	1	2026-04-09 21:12:28.046315
96	1	System Administrator	transition:review	scorecard	1	{"status":"Submitted"}	{"status":"Reviewed"}	1	2026-04-09 21:20:14.512725
97	1	System Administrator	transition:approve	scorecard	1	{"status":"Reviewed"}	{"status":"Approved"}	1	2026-04-09 21:21:23.156171
98	1	System Administrator	generate	sdbip_items	1	\N	{"count":18}	1	2026-04-09 21:22:22.721226
99	1	System Administrator	create	kpi_quarter_actual	55	\N	{"id":55,"kpiId":1,"quarter":1,"actualValue":"80%","commentary":"80% of households connected with basic water","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-09T21:24:38.574Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-04-09T21:24:38.574Z","updatedAt":"2026-04-09T21:24:38.574Z"}	\N	2026-04-09 21:24:38.607114
100	1	System Administrator	upload	kpi_evidence_document	37	\N	{"id":37,"kpiId":1,"quarter":1,"fileName":"Billing report","fileSize":1024,"mimeType":"application/pdf","filePath":"/uploads/1/Billing report","documentType":"Report","description":null,"uploadedById":1,"uploadedAt":"2026-04-09T21:27:17.789Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-04-09 21:27:17.826496
101	1	System Administrator	evidence:verified	kpi_evidence_document	37	{"verificationStatus":"Pending"}	{"verificationStatus":"Verified"}	\N	2026-04-09 21:28:17.988636
102	1	System Administrator	actual:submit	kpi_quarter_actual	55	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-09 21:28:52.10685
103	1	System Administrator	actual:approve	kpi_quarter_actual	55	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-09 21:32:32.398853
104	1	System Administrator	actual:approve	kpi_quarter_actual	55	{"status":"In Review","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-04-09 21:32:59.351093
105	1	System Administrator	actual:approve	kpi_quarter_actual	55	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"pms_director"}	\N	2026-04-09 21:33:32.454781
106	1	System Administrator	actual:approve	kpi_quarter_actual	55	{"status":"In Review","reviewLevel":"pms_director"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-04-09 21:34:20.925735
108	1	System Administrator	create	kpi_quarter_actual	56	\N	{"id":56,"kpiId":1,"quarter":2,"actualValue":"80%","commentary":"80% of the households connected to basic water","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-09T21:42:34.773Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-04-09T21:42:34.773Z","updatedAt":"2026-04-09T21:42:34.773Z"}	\N	2026-04-09 21:42:34.796058
109	1	System Administrator	actual:submit	kpi_quarter_actual	56	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-09 21:43:17.155218
110	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-09 21:44:51.418292
111	1	System Administrator	actual:return	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"director"}	{"status":"Returned","reviewLevel":"director"}	\N	2026-04-09 21:45:07.446736
112	1	System Administrator	update	kpi_quarter_actual	56	{"id":56,"kpiId":1,"quarter":2,"actualValue":"80%","commentary":"80% of the households connected to basic water","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-09T21:42:34.773Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Incorrectly assessed","reviewedById":1,"reviewedAt":"2026-04-09T21:45:07.443Z","createdAt":"2026-04-09T21:42:34.773Z","updatedAt":"2026-04-09T21:45:07.443Z"}	{"id":56,"kpiId":1,"quarter":2,"actualValue":"80%","commentary":"80% of the households connected to basic water","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-09T21:42:34.773Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Incorrectly assessed","reviewedById":1,"reviewedAt":"2026-04-09T21:45:07.443Z","createdAt":"2026-04-09T21:42:34.773Z","updatedAt":"2026-04-09T21:45:44.058Z"}	\N	2026-04-09 21:45:44.061824
113	1	System Administrator	actual:submit	kpi_quarter_actual	56	{"status":"Returned","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-09 21:45:50.634656
114	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-09 21:45:59.603536
115	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-04-09 21:46:12.330606
116	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"pms_director"}	\N	2026-04-09 21:46:18.930093
117	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"pms_director"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-04-09 21:46:25.949693
118	1	System Administrator	actual:approve	kpi_quarter_actual	56	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-04-09 21:46:35.448173
119	1	System Administrator	create	individual_agreement	1	\N	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Draft","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-09T21:50:22.600Z"}	1	2026-04-09 21:50:22.635855
120	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Draft","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-09T21:50:22.600Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Submitted","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-09T21:58:43.538Z"}	1	2026-04-09 21:58:43.543044
121	1	System Administrator	transition:submit	sdbip_item	1	{"status":"Draft"}	{"status":"Submitted"}	1	2026-04-10 03:34:14.907028
122	1	System Administrator	create	progress_status	1	\N	{"id":1,"name":"On track","code":"On_track","color":"#3b82f6","cycleId":1,"isActive":true,"sortOrder":1}	\N	2026-04-10 03:36:28.9591
123	1	System Administrator	create	progress_status	2	\N	{"id":2,"name":"Achieved","code":"AC","color":"#7df73b","cycleId":1,"isActive":true,"sortOrder":2}	\N	2026-04-10 03:37:01.763591
124	1	System Administrator	create	progress_status	3	\N	{"id":3,"name":"Not achieved","code":"NA","color":"#f73b3b","cycleId":1,"isActive":true,"sortOrder":3}	\N	2026-04-10 03:37:25.415313
125	1	System Administrator	create	progress_status	4	\N	{"id":4,"name":"On hold","code":"H","color":"#f7d83b","cycleId":1,"isActive":true,"sortOrder":4}	\N	2026-04-10 03:38:15.187114
126	1	System Administrator	create	scorecard_type	1	\N	{"id":1,"name":"Organisational","code":"Org","description":"","isActive":true}	\N	2026-04-10 03:38:42.350481
127	1	System Administrator	create	scorecard_type	2	\N	{"id":2,"name":"Departmental","code":"Dept","description":"","isActive":true}	\N	2026-04-10 03:38:58.504113
128	1	System Administrator	create	scorecard_type	3	\N	{"id":3,"name":"Individual","code":"Ind","description":"","isActive":true}	\N	2026-04-10 03:39:15.210496
129	1	System Administrator	create	competency_requirement	1	\N	{"id":1,"name":"Strategic Capability & Leadershi","description":"","weight":25,"cycleId":1,"isActive":true,"sortOrder":1}	1	2026-04-10 03:41:24.972802
130	1	System Administrator	update	competency_requirement	1	{"id":1,"name":"Strategic Capability & Leadershi","description":"","weight":25,"cycleId":1,"isActive":true,"sortOrder":1}	{"id":1,"name":"Strategic Capability & Leadership","description":"","weight":25,"cycleId":1,"isActive":true,"sortOrder":1}	1	2026-04-10 03:41:40.405359
131	1	System Administrator	create	competency_requirement	2	\N	{"id":2,"name":"Financial Management","description":"","weight":20,"cycleId":1,"isActive":true,"sortOrder":2}	1	2026-04-10 03:41:55.942614
134	1	System Administrator	create	competency_requirement	5	\N	{"id":5,"name":"Problem Solving & Analysis","description":"","weight":15,"cycleId":1,"isActive":true,"sortOrder":5}	1	2026-04-10 03:43:09.740511
135	1	System Administrator	transition:lock	dept_scorecard	1	{"status":"Approved"}	{"status":"Locked"}	1	2026-04-10 03:57:56.908859
136	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Submitted","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-09T21:58:43.538Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Supervisor Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:21.033Z"}	1	2026-04-10 04:00:21.070383
137	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Supervisor Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:21.033Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Approved","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:41.628Z"}	1	2026-04-10 04:00:41.641149
138	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Approved","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:41.628Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Quarterly Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:54.403Z"}	1	2026-04-10 04:00:54.406666
139	1	System Administrator	create	individual_assessment	1	\N	{"id":1,"agreementId":1,"assessmentType":"quarterly","quarter":1,"reviewerId":1,"kpiScore":3,"competencyScore":3,"overallScore":2.9999999999999996,"comments":"CFO met the requirement expectation in terms of work performed.","developmentNeeds":"None identified for this quarter","performanceGaps":null,"status":"Draft","createdAt":"2026-04-10T04:07:48.474Z","updatedAt":"2026-04-10T04:07:48.474Z"}	1	2026-04-10 04:07:48.510315
140	1	System Administrator	create	individual_moderation	1	\N	{"id":1,"assessmentId":1,"agreementId":1,"moderatorId":1,"outcome":"adjusted","originalScore":3,"adjustedScore":4,"adjustmentReason":"CFO exceeded expectations due to spending on capital projects","notes":null,"createdAt":"2026-04-10T04:10:03.340Z"}	1	2026-04-10 04:10:03.383668
141	1	System Administrator	create	individual_assessment	2	\N	{"id":2,"agreementId":1,"assessmentType":"quarterly","quarter":2,"reviewerId":1,"kpiScore":3,"competencyScore":3,"overallScore":2.9999999999999996,"comments":"Incumbent met expectations","developmentNeeds":"None identified this quarter","performanceGaps":null,"status":"Draft","createdAt":"2026-04-10T04:12:32.971Z","updatedAt":"2026-04-10T04:12:32.971Z"}	1	2026-04-10 04:12:33.003923
142	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Quarterly Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:00:54.403Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Mid-Year Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:14:57.243Z"}	1	2026-04-10 04:14:57.27623
143	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Mid-Year Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:14:57.243Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Quarterly Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:15:10.298Z"}	1	2026-04-10 04:15:10.302459
144	1	System Administrator	create	kpi_quarter_actual	57	\N	{"id":57,"kpiId":12,"quarter":2,"actualValue":"5","commentary":"5 IT systems upgraded","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-10T04:24:21.893Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-04-10T04:24:21.893Z","updatedAt":"2026-04-10T04:24:21.893Z"}	\N	2026-04-10 04:24:21.91866
173	1	System Administrator	create	individual_moderation	2	\N	{"id":2,"assessmentId":1,"agreementId":1,"moderatorId":1,"outcome":"adjusted","originalScore":3,"adjustedScore":2,"adjustmentReason":"Did not meet performance target","notes":null,"createdAt":"2026-04-10T12:21:58.647Z"}	1	2026-04-10 12:21:58.689465
145	1	System Administrator	upload	kpi_evidence_document	38	\N	{"id":38,"kpiId":12,"quarter":2,"fileName":"Report","fileSize":1024,"mimeType":"application/pdf","filePath":"/uploads/12/Report","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-04-10T04:24:54.163Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-04-10 04:24:54.168339
146	1	System Administrator	actual:submit	kpi_quarter_actual	57	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-10 04:25:08.775853
147	1	System Administrator	create	kpi_quarter_actual	58	\N	{"id":58,"kpiId":12,"quarter":3,"actualValue":"5","commentary":"5 IT systems upgraded","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-10T04:26:20.748Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-04-10T04:26:20.748Z","updatedAt":"2026-04-10T04:26:20.748Z"}	\N	2026-04-10 04:26:20.760601
148	1	System Administrator	upload	kpi_evidence_document	39	\N	{"id":39,"kpiId":12,"quarter":3,"fileName":"Report","fileSize":1024,"mimeType":"application/pdf","filePath":"/uploads/12/Report","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-04-10T04:26:34.565Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-04-10 04:26:34.569542
149	1	System Administrator	actual:submit	kpi_quarter_actual	58	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-10 04:26:38.679779
150	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-10 04:26:59.028714
151	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-04-10 04:29:45.384888
152	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"pms_director"}	\N	2026-04-10 04:30:22.699842
153	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"pms_director"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-04-10 04:30:46.972522
154	1	System Administrator	actual:return	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Returned","reviewLevel":"internal_audit"}	\N	2026-04-10 04:30:58.493771
155	1	System Administrator	evidence:verified	kpi_evidence_document	39	{"verificationStatus":"Pending"}	{"verificationStatus":"Verified"}	\N	2026-04-10 04:31:29.617198
156	1	System Administrator	evidence:verified	kpi_evidence_document	39	{"verificationStatus":"Verified"}	{"verificationStatus":"Verified"}	\N	2026-04-10 04:31:47.536336
157	1	System Administrator	actual:submit	kpi_quarter_actual	58	{"status":"Returned","reviewLevel":"internal_audit"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-10 04:32:29.288241
158	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-10 04:32:53.542137
159	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-04-10 04:33:01.686885
160	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"pms_director"}	\N	2026-04-10 04:33:08.692863
161	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"pms_director"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-04-10 04:33:18.716896
162	1	System Administrator	actual:approve	kpi_quarter_actual	58	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-04-10 04:33:28.918799
163	1	System Administrator	update	remedial_action_plan	1	{"id":1,"kpiId":2,"quarter":3,"actionDescription":"Corrective action plan for BSD-02 underperformance in Q3","actionOwnerIds":"1","dueDate":"2026-03-31","status":"Open","evidenceDocumentId":null,"completedAt":null,"createdById":1,"createdAt":"2026-04-09T18:05:08.596Z","updatedAt":"2026-04-09T18:05:08.596Z"}	{"id":1,"kpiId":2,"quarter":3,"actionDescription":"Corrective action plan for BSD-02 underperformance in Q3","actionOwnerIds":"1","dueDate":"2026-03-31","status":"In Progress","evidenceDocumentId":null,"completedAt":null,"createdById":1,"createdAt":"2026-04-09T18:05:08.596Z","updatedAt":"2026-04-10T04:34:40.253Z"}	\N	2026-04-10 04:34:40.25766
164	1	System Administrator	generate	report_run	3	\N	{"id":3,"cycleId":1,"reportType":"annual","quarter":1,"departmentId":null,"scorecardType":null,"title":"Annual Report_Test","status":"Generated","generatedById":1,"generatedAt":"2026-04-10T08:25:27.733Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-04-10T08:25:27.733Z\\"}","createdAt":"2026-04-10T08:25:27.734Z"}	1	2026-04-10 08:25:28.033281
165	1	System Administrator	create	notification_config	1	\N	{"id":1,"cycleId":1,"eventType":"deadline_approaching","daysBefore":7,"isEmail":false,"isInApp":true,"isActive":true}	1	2026-04-10 08:39:08.472877
166	1	System Administrator	create	notification_config	2	\N	{"id":2,"cycleId":1,"eventType":"review_required","daysBefore":7,"isEmail":true,"isInApp":true,"isActive":true}	1	2026-04-10 08:39:34.857809
167	1	System Administrator	create	notification_config	3	\N	{"id":3,"cycleId":1,"eventType":"approval_pending","daysBefore":7,"isEmail":true,"isInApp":true,"isActive":true}	1	2026-04-10 08:39:57.222087
168	1	System Administrator	actual:approve	kpi_quarter_actual	57	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-10 12:13:17.489046
169	1	System Administrator	actual:approve	kpi_quarter_actual	57	{"status":"In Review","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-04-10 12:13:35.800078
170	1	System Administrator	actual:approve	kpi_quarter_actual	57	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"pms_director"}	\N	2026-04-10 12:13:50.266687
171	1	System Administrator	actual:approve	kpi_quarter_actual	57	{"status":"In Review","reviewLevel":"pms_director"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-04-10 12:14:07.182373
172	1	System Administrator	create	individual_assessment	3	\N	{"id":3,"agreementId":1,"assessmentType":"quarterly","quarter":3,"reviewerId":1,"kpiScore":3,"competencyScore":3,"overallScore":2.9999999999999996,"comments":"CFO met performance expection","developmentNeeds":"None identified","performanceGaps":null,"status":"Draft","createdAt":"2026-04-10T12:20:56.330Z","updatedAt":"2026-04-10T12:20:56.330Z"}	1	2026-04-10 12:20:56.36648
174	1	System Administrator	create	individual_agreement	2	\N	{"id":2,"cycleId":1,"employeeId":3,"employeeName":"Thabo Sibanda","postTitle":"Director","departmentId":2,"departmentName":"Corporate Services","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Draft","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-21T07:17:11.730Z","updatedAt":"2026-04-21T07:17:11.730Z"}	1	2026-04-21 07:17:11.900625
175	1	System Administrator	create	individual_agreement	3	\N	{"id":3,"cycleId":1,"employeeId":4,"employeeName":"Naledi van Wyk","postTitle":"Director","departmentId":3,"departmentName":"Community Services","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Draft","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-21T07:20:31.782Z","updatedAt":"2026-04-21T07:20:31.782Z"}	1	2026-04-21 07:20:31.815987
176	1	System Administrator	create	individual_agreement	4	\N	{"id":4,"cycleId":1,"employeeId":5,"employeeName":"Mandla Khoza","postTitle":"Director","departmentId":4,"departmentName":"Technical Services","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Draft","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":null,"approvedAt":null,"approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-21T07:20:49.891Z","updatedAt":"2026-04-21T07:20:49.891Z"}	1	2026-04-21 07:20:49.895749
177	1	System Administrator	transition	individual_agreement	1	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Quarterly Review","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-10T04:15:10.298Z"}	{"id":1,"cycleId":1,"employeeId":2,"employeeName":"Jane Molefe","postTitle":"CFO","departmentId":1,"departmentName":"BTO","deptScorecardId":null,"primaryReviewerId":null,"secondaryReviewerId":null,"status":"Approved","kpiWeightPct":70,"competencyWeightPct":30,"finalScore":null,"approvedById":1,"approvedAt":"2026-04-10T04:00:41.628Z","approvalComments":null,"lockedAt":null,"createdById":1,"createdAt":"2026-04-09T21:50:22.600Z","updatedAt":"2026-04-21T07:21:17.071Z"}	1	2026-04-21 07:21:17.076555
178	1	System Administrator	create	kpi_quarter_actual	59	\N	{"id":59,"kpiId":15,"quarter":4,"actualValue":"0","commentary":"90% of the capital budget spent","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"NOne","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-21T07:23:30.704Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-04-21T07:23:30.704Z","updatedAt":"2026-04-21T07:23:30.704Z"}	\N	2026-04-21 07:23:30.743386
179	1	System Administrator	upload	kpi_evidence_document	40	\N	{"id":40,"kpiId":15,"quarter":4,"fileName":"Payment report","fileSize":1024,"mimeType":"application/pdf","filePath":"/uploads/15/Payment report","documentType":"Report","description":null,"uploadedById":1,"uploadedAt":"2026-04-21T07:24:36.524Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-04-21 07:24:36.561003
180	1	System Administrator	actual:submit	kpi_quarter_actual	59	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-21 07:24:44.295243
181	1	System Administrator	evidence:verified	kpi_evidence_document	40	{"verificationStatus":"Pending"}	{"verificationStatus":"Verified"}	\N	2026-04-21 07:25:37.257641
182	1	System Administrator	actual:approve	kpi_quarter_actual	59	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-21 07:26:08.95418
183	1	System Administrator	actual:return	kpi_quarter_actual	59	{"status":"In Review","reviewLevel":"director"}	{"status":"Returned","reviewLevel":"director"}	\N	2026-04-21 07:26:16.917363
184	1	System Administrator	update	kpi_quarter_actual	59	{"id":59,"kpiId":15,"quarter":4,"actualValue":"0","commentary":"90% of the capital budget spent","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"NOne","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-21T07:23:30.704Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Update actual value","reviewedById":1,"reviewedAt":"2026-04-21T07:26:16.913Z","createdAt":"2026-04-21T07:23:30.704Z","updatedAt":"2026-04-21T07:26:16.913Z"}	{"id":59,"kpiId":15,"quarter":4,"actualValue":"90%","commentary":"90% of the capital budget spent","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"NOne","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-21T07:23:30.704Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Update actual value","reviewedById":1,"reviewedAt":"2026-04-21T07:26:16.913Z","createdAt":"2026-04-21T07:23:30.704Z","updatedAt":"2026-04-21T07:26:44.155Z"}	\N	2026-04-21 07:26:44.20178
185	1	System Administrator	actual:submit	kpi_quarter_actual	59	{"status":"Returned","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-21 07:26:53.862312
186	1	System Administrator	generate	report_run	4	\N	{"id":4,"cycleId":1,"reportType":"institutional-evaluation","quarter":1,"departmentId":null,"scorecardType":null,"title":"Institutional Evaluation","status":"Generated","generatedById":1,"generatedAt":"2026-04-21T07:40:28.862Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-04-21T07:40:28.862Z\\"}","createdAt":"2026-04-21T07:40:28.862Z"}	1	2026-04-21 07:40:29.129457
187	1	System Administrator	actual:approve	kpi_quarter_actual	59	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-04-21 12:10:42.998569
188	1	System Administrator	actual:return	kpi_quarter_actual	59	{"status":"In Review","reviewLevel":"director"}	{"status":"Returned","reviewLevel":"director"}	\N	2026-04-21 12:10:55.715827
204	1	System Administrator	create	scorecard	3	\N	{"id":3,"name":"__smoke_test__","cycleId":1,"scorecardType":"organisational","departmentId":null,"status":"Draft","approvedById":null,"approvedAt":null,"approvalComments":null,"createdById":1,"createdAt":"2026-07-08T13:53:04.470Z","updatedAt":"2026-07-08T13:53:04.470Z"}	1	2026-07-08 13:53:04.478253
241	1	System Administrator	update	division	69	{"name":"Budget Planning and Financial Reporting"}	{"name":"Test Division Name"}	\N	2026-07-08 16:22:43.102348
189	1	System Administrator	update	kpi_quarter_actual	59	{"id":59,"kpiId":15,"quarter":4,"actualValue":"90%","commentary":"90% of the capital budget spent","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"NOne","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-21T07:23:30.704Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Insufficient","reviewedById":1,"reviewedAt":"2026-04-21T12:10:55.712Z","createdAt":"2026-04-21T07:23:30.704Z","updatedAt":"2026-04-21T12:10:55.712Z"}	{"id":59,"kpiId":15,"quarter":4,"actualValue":"90%","commentary":"90% of the capital budget spent","isAchieved":true,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"NOne","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-04-21T07:23:30.704Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"director","reviewStatus":"Returned","reviewComments":"Insufficient","reviewedById":1,"reviewedAt":"2026-04-21T12:10:55.712Z","createdAt":"2026-04-21T07:23:30.704Z","updatedAt":"2026-04-21T12:11:24.052Z"}	\N	2026-04-21 12:11:24.056226
190	1	System Administrator	actual:submit	kpi_quarter_actual	59	{"status":"Returned","reviewLevel":"director"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-04-21 12:11:26.1773
191	1	System Administrator	create	national_kpa	1	\N	{"id":1,"name":"Test KPA","code":"TEST","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:18:42.435823
192	1	System Administrator	create	national_kpa	7	\N	{"id":7,"name":"Basic service delivery and infrastructure development","code":"KPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:20:27.44153
193	1	System Administrator	create	national_kpa	8	\N	{"id":8,"name":"Temp","code":"TMP","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:23:01.615276
194	1	System Administrator	delete	national_kpa	8	{"id":8,"name":"Temp","code":"TMP","description":"","isActive":true,"sortOrder":0}	\N	\N	2026-07-08 13:23:01.89218
195	1	System Administrator	delete	national_kpa	2	{"id":2,"name":"Basic Service Delivery","code":"NKPA1","description":"Provision of basic services such as water, sanitation, electricity and refuse removal.","isActive":true,"sortOrder":0}	\N	\N	2026-07-08 13:23:13.307287
196	1	System Administrator	update	national_kpa	7	{"id":7,"name":"Basic service delivery and infrastructure development","code":"KPA1","description":"","isActive":true,"sortOrder":0}	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:24:15.038105
197	1	System Administrator	update	national_kpa	3	{"id":3,"name":"Local Economic Development","code":"NKPA2","description":"Initiatives that stimulate and support local economic growth and job creation.","isActive":true,"sortOrder":1}	{"id":3,"name":"Local Economic Development","code":"NKPA2","description":"Initiatives that stimulate and support local economic growth and job creation.","isActive":true,"sortOrder":1}	\N	2026-07-08 13:24:23.836055
198	1	System Administrator	update	national_kpa	7	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:24:27.167074
199	1	System Administrator	update	national_kpa	7	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:24:51.133002
200	1	System Administrator	update	national_kpa	7	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:25:35.839932
201	1	System Administrator	update	national_kpa	7	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	{"id":7,"name":"Basic service delivery and infrastructure development","code":"NKPA1","description":"","isActive":true,"sortOrder":0}	\N	2026-07-08 13:26:46.902896
202	1	System Administrator	update	sdbip_field_config	0	{"fields":[{"id":1,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"KPI Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":2,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":3,"sdbipType":"original","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":4,"sdbipType":"original","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":5,"sdbipType":"original","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":6,"sdbipType":"original","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":5,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":7,"sdbipType":"original","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":6,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":8,"sdbipType":"original","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":9,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":8,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":10,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":11,"sdbipType":"original","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":12,"sdbipType":"original","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":13,"sdbipType":"original","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"},{"id":14,"sdbipType":"original","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-08T13:29:47.915Z","updatedAt":"2026-07-08T13:29:47.915Z"}]}	{"fields":[{"id":15,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"KPI Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T13:43:20.482Z","updatedAt":"2026-07-08T13:43:20.482Z"},{"id":16,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-08T13:43:20.482Z","updatedAt":"2026-07-08T13:43:20.482Z"},{"id":17,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":2,"createdAt":"2026-07-08T13:43:20.482Z","updatedAt":"2026-07-08T13:43:20.482Z"},{"id":18,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_q1_target","fieldLabel":"Quarter 1 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-08T13:43:20.482Z","updatedAt":"2026-07-08T13:43:20.482Z"},{"id":19,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_pct","fieldLabel":"Pct done","fieldType":"percent","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T13:43:20.482Z","updatedAt":"2026-07-08T13:43:20.482Z"}]}	\N	2026-07-08 13:43:20.654303
203	1	System Administrator	update	sdbip_field_config	0	{"fields":[{"id":20,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"KPI Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":21,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":22,"sdbipType":"original","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":23,"sdbipType":"original","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":24,"sdbipType":"original","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":25,"sdbipType":"original","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":5,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":26,"sdbipType":"original","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":6,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":27,"sdbipType":"original","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":28,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":8,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":29,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":30,"sdbipType":"original","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":31,"sdbipType":"original","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":32,"sdbipType":"original","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"},{"id":33,"sdbipType":"original","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-08T13:43:32.234Z","updatedAt":"2026-07-08T13:43:32.234Z"}]}	{"fields":[{"id":34,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"KPI Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":35,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":36,"sdbipType":"original","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":37,"sdbipType":"original","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":38,"sdbipType":"original","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":39,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":5,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":40,"sdbipType":"original","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":6,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":41,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_target","fieldLabel":"Quarter 1 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":42,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_poe","fieldLabel":"Quarter 1 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":8,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":43,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_target","fieldLabel":"Quarter 2 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":44,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_poe","fieldLabel":"Quarter 2 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":45,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_target","fieldLabel":"Quarter 3 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":46,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_poe","fieldLabel":"Quarter 3 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":47,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_target","fieldLabel":"Quarter 4 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":48,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_poe","fieldLabel":"Quarter 4 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":14,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":49,"sdbipType":"original","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":15,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":50,"sdbipType":"original","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":16,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":51,"sdbipType":"original","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":17,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":52,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":18,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":53,"sdbipType":"original","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":19,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":54,"sdbipType":"original","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":20,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":55,"sdbipType":"original","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":21,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"}]}	\N	2026-07-08 13:44:17.301071
205	1	System Administrator	create	scorecard_kpi	21	\N	{"id":21,"scorecardId":2,"kpiNumber":"TST-99","description":"Test KPI for return workflow","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"4 reports","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":null,"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T14:09:29.067Z","updatedAt":"2026-07-08T14:09:29.067Z"}	1	2026-07-08 14:09:29.153662
206	1	System Administrator	transition:submit	scorecard_kpi	21	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-08 14:09:29.309694
207	1	System Administrator	transition:return	scorecard_kpi	21	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-08 14:09:29.460951
208	1	System Administrator	transition:submit	scorecard_kpi	21	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-08 14:09:35.705946
209	1	System Administrator	transition:return	scorecard_kpi	21	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-08 14:09:35.8294
210	1	System Administrator	delete	scorecard_kpi	21	{"id":21,"scorecardId":2,"kpiNumber":"TST-99","description":"Test KPI for return workflow","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"4 reports","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":null,"returnComments":"Baseline figure needs verification","sortOrder":0,"createdAt":"2026-07-08T14:09:29.067Z","updatedAt":"2026-07-08T14:09:35.823Z"}	\N	\N	2026-07-08 14:10:14.375027
211	1	System Administrator	create	scorecard_kpi	22	\N	{"id":22,"scorecardId":2,"kpiNumber":"TST-DEL","description":"delete test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"1","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":null,"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T14:37:38.091Z","updatedAt":"2026-07-08T14:37:38.091Z"}	1	2026-07-08 14:37:38.342919
212	1	System Administrator	transition:submit	scorecard_kpi	22	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-08 14:37:38.639795
213	1	System Administrator	transition:review	scorecard_kpi	22	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-08 14:37:38.754291
214	1	System Administrator	transition:approve	scorecard_kpi	22	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-08 14:37:38.860759
215	1	System Administrator	upsert	kpi_quarter_targets	22	\N	{"targets":[{"id":81,"kpiId":22,"quarter":1,"targetValue":"5","budgetValue":null,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T14:37:38.966Z","updatedAt":"2026-07-08T14:37:38.966Z"}]}	\N	2026-07-08 14:37:38.96972
216	1	System Administrator	delete	scorecard_kpi	22	{"id":22,"scorecardId":2,"kpiNumber":"TST-DEL","description":"delete test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"1","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Approved","isCumulative":false,"customFields":null,"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T14:37:38.091Z","updatedAt":"2026-07-08T14:37:38.857Z"}	\N	\N	2026-07-08 14:37:39.08155
217	1	System Administrator	create	scorecard_kpi	23	\N	{"id":23,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_poe":"Report A","cf_quarter_1_target":"10","cf_quarter_2_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:09:30.458Z","updatedAt":"2026-07-08T15:09:30.458Z"}	1	2026-07-08 15:09:30.650178
218	1	System Administrator	update	scorecard_kpi	23	{"id":23,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_poe":"Report A","cf_quarter_1_target":"10","cf_quarter_2_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:09:30.458Z","updatedAt":"2026-07-08T15:09:30.458Z"}	{"id":23,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_target":"15","cf_quarter_2_target":"","cf_quarter_3_target":"30"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:09:30.458Z","updatedAt":"2026-07-08T15:09:31.196Z"}	\N	2026-07-08 15:09:31.212893
219	1	System Administrator	delete	scorecard_kpi	23	{"id":23,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_target":"15","cf_quarter_2_target":"","cf_quarter_3_target":"30"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:09:30.458Z","updatedAt":"2026-07-08T15:09:31.196Z"}	\N	\N	2026-07-08 15:09:31.525665
220	1	System Administrator	create	scorecard_kpi	24	\N	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_poe":"Report A","cf_quarter_1_target":"10","cf_quarter_2_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:26.746Z"}	1	2026-07-08 15:11:26.913951
221	1	System Administrator	update	scorecard_kpi	24	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_poe":"Report A","cf_quarter_1_target":"10","cf_quarter_2_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:26.746Z"}	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_target":"15"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:27.268Z"}	\N	2026-07-08 15:11:27.277516
222	1	System Administrator	update	scorecard_kpi	24	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_1_target":"15"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:27.268Z"}	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_2_target":"","cf_quarter_3_target":"30"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:27.536Z"}	\N	2026-07-08 15:11:27.547115
223	1	System Administrator	delete	scorecard_kpi	24	{"id":24,"scorecardId":2,"kpiNumber":"TST-99","description":"smoke","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"100","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_quarter_2_target":"","cf_quarter_3_target":"30"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T15:11:26.746Z","updatedAt":"2026-07-08T15:11:27.536Z"}	\N	\N	2026-07-08 15:11:27.811051
224	1	System Administrator	update	sdbip_field_config	0	{"fields":[{"id":35,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":36,"sdbipType":"original","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":37,"sdbipType":"original","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":38,"sdbipType":"original","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":39,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":5,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":40,"sdbipType":"original","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":6,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":41,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_target","fieldLabel":"Quarter 1 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":42,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_poe","fieldLabel":"Quarter 1 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":8,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":43,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_target","fieldLabel":"Quarter 2 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":44,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_poe","fieldLabel":"Quarter 2 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":45,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_target","fieldLabel":"Quarter 3 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":46,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_poe","fieldLabel":"Quarter 3 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":47,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_target","fieldLabel":"Quarter 4 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":48,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_poe","fieldLabel":"Quarter 4 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":14,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":49,"sdbipType":"original","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":15,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":50,"sdbipType":"original","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":16,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":51,"sdbipType":"original","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":17,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":52,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":18,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":53,"sdbipType":"original","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":19,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":54,"sdbipType":"original","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":20,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":55,"sdbipType":"original","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":21,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"},{"id":34,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T13:44:17.290Z","updatedAt":"2026-07-08T13:44:17.290Z"}]}	{"fields":[{"id":70,"sdbipType":"original","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":71,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_nkpa","fieldLabel":"NKPA","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":1,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":72,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_department","fieldLabel":"Department","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":73,"sdbipType":"original","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":3,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":74,"sdbipType":"original","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":75,"sdbipType":"original","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":5,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":76,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":6,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":77,"sdbipType":"original","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":78,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_target","fieldLabel":"Quarter 1 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":8,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":79,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_1_poe","fieldLabel":"Quarter 1 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":80,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_target","fieldLabel":"Quarter 2 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":81,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_2_poe","fieldLabel":"Quarter 2 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":82,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_target","fieldLabel":"Quarter 3 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":83,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_3_poe","fieldLabel":"Quarter 3 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":84,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_target","fieldLabel":"Quarter 4 target","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":14,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":85,"sdbipType":"original","fieldKind":"custom","fieldKey":"cf_quarter_4_poe","fieldLabel":"Quarter 4 POE","fieldType":"alphanumeric","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":15,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":86,"sdbipType":"original","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":16,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":87,"sdbipType":"original","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":17,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":88,"sdbipType":"original","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":18,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":89,"sdbipType":"original","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":19,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":90,"sdbipType":"original","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":20,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":91,"sdbipType":"original","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":21,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":92,"sdbipType":"original","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":22,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"},{"id":93,"sdbipType":"original","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":23,"createdAt":"2026-07-08T15:33:52.009Z","updatedAt":"2026-07-08T15:33:52.009Z"}]}	\N	2026-07-08 15:33:52.183729
225	1	System Administrator	upload	departments	0	\N	{"fileName":"takeon.xlsx","rows":4,"departmentsCreated":2,"divisionsCreated":4,"skipped":0}	\N	2026-07-08 16:06:09.823363
226	1	System Administrator	upload	departments	0	\N	{"fileName":null,"rows":4,"departmentsCreated":0,"divisionsCreated":0,"skipped":4}	\N	2026-07-08 16:06:23.700894
227	1	System Administrator	upload	departments	0	\N	{"fileName":"department-take-on-sheet.xlsx","rows":65,"departmentsCreated":7,"divisionsCreated":62,"skipped":3}	\N	2026-07-08 16:09:40.940891
228	1	System Administrator	delete	department	1	{"name":"Budget & Treasury"}	\N	\N	2026-07-08 16:10:41.266557
229	1	System Administrator	delete	department	3	{"name":"Community Services"}	\N	\N	2026-07-08 16:10:44.459779
230	1	System Administrator	delete	department	2	{"name":"Corporate Services"}	\N	\N	2026-07-08 16:10:46.741781
231	1	System Administrator	delete	department	4	{"name":"Infrastructural Planning & Development"}	\N	\N	2026-07-08 16:10:49.660657
232	1	System Administrator	delete	department	5	{"name":"Local Economic Development"}	\N	\N	2026-07-08 16:10:51.78297
233	1	System Administrator	delete	department	6	{"name":"Office Of The Executive Mayor"}	\N	\N	2026-07-08 16:10:54.20079
234	1	System Administrator	delete	department	7	{"name":"Office of the Municipal Manager"}	\N	\N	2026-07-08 16:10:56.662326
235	1	System Administrator	delete	department	8	{"name":"Office of the Speaker"}	\N	\N	2026-07-08 16:10:59.544875
236	1	System Administrator	delete	department	9	{"name":"Strategic Management"}	\N	\N	2026-07-08 16:11:01.898494
237	1	System Administrator	upload	departments	0	\N	{"fileName":"takeon.csv","rows":2,"departmentsCreated":1,"divisionsCreated":2,"skipped":0}	\N	2026-07-08 16:12:36.148966
238	1	System Administrator	delete	department	10	{"name":"Community Services"}	\N	\N	2026-07-08 16:12:43.330277
239	1	System Administrator	upload	departments	0	\N	{"fileName":"department-take-on-sheet.csv","rows":65,"departmentsCreated":9,"divisionsCreated":65,"skipped":0}	\N	2026-07-08 16:13:43.56388
240	1	System Administrator	update	department	11	{"name":"Budget & Treasury"}	{"name":"Budget & Treasury Test"}	\N	2026-07-08 16:22:42.91976
242	1	System Administrator	update	department	11	{"name":"Budget & Treasury Test"}	{"name":"Budget & Treasury"}	\N	2026-07-08 16:22:43.472105
243	1	System Administrator	update	division	69	{"name":"Test Division Name"}	{"name":"Budget Planning and Financial Reporting"}	\N	2026-07-08 16:22:43.571097
244	1	System Administrator	upload	departments	0	\N	{"fileName":null,"rows":1,"departmentsCreated":0,"divisionsCreated":1,"skipped":0}	\N	2026-07-08 16:24:56.997586
245	1	System Administrator	delete	division	134	{"name":"Temp Test Division"}	\N	\N	2026-07-08 16:24:57.45458
246	1	System Administrator	delete	division	70	{"name":"Expenditure and Payroll"}	\N	\N	2026-07-08 16:27:36.719769
247	1	System Administrator	upload	departments	0	\N	{"fileName":null,"rows":1,"departmentsCreated":0,"divisionsCreated":1,"skipped":0}	\N	2026-07-08 16:27:36.86267
248	1	System Administrator	create	department	20	\N	{"name":"Test Dept X","cycleId":1}	\N	2026-07-08 16:31:17.443607
249	1	System Administrator	create	division	136	\N	{"name":"Div A","departmentId":20}	\N	2026-07-08 16:31:17.868462
250	1	System Administrator	delete	department	20	{"name":"Test Dept X"}	\N	\N	2026-07-08 16:31:18.204944
251	1	System Administrator	create	department	21	\N	{"name":"Test Divs Dept","cycleId":1,"divisions":["Div One","Div Two"]}	\N	2026-07-08 16:33:44.928782
252	1	System Administrator	delete	department	21	{"name":"Test Divs Dept"}	\N	\N	2026-07-08 16:33:50.707324
253	1	System Administrator	create	user	10	\N	{"displayName":"Test Person","email":"t.person@municipality.gov.za","employeeNumber":"T001","level":"Staff"}	\N	2026-07-08 18:40:16.605964
254	1	System Administrator	update	user	10	{"displayName":"Test Person","email":"t.person@municipality.gov.za","employeeNumber":"T001","jobTitle":"Tester","level":"Staff","departmentId":11,"supervisorId":2}	{"displayName":"Test Person","email":"t.person@municipality.gov.za","employeeNumber":"T001","jobTitle":"Senior Tester","level":"Manager","departmentId":11,"supervisorId":2}	\N	2026-07-08 18:40:28.092477
255	1	System Administrator	create	user	11	\N	{"displayName":"Test Person","email":"test.person@municipality.gov.za","employeeNumber":"99","level":"Staff"}	\N	2026-07-08 18:48:29.989741
256	1	System Administrator	upload	users	0	\N	{"fileName":"emp.csv","rows":1,"created":1,"updated":0}	\N	2026-07-08 18:52:23.386937
257	1	System Administrator	upload	users	0	\N	{"fileName":"emp.csv","rows":1,"created":0,"updated":1}	\N	2026-07-08 18:52:23.536567
258	1	System Administrator	create	user	13	\N	{"displayName":"Del Me","email":"del.me@x.co","employeeNumber":null,"level":null}	\N	2026-07-08 18:56:19.144112
259	1	System Administrator	delete	user	13	{"displayName":"Del Me","email":"del.me@x.co","employeeNumber":null}	\N	\N	2026-07-08 18:56:19.268581
260	1	System Administrator	create	user	14	\N	{"displayName":"Sup Boss","email":"sup.boss@x.co","employeeNumber":null,"level":null}	\N	2026-07-08 18:56:27.641218
261	1	System Administrator	create	user	15	\N	{"displayName":"Sub Ordinate","email":"sub.ord@x.co","employeeNumber":null,"level":null}	\N	2026-07-08 18:56:27.778351
262	1	System Administrator	delete	user	14	{"displayName":"Sup Boss","email":"sup.boss@x.co","employeeNumber":null}	\N	\N	2026-07-08 18:56:27.898293
263	1	System Administrator	upload	users	0	\N	{"fileName":"dup.csv","rows":2,"created":2,"updated":0}	\N	2026-07-08 19:09:29.418992
264	1	System Administrator	upload	users	0	\N	{"fileName":"dup.csv","rows":2,"created":0,"updated":2}	\N	2026-07-08 19:09:29.522864
265	1	System Administrator	create	user	18	\N	{"displayName":"Carol White","email":"shared@muni.gov.za","employeeNumber":null,"level":null}	\N	2026-07-08 19:09:36.631572
266	1	System Administrator	upload	users	0	\N	{"fileName":"EmployeeDetails.csv","rows":12,"created":12,"updated":0}	\N	2026-07-08 19:10:44.606346
267	1	System Administrator	create	unit_of_measure	5	\N	{"id":5,"name":"Report","abbreviation":"RP","cycleId":1,"isActive":true}	\N	2026-07-08 19:49:22.292893
268	1	System Administrator	upload	users	0	\N	{"fileName":"EmployeeDetails.csv","rows":12,"created":0,"updated":12}	\N	2026-07-08 20:17:05.751005
269	1	System Administrator	delete	user	19	{"displayName":"Simon Moloi","email":"admin@municipality.gov.za","employeeNumber":"1"}	\N	\N	2026-07-08 20:17:33.356933
270	1	System Administrator	upload	users	0	\N	{"fileName":"EmployeeDetails.csv","rows":12,"created":12,"updated":0}	\N	2026-07-08 20:18:32.847708
271	1	System Administrator	create	scorecard_kpi	26	\N	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-08T20:20:36.042Z"}	1	2026-07-08 20:20:36.06715
272	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"2","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-08T20:20:36.396Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"2","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-08T20:20:36.400Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"2","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-08T20:20:36.404Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"2","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-08T20:20:36.408Z"}]}	\N	2026-07-08 20:20:36.411622
334	1	System Administrator	create	data_type	6	\N	{"id":6,"name":"Boolean","code":"boolean","isActive":true}	\N	2026-07-09 15:57:55.952053
341	1	System Administrator	update	unit_of_measure	2	{"id":2,"name":"Number","abbreviation":"#","dataTypeId":1,"cycleId":1,"isActive":true}	{"id":2,"name":"Number","abbreviation":"#","dataTypeId":1,"cycleId":1,"isActive":true}	\N	2026-07-09 16:11:37.15593
273	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-08T20:20:36.042Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":100,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-08T20:31:00.554Z"}	\N	2026-07-08 20:31:00.794418
274	1	System Administrator	transition:submit	scorecard	2	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-08 20:31:00.992458
275	1	System Administrator	create	unit_of_measure	6	\N	{"id":6,"name":"Date","abbreviation":"D","cycleId":1,"isActive":true}	\N	2026-07-08 20:35:51.05652
276	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"10","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-08T20:40:56.943Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"N/A","targetStatus":"na","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-08T20:40:57.020Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"On Hold","targetStatus":"on_hold","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-08T20:40:57.023Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"20","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-08T20:40:57.026Z"}]}	\N	2026-07-08 20:40:57.031587
277	1	System Administrator	create	scorecard_kpi	27	\N	{"id":27,"scorecardId":2,"kpiNumber":"2","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":null,"cf_quarter_3_poe":null,"cf_quarter_4_poe":null,"cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-08T21:32:55.284Z"}	1	2026-07-08 21:32:55.313437
278	1	System Administrator	upsert	kpi_quarter_targets	27	\N	{"targets":[{"id":92,"kpiId":27,"quarter":1,"targetValue":"AFS Submitted","targetStatus":"active","budgetValue":null,"evidenceExpected":"Annual financial statement and acknowledgement of receit by AGSA","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.301Z","updatedAt":"2026-07-08T21:32:55.664Z"},{"id":93,"kpiId":27,"quarter":2,"targetValue":"N/A","targetStatus":"na","budgetValue":null,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.304Z","updatedAt":"2026-07-08T21:32:55.669Z"},{"id":94,"kpiId":27,"quarter":3,"targetValue":"N/A","targetStatus":"na","budgetValue":null,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.307Z","updatedAt":"2026-07-08T21:32:55.672Z"},{"id":95,"kpiId":27,"quarter":4,"targetValue":"N/A","targetStatus":"na","budgetValue":null,"evidenceExpected":null,"isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.310Z","updatedAt":"2026-07-08T21:32:55.675Z"}]}	\N	2026-07-08 21:32:55.678939
279	1	System Administrator	create	scorecard_kpi	28	\N	{"id":28,"scorecardId":2,"kpiNumber":"3","description":"Percentage implementation of the approved Internal Audit Plan.","idpReference":null,"strategicObjective":"Strategic Objective\\tKPI\\tUnit of Measure\\nStrengthen governance and internal control","programme":null,"responsiblePostId":32,"custodianPostId":null,"baseline":"0%","annualTarget":"100% of the approved Internal Audit Plan implemented","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Good Governance & Public Participation","cf_department":"Office of the Municipal Manager","cf_quarter_1_poe":"Internal Audit Progress Report","cf_quarter_2_poe":"Internal Audit Progress Report","cf_quarter_3_poe":"Internal Audit Progress Report","cf_quarter_4_poe":"Internal Audit Progress Report","cf_quarter_1_target":"25","cf_quarter_2_target":"50","cf_quarter_3_target":"75","cf_quarter_4_target":"100"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T21:39:20.214Z","updatedAt":"2026-07-08T21:39:20.214Z"}	1	2026-07-08 21:39:20.503623
280	1	System Administrator	upsert	kpi_quarter_targets	28	\N	{"targets":[{"id":96,"kpiId":28,"quarter":1,"targetValue":"25","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.343Z","updatedAt":"2026-07-08T21:39:20.872Z"},{"id":97,"kpiId":28,"quarter":2,"targetValue":"50","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.347Z","updatedAt":"2026-07-08T21:39:20.875Z"},{"id":98,"kpiId":28,"quarter":3,"targetValue":"75","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.357Z","updatedAt":"2026-07-08T21:39:20.879Z"},{"id":99,"kpiId":28,"quarter":4,"targetValue":"100","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.500Z","updatedAt":"2026-07-08T21:39:20.881Z"}]}	\N	2026-07-08 21:39:20.885003
281	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-08T20:31:00.985Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T07:42:40.210Z"}	\N	2026-07-09 07:42:40.346021
282	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T07:42:40.210Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T07:42:59.357Z"}	\N	2026-07-09 07:42:59.362446
283	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 07:54:43.694816
284	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 07:56:10.958957
285	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T07:56:10.802Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T07:59:43.118Z"}	\N	2026-07-09 07:59:43.151063
335	1	System Administrator	update	unit_of_measure	1	{"id":1,"name":"Percentage","abbreviation":"%","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":1,"name":"Percentage","abbreviation":"%","dataTypeId":2,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.179466
336	1	System Administrator	update	unit_of_measure	2	{"id":2,"name":"Number","abbreviation":"#","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":2,"name":"Number","abbreviation":"#","dataTypeId":1,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.410735
337	1	System Administrator	update	unit_of_measure	3	{"id":3,"name":"Rand","abbreviation":"R","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":3,"name":"Rand","abbreviation":"R","dataTypeId":3,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.713501
286	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"10","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T07:59:43.468Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"12","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T07:59:43.472Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"15","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T07:59:43.475Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"20","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T07:59:43.478Z"}]}	\N	2026-07-09 07:59:43.482841
287	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[27,26,28]}	\N	2026-07-09 08:01:33.502425
288	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 08:01:36.815975
289	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,28,27]}	\N	2026-07-09 08:01:38.616292
290	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 08:01:41.046024
291	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T08:01:41.040Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T08:01:56.663Z"}	\N	2026-07-09 08:01:56.670331
292	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"10","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T08:01:57.035Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"12","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T08:01:57.038Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"15","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T08:01:57.041Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"20","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T08:01:57.045Z"}]}	\N	2026-07-09 08:01:57.049003
293	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[28,26,27]}	\N	2026-07-09 08:04:53.398781
294	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 08:04:53.535743
295	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[27,28,26]}	\N	2026-07-09 08:06:04.074215
296	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 08:06:04.182939
297	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[27,26,28]}	\N	2026-07-09 08:08:19.556605
298	1	System Administrator	update	scorecard_kpi	27	{"id":27,"scorecardId":2,"kpiNumber":"1","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":null,"cf_quarter_3_poe":null,"cf_quarter_4_poe":null,"cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T08:08:19.522Z"}	{"id":27,"scorecardId":2,"kpiNumber":"1","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T08:08:53.151Z"}	\N	2026-07-09 08:08:53.159884
299	1	System Administrator	upsert	kpi_quarter_targets	27	\N	{"targets":[{"id":92,"kpiId":27,"quarter":1,"targetValue":"AFS Submitted","targetStatus":"active","budgetValue":null,"evidenceExpected":"Annual financial statement and acknowledgement of receit by AGSA","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.301Z","updatedAt":"2026-07-09T08:08:53.503Z"},{"id":93,"kpiId":27,"quarter":2,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.304Z","updatedAt":"2026-07-09T08:08:53.507Z"},{"id":94,"kpiId":27,"quarter":3,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.307Z","updatedAt":"2026-07-09T08:08:53.511Z"},{"id":95,"kpiId":27,"quarter":4,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.310Z","updatedAt":"2026-07-09T08:08:53.514Z"}]}	\N	2026-07-09 08:08:53.518023
300	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,27,28]}	\N	2026-07-09 08:09:01.059332
301	1	System Administrator	update	scorecard_kpi	27	{"id":27,"scorecardId":2,"kpiNumber":"2","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":null,"sortOrder":1,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T08:09:01.055Z"}	{"id":27,"scorecardId":2,"kpiNumber":"2","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":null,"sortOrder":1,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T08:09:11.099Z"}	\N	2026-07-09 08:09:11.106151
302	1	System Administrator	upsert	kpi_quarter_targets	27	\N	{"targets":[{"id":92,"kpiId":27,"quarter":1,"targetValue":"AFS Submitted","targetStatus":"active","budgetValue":null,"evidenceExpected":"Annual financial statement and acknowledgement of receit by AGSA","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.301Z","updatedAt":"2026-07-09T08:09:11.426Z"},{"id":93,"kpiId":27,"quarter":2,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.304Z","updatedAt":"2026-07-09T08:09:11.429Z"},{"id":94,"kpiId":27,"quarter":3,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.307Z","updatedAt":"2026-07-09T08:09:11.432Z"},{"id":95,"kpiId":27,"quarter":4,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.310Z","updatedAt":"2026-07-09T08:09:11.435Z"}]}	\N	2026-07-09 08:09:11.438634
303	1	System Administrator	reorder	scorecard	2	\N	{"kpiIds":[26,28,27]}	\N	2026-07-09 08:20:21.636325
304	1	System Administrator	create	scorecard	4	\N	{"id":4,"name":"WeightTest","cycleId":1,"scorecardType":"organisational","departmentId":null,"status":"Draft","approvedById":null,"approvedAt":null,"approvalComments":null,"returnComments":null,"fieldConfigSnapshot":null,"createdById":1,"createdAt":"2026-07-09T08:24:28.411Z","updatedAt":"2026-07-09T08:24:28.411Z"}	1	2026-07-09 08:24:28.452714
305	1	System Administrator	create	scorecard_kpi	29	\N	{"id":29,"scorecardId":4,"kpiNumber":"1","description":"test","idpReference":null,"strategicObjective":null,"programme":null,"responsiblePostId":null,"custodianPostId":null,"baseline":null,"annualTarget":"1","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":null,"dataTypeId":null,"kpiGroupId":null,"status":"Draft","isCumulative":false,"customFields":null,"returnComments":null,"sortOrder":0,"createdAt":"2026-07-09T08:24:28.565Z","updatedAt":"2026-07-09T08:24:28.565Z"}	1	2026-07-09 08:24:28.574107
306	1	System Administrator	transition:submit	scorecard	4	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-09 08:24:28.669218
307	1	System Administrator	transition:submit	scorecard	2	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-09 11:12:19.028219
308	1	System Administrator	transition:review	scorecard_kpi	26	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 11:15:07.256725
309	1	System Administrator	transition:approve	scorecard_kpi	26	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 11:15:10.265808
310	110	Tmp Reviewer	transition:return	scorecard_kpi	27	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-09 13:25:41.16411
338	1	System Administrator	update	unit_of_measure	4	{"id":4,"name":"Days","abbreviation":"d","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":4,"name":"Days","abbreviation":"d","dataTypeId":1,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.792607
339	1	System Administrator	update	unit_of_measure	5	{"id":5,"name":"Report","abbreviation":"RP","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":5,"name":"Report","abbreviation":"RP","dataTypeId":5,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.857921
340	1	System Administrator	update	unit_of_measure	6	{"id":6,"name":"Date","abbreviation":"D","dataTypeId":null,"cycleId":1,"isActive":true}	{"id":6,"name":"Date","abbreviation":"D","dataTypeId":4,"cycleId":1,"isActive":true}	\N	2026-07-09 16:00:08.920094
515	1	System Administrator	actual:approve	kpi_quarter_actual	485	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 07:07:36.258018
311	1	System Administrator	update	scorecard_kpi	27	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Please correct the target","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T13:25:41.142Z"}	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Please correct the target","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T13:25:48.490Z"}	\N	2026-07-09 13:25:48.495159
312	1	System Administrator	transition:submit	scorecard_kpi	27	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-09 13:25:48.601657
313	1	System Administrator	transition:return	scorecard	2	{"status":"Submitted"}	{"status":"Draft"}	1	2026-07-09 13:28:51.906771
314	1	System Administrator	transition:submit	scorecard	2	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-09 13:29:21.975887
315	1	System Administrator	transition:return	scorecard	2	{"status":"Submitted"}	{"status":"Draft"}	1	2026-07-09 13:29:22.151597
316	1	System Administrator	transition:submit	scorecard	2	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-09 13:29:32.572934
317	1	System Administrator	generate	report_run	5	\N	{"id":5,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:09:58.121Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:09:58.122Z\\"}","createdAt":"2026-07-09T14:09:58.123Z"}	1	2026-07-09 14:09:58.390665
318	1	System Administrator	generate	report_run	6	\N	{"id":6,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:12:22.907Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:12:22.907Z\\"}","createdAt":"2026-07-09T14:12:22.908Z"}	1	2026-07-09 14:12:22.917945
319	1	System Administrator	generate	report_run	19	\N	{"id":19,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:27:07.877Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:27:07.877Z\\"}","createdAt":"2026-07-09T14:27:07.879Z"}	1	2026-07-09 14:27:08.145237
320	1	System Administrator	generate	report_run	24	\N	{"id":24,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:30:57.627Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:30:57.627Z\\"}","createdAt":"2026-07-09T14:30:57.630Z"}	1	2026-07-09 14:30:57.649176
321	1	System Administrator	generate	report_run	25	\N	{"id":25,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:32:28.187Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:32:28.187Z\\"}","createdAt":"2026-07-09T14:32:28.189Z"}	1	2026-07-09 14:32:28.19981
322	1	System Administrator	generate	report_run	26	\N	{"id":26,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:36:44.729Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:36:44.729Z\\"}","createdAt":"2026-07-09T14:36:44.730Z"}	1	2026-07-09 14:36:44.769695
323	1	System Administrator	generate	report_run	27	\N	{"id":27,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:39:40.774Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:39:40.774Z\\"}","createdAt":"2026-07-09T14:39:40.774Z"}	1	2026-07-09 14:39:40.78994
324	1	System Administrator	generate	report_run	28	\N	{"id":28,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:49:28.306Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:49:28.306Z\\"}","createdAt":"2026-07-09T14:49:28.307Z"}	1	2026-07-09 14:49:28.422323
325	1	System Administrator	generate	report_run	29	\N	{"id":29,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T14:55:19.288Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T14:55:19.288Z\\"}","createdAt":"2026-07-09T14:55:19.289Z"}	1	2026-07-09 14:55:19.403177
326	1	System Administrator	transition:return	scorecard_kpi	26	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-09 15:41:08.005321
327	1	System Administrator	transition:return	scorecard_kpi	28	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-09 15:41:18.627458
328	1	System Administrator	transition:return	scorecard_kpi	27	{"status":"Submitted"}	{"status":"Draft"}	\N	2026-07-09 15:41:27.716385
329	1	System Administrator	create	data_type	1	\N	{"id":1,"name":"Numeric","code":"numeric","isActive":true}	\N	2026-07-09 15:57:55.534298
330	1	System Administrator	create	data_type	2	\N	{"id":2,"name":"Percentage","code":"percentage","isActive":true}	\N	2026-07-09 15:57:55.690187
331	1	System Administrator	create	data_type	3	\N	{"id":3,"name":"Currency","code":"currency","isActive":true}	\N	2026-07-09 15:57:55.764333
332	1	System Administrator	create	data_type	4	\N	{"id":4,"name":"Date","code":"date","isActive":true}	\N	2026-07-09 15:57:55.824099
333	1	System Administrator	create	data_type	5	\N	{"id":5,"name":"Text","code":"text","isActive":true}	\N	2026-07-09 15:57:55.891229
342	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T15:41:07.776Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T16:15:15.866Z"}	\N	2026-07-09 16:15:16.344607
343	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"10","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T16:15:16.783Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"12","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T16:15:16.881Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"15","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T16:15:16.884Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"20","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T16:15:16.887Z"}]}	\N	2026-07-09 16:15:16.890697
344	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"10","cf_quarter_2_target":"12","cf_quarter_3_target":"15","cf_quarter_4_target":"20"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T16:15:15.866Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T16:24:38.061Z"}	\N	2026-07-09 16:24:38.505248
345	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T16:24:38.937Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T16:24:38.980Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T16:24:38.985Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T16:24:38.989Z"}]}	\N	2026-07-09 16:24:38.994932
362	1	System Administrator	generate	report_run	31	\N	{"id":31,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T16:57:10.349Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T16:57:10.349Z\\"}","createdAt":"2026-07-09T16:57:10.349Z"}	1	2026-07-09 16:57:10.401601
364	1	System Administrator	generate	report_run	33	\N	{"id":33,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":null,"title":"UoM check","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T17:08:24.057Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T17:08:24.057Z\\"}","createdAt":"2026-07-09T17:08:24.058Z"}	1	2026-07-09 17:08:24.149809
346	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T16:24:38.061Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":"Correct Unit of measure","sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T16:24:48.289Z"}	\N	2026-07-09 16:24:48.296849
347	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T16:24:48.691Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T16:24:48.695Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T16:24:48.698Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T16:24:48.705Z"}]}	\N	2026-07-09 16:24:48.70834
348	1	System Administrator	transition:submit	scorecard_kpi	26	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-09 16:24:49.032468
349	1	System Administrator	update	scorecard_kpi	28	{"id":28,"scorecardId":2,"kpiNumber":"2","description":"Percentage implementation of the approved Internal Audit Plan.","idpReference":null,"strategicObjective":"Strategic Objective\\tKPI\\tUnit of Measure\\nStrengthen governance and internal control","programme":null,"responsiblePostId":32,"custodianPostId":null,"baseline":"0%","annualTarget":"100% of the approved Internal Audit Plan implemented","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":5,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Good Governance & Public Participation","cf_department":"Office of the Municipal Manager","cf_quarter_1_poe":"Internal Audit Progress Report","cf_quarter_2_poe":"Internal Audit Progress Report","cf_quarter_3_poe":"Internal Audit Progress Report","cf_quarter_4_poe":"Internal Audit Progress Report","cf_quarter_1_target":"25","cf_quarter_2_target":"50","cf_quarter_3_target":"75","cf_quarter_4_target":"100"},"returnComments":"Correct unit of measure","sortOrder":1,"createdAt":"2026-07-08T21:39:20.214Z","updatedAt":"2026-07-09T15:41:18.528Z"}	{"id":28,"scorecardId":2,"kpiNumber":"2","description":"Percentage implementation of the approved Internal Audit Plan.","idpReference":null,"strategicObjective":"Strategic Objective\\tKPI\\tUnit of Measure\\nStrengthen governance and internal control","programme":null,"responsiblePostId":32,"custodianPostId":null,"baseline":"0%","annualTarget":"100% of the approved Internal Audit Plan implemented","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":1,"dataTypeId":null,"kpiGroupId":5,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Good Governance & Public Participation","cf_department":"Office of the Municipal Manager","cf_quarter_1_poe":"Internal Audit Progress Report","cf_quarter_2_poe":"Internal Audit Progress Report","cf_quarter_3_poe":"Internal Audit Progress Report","cf_quarter_4_poe":"Internal Audit Progress Report","cf_quarter_1_target":"25%","cf_quarter_2_target":"50%","cf_quarter_3_target":"75%","cf_quarter_4_target":"100%"},"returnComments":"Correct unit of measure","sortOrder":1,"createdAt":"2026-07-08T21:39:20.214Z","updatedAt":"2026-07-09T16:25:33.336Z"}	\N	2026-07-09 16:25:33.445408
350	1	System Administrator	upsert	kpi_quarter_targets	28	\N	{"targets":[{"id":96,"kpiId":28,"quarter":1,"targetValue":"25%","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.343Z","updatedAt":"2026-07-09T16:25:33.757Z"},{"id":97,"kpiId":28,"quarter":2,"targetValue":"50%","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.347Z","updatedAt":"2026-07-09T16:25:33.760Z"},{"id":98,"kpiId":28,"quarter":3,"targetValue":"75%","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.357Z","updatedAt":"2026-07-09T16:25:33.763Z"},{"id":99,"kpiId":28,"quarter":4,"targetValue":"100%","targetStatus":"active","budgetValue":null,"evidenceExpected":"Internal Audit Progress Report","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:39:20.500Z","updatedAt":"2026-07-09T16:25:33.769Z"}]}	\N	2026-07-09 16:25:33.772235
351	1	System Administrator	transition:submit	scorecard_kpi	28	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-09 16:25:34.107939
363	1	System Administrator	generate	report_run	32	\N	{"id":32,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T17:05:25.995Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T17:05:25.995Z\\"}","createdAt":"2026-07-09T17:05:25.995Z"}	1	2026-07-09 17:05:26.183527
365	1	System Administrator	generate	report_run	34	\N	{"id":34,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T17:09:24.236Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T17:09:24.236Z\\"}","createdAt":"2026-07-09T17:09:24.237Z"}	1	2026-07-09 17:09:24.269107
352	1	System Administrator	update	scorecard_kpi	27	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Correct unit of measure","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T15:41:27.711Z"}	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted by 31 Aug 2026","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Correct unit of measure","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T16:26:00.463Z"}	\N	2026-07-09 16:26:00.472006
353	1	System Administrator	upsert	kpi_quarter_targets	27	\N	{"targets":[{"id":92,"kpiId":27,"quarter":1,"targetValue":"AFS Submitted by 31 Aug 2026","targetStatus":"active","budgetValue":null,"evidenceExpected":"Annual financial statement and acknowledgement of receit by AGSA","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.301Z","updatedAt":"2026-07-09T16:26:00.789Z"},{"id":93,"kpiId":27,"quarter":2,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.304Z","updatedAt":"2026-07-09T16:26:00.793Z"},{"id":94,"kpiId":27,"quarter":3,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.307Z","updatedAt":"2026-07-09T16:26:00.915Z"},{"id":95,"kpiId":27,"quarter":4,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.310Z","updatedAt":"2026-07-09T16:26:00.918Z"}]}	\N	2026-07-09 16:26:00.924075
354	1	System Administrator	update	scorecard_kpi	27	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted by 31 Aug 2026","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Correct unit of measure","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T16:26:00.463Z"}	{"id":27,"scorecardId":2,"kpiNumber":"3","description":"Submission of the 2024/2025 Annual financial statement to AGSA.","idpReference":null,"strategicObjective":"To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.","programme":null,"responsiblePostId":37,"custodianPostId":null,"baseline":"31 Aug","annualTarget":"31 Aug 2026","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":6,"dataTypeId":null,"kpiGroupId":4,"status":"Draft","isCumulative":false,"customFields":{"cf_nkpa":"Municipal Financial Viability & Management","cf_department":"Budget & Treasury","cf_quarter_1_poe":"Annual financial statement and acknowledgement of receit by AGSA","cf_quarter_2_poe":"N/A","cf_quarter_3_poe":"N/A","cf_quarter_4_poe":"N/A","cf_quarter_1_target":"AFS Submitted by 31 Aug 2026","cf_quarter_2_target":"N/A","cf_quarter_3_target":"N/A","cf_quarter_4_target":"N/A"},"returnComments":"Correct unit of measure","sortOrder":2,"createdAt":"2026-07-08T21:32:55.284Z","updatedAt":"2026-07-09T16:26:19.205Z"}	\N	2026-07-09 16:26:19.242657
355	1	System Administrator	upsert	kpi_quarter_targets	27	\N	{"targets":[{"id":92,"kpiId":27,"quarter":1,"targetValue":"AFS Submitted by 31 Aug 2026","targetStatus":"active","budgetValue":null,"evidenceExpected":"Annual financial statement and acknowledgement of receit by AGSA","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.301Z","updatedAt":"2026-07-09T16:26:19.632Z"},{"id":93,"kpiId":27,"quarter":2,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.304Z","updatedAt":"2026-07-09T16:26:19.636Z"},{"id":94,"kpiId":27,"quarter":3,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.307Z","updatedAt":"2026-07-09T16:26:19.646Z"},{"id":95,"kpiId":27,"quarter":4,"targetValue":"N/A","targetStatus":"active","budgetValue":null,"evidenceExpected":"N/A","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T21:32:55.310Z","updatedAt":"2026-07-09T16:26:19.649Z"}]}	\N	2026-07-09 16:26:19.653729
356	1	System Administrator	transition:submit	scorecard_kpi	27	{"status":"Draft"}	{"status":"Submitted"}	\N	2026-07-09 16:26:20.042716
357	1	System Administrator	transition:review	scorecard_kpi	28	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 16:33:46.791701
358	1	System Administrator	transition:review	scorecard_kpi	26	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 16:33:54.32266
359	1	System Administrator	transition:review	scorecard_kpi	27	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 16:33:58.455258
360	1	System Administrator	transition:review	scorecard	2	{"status":"Submitted"}	{"status":"Reviewed"}	1	2026-07-09 16:33:59.137119
361	1	System Administrator	generate	report_run	30	\N	{"id":30,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T16:42:30.533Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T16:42:30.533Z\\"}","createdAt":"2026-07-09T16:42:30.533Z"}	1	2026-07-09 16:42:30.773284
366	1	System Administrator	generate	report_run	35	\N	{"id":35,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":null,"title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:09:09.152Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:09:09.152Z\\"}","createdAt":"2026-07-09T18:09:09.153Z"}	1	2026-07-09 18:09:09.243852
367	1	System Administrator	generate	report_run	36	\N	{"id":36,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:09:56.930Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:09:56.930Z\\"}","createdAt":"2026-07-09T18:09:56.930Z"}	1	2026-07-09 18:09:56.967957
368	1	System Administrator	generate	report_run	37	\N	{"id":37,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":null,"title":"Order check","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:12:13.420Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:12:13.420Z\\"}","createdAt":"2026-07-09T18:12:13.421Z"}	1	2026-07-09 18:12:13.559259
369	1	System Administrator	generate	report_run	38	\N	{"id":38,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":null,"title":"Order check3","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:12:58.278Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:12:58.278Z\\"}","createdAt":"2026-07-09T18:12:58.279Z"}	1	2026-07-09 18:12:58.300076
370	1	System Administrator	generate	report_run	39	\N	{"id":39,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:15:51.467Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:15:51.467Z\\"}","createdAt":"2026-07-09T18:15:51.468Z"}	1	2026-07-09 18:15:51.567374
371	1	System Administrator	generate	report_run	40	\N	{"id":40,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T18:18:51.261Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T18:18:51.261Z\\"}","createdAt":"2026-07-09T18:18:51.262Z"}	1	2026-07-09 18:18:51.298934
372	1	System Administrator	create	kpi_quarter_actual	463	\N	{"id":463,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"3","commentary":null,"isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T18:49:53.060Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T18:49:53.060Z","updatedAt":"2026-07-09T18:49:53.060Z"}	\N	2026-07-09 18:49:53.069772
373	1	System Administrator	create	kpi_quarter_actual	464	\N	{"id":464,"kpiId":26,"periodType":"quarterly","quarter":2,"actualValue":"1","commentary":"c","isAchieved":false,"assessment":"Partially Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"ch","correctiveAction":"ca","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T18:49:53.263Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T18:49:53.263Z","updatedAt":"2026-07-09T18:49:53.263Z"}	\N	2026-07-09 18:49:53.267898
374	1	System Administrator	create	kpi_quarter_actual	465	\N	{"id":465,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"25%","commentary":null,"isAchieved":true,"assessment":"Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T18:49:53.498Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T18:49:53.498Z","updatedAt":"2026-07-09T18:49:53.498Z"}	\N	2026-07-09 18:49:53.503501
375	1	System Administrator	create	kpi_quarter_actual	466	\N	{"id":466,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"2026-08-15","commentary":"c","isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T18:49:53.616Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T18:49:53.616Z","updatedAt":"2026-07-09T18:49:53.616Z"}	\N	2026-07-09 18:49:53.620382
376	1	System Administrator	actual:submit	kpi_quarter_actual	463	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 18:50:17.292832
377	1	System Administrator	actual:submit	kpi_quarter_actual	465	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 18:50:17.334289
378	1	System Administrator	actual:reject	kpi_quarter_actual	463	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Rejected","reviewLevel":"line_manager"}	\N	2026-07-09 18:50:17.620228
379	1	System Administrator	create	kpi_quarter_actual	467	\N	{"id":467,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"5","commentary":null,"isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:14:06.083Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:14:06.083Z","updatedAt":"2026-07-09T19:14:06.083Z"}	\N	2026-07-09 19:14:06.091039
380	1	System Administrator	actual:submit	kpi_quarter_actual	467	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:14:19.958289
381	1	System Administrator	actual:return	kpi_quarter_actual	467	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-09 19:14:40.022389
449	1	System Administrator	upload	kpi_evidence_document	47	\N	{"id":47,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"poe2.txt","fileSize":15,"mimeType":"text/plain","filePath":"/objects/uploads/b06d2705-b533-4387-9873-a128b137ffa2","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:56:23.014Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 23:56:23.030545
382	1	System Administrator	update	kpi_quarter_actual	467	{"id":467,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"5","commentary":null,"isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:14:06.083Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Please add commentary\\n\\nFields requiring correction: Comment, Evidence","reviewedById":1,"reviewedAt":"2026-07-09T19:14:40.014Z","createdAt":"2026-07-09T19:14:06.083Z","updatedAt":"2026-07-09T19:14:40.014Z"}	{"id":467,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"5","commentary":"Target exceeded due to additional capacity","isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:14:06.083Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Please add commentary\\n\\nFields requiring correction: Comment, Evidence","reviewedById":1,"reviewedAt":"2026-07-09T19:14:40.014Z","createdAt":"2026-07-09T19:14:06.083Z","updatedAt":"2026-07-09T19:14:40.086Z"}	\N	2026-07-09 19:14:40.090318
383	1	System Administrator	upload	kpi_evidence_document	41	\N	{"id":41,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"proof.pdf","fileSize":100,"mimeType":"application/pdf","filePath":"/uploads/26/proof.pdf","documentType":"Report","description":"Q1 proof","uploadedById":1,"uploadedAt":"2026-07-09T19:14:40.174Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 19:14:40.179897
384	1	System Administrator	actual:submit	kpi_quarter_actual	467	{"status":"Returned","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:14:40.22161
385	1	System Administrator	actual:approve	kpi_quarter_actual	467	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-07-09 19:14:40.409559
386	1	System Administrator	create	kpi_quarter_actual	468	\N	{"id":468,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"1","commentary":"low","isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:14:54.454Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:14:54.454Z","updatedAt":"2026-07-09T19:14:54.454Z"}	\N	2026-07-09 19:14:54.460409
387	1	System Administrator	actual:submit	kpi_quarter_actual	468	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:15:13.333259
388	1	System Administrator	actual:reject	kpi_quarter_actual	468	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Rejected","reviewLevel":"line_manager"}	\N	2026-07-09 19:15:13.538683
389	1	System Administrator	create	kpi_quarter_actual	469	\N	{"id":469,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"ok","isAchieved":false,"assessment":"Partially Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"c","correctiveAction":"a","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:15:59.239Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:15:59.239Z","updatedAt":"2026-07-09T19:15:59.239Z"}	\N	2026-07-09 19:15:59.248465
390	1	System Administrator	actual:submit	kpi_quarter_actual	469	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:15:59.328174
391	1	System Administrator	actual:return	kpi_quarter_actual	469	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-09 19:15:59.396469
392	1	System Administrator	create	kpi_quarter_actual	470	\N	{"id":470,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"3","commentary":"Three projects completed this quarter","isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:16:50.327Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:16:50.327Z","updatedAt":"2026-07-09T19:16:50.327Z"}	\N	2026-07-09 19:16:50.343029
393	1	System Administrator	upload	kpi_evidence_document	42	\N	{"id":42,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"q1-completion-report.pdf","fileSize":1000,"mimeType":"application/pdf","filePath":"/uploads/26/q1-completion-report.pdf","documentType":"Report","description":"Q1 completion report","uploadedById":1,"uploadedAt":"2026-07-09T19:16:50.424Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 19:16:50.431317
394	1	System Administrator	actual:submit	kpi_quarter_actual	470	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:16:50.500684
395	31	Simon Moloi	create	kpi_quarter_actual	471	\N	{"id":471,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"50","commentary":"Test commentary for fanout","isAchieved":true,"assessment":"Over Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":31,"submittedAt":"2026-07-09T19:27:03.709Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:27:03.709Z","updatedAt":"2026-07-09T19:27:03.709Z"}	\N	2026-07-09 19:27:03.722232
396	31	Simon Moloi	actual:submit	kpi_quarter_actual	471	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-09 19:27:03.793003
397	1	System Administrator	actual:approve	kpi_quarter_actual	471	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"director"}	\N	2026-07-09 19:28:25.095519
398	1	System Administrator	actual:reject	kpi_quarter_actual	471	{"status":"In Review","reviewLevel":"director"}	{"status":"Rejected","reviewLevel":"director"}	\N	2026-07-09 19:28:37.88349
516	1	System Administrator	actual:approve	kpi_quarter_actual	486	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 07:07:39.115321
399	1	System Administrator	create	kpi_quarter_actual	472	\N	{"id":472,"kpiId":26,"periodType":"quarterly","quarter":3,"actualValue":"2","commentary":"Two tuckshops procured in Q3","isAchieved":true,"assessment":"Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:40:06.075Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:40:06.075Z","updatedAt":"2026-07-09T19:40:06.075Z"}	\N	2026-07-09 19:40:06.193332
400	1	System Administrator	upload	kpi_evidence_document	45	\N	{"id":45,"kpiId":26,"periodType":"quarterly","quarter":3,"fileName":"grn-q3.pdf","fileSize":2048,"mimeType":"application/pdf","filePath":"/uploads/26/grn-q3.pdf","documentType":"GRN","description":"Q3 GRN","uploadedById":1,"uploadedAt":"2026-07-09T19:40:16.085Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 19:40:16.090753
401	1	System Administrator	create	kpi_quarter_actual	473	\N	{"id":473,"kpiId":26,"periodType":"quarterly","quarter":3,"actualValue":"2","commentary":"t","isAchieved":true,"assessment":"Achieved","progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"c","correctiveAction":"a","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T19:48:22.194Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T19:48:22.194Z","updatedAt":"2026-07-09T19:48:22.194Z"}	\N	2026-07-09 19:48:22.20732
402	1	System Administrator	transition:approve	scorecard_kpi	26	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:53:34.1316
403	1	System Administrator	transition:approve	scorecard_kpi	27	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:53:34.230471
404	1	System Administrator	transition:approve	scorecard_kpi	28	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:53:34.31388
405	1	System Administrator	transition:approve	scorecard	2	{"status":"Reviewed"}	{"status":"Approved"}	1	2026-07-09 19:53:34.56176
406	1	System Administrator	transition:approve	scorecard_kpi	26	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:55:11.571922
407	1	System Administrator	transition:approve	scorecard_kpi	28	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:55:11.944239
408	1	System Administrator	transition:approve	scorecard_kpi	27	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 19:55:12.351129
409	1	System Administrator	transition:approve	scorecard	2	{"status":"Reviewed"}	{"status":"Approved"}	1	2026-07-09 19:55:12.749902
410	1	System Administrator	generate	report_run	41	\N	{"id":41,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T19:56:34.259Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T19:56:34.259Z\\"}","createdAt":"2026-07-09T19:56:34.260Z"}	1	2026-07-09 19:56:34.360742
411	1	System Administrator	transition:reopen	scorecard	2	{"status":"Approved"}	{"status":"Draft"}	1	2026-07-09 20:07:30.414159
412	1	System Administrator	transition:reopen	scorecard	2	{"status":"Approved"}	{"status":"Draft"}	1	2026-07-09 20:10:12.060913
413	1	System Administrator	generate	report_run	42	\N	{"id":42,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T20:10:50.375Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T20:10:50.375Z\\"}","createdAt":"2026-07-09T20:10:50.376Z"}	1	2026-07-09 20:10:50.383057
414	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T20:10:11.818Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T20:12:21.270Z"}	\N	2026-07-09 20:12:21.400215
415	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T20:12:21.761Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T20:12:21.767Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T20:12:21.772Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T20:12:21.777Z"}]}	\N	2026-07-09 20:12:21.786231
416	1	System Administrator	update	scorecard_kpi	26	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T20:12:21.270Z"}	{"id":26,"scorecardId":2,"kpiNumber":"1","description":"Procurement of 8 mobile tuckshops","idpReference":null,"strategicObjective":"Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.","programme":null,"responsiblePostId":41,"custodianPostId":null,"baseline":"6","annualTarget":"8","annualBudgetTarget":null,"evidenceSource":null,"evidencePortfolio":null,"weighting":0,"fundingSource":null,"budgetDescription":null,"unitOfMeasureId":2,"dataTypeId":null,"kpiGroupId":2,"status":"Draft","isCumulative":true,"customFields":{"cf_nkpa":"Local Economic Development","cf_department":"Local Economic Development","cf_quarter_1_poe":"GRN and approved payment voucher","cf_quarter_2_poe":"GRN and approved payment voucher","cf_quarter_3_poe":"GRN and approved payment voucher","cf_quarter_4_poe":"GRN and approved payment voucher","cf_quarter_1_target":"2","cf_quarter_2_target":"2","cf_quarter_3_target":"2","cf_quarter_4_target":"2"},"returnComments":null,"sortOrder":0,"createdAt":"2026-07-08T20:20:36.042Z","updatedAt":"2026-07-09T20:12:47.910Z"}	\N	2026-07-09 20:12:47.9174
417	1	System Administrator	upsert	kpi_quarter_targets	26	\N	{"targets":[{"id":88,"kpiId":26,"quarter":1,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.054Z","updatedAt":"2026-07-09T20:12:48.311Z"},{"id":89,"kpiId":26,"quarter":2,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.058Z","updatedAt":"2026-07-09T20:12:48.316Z"},{"id":90,"kpiId":26,"quarter":3,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.061Z","updatedAt":"2026-07-09T20:12:48.319Z"},{"id":91,"kpiId":26,"quarter":4,"targetValue":"2","targetStatus":"active","budgetValue":null,"evidenceExpected":"GRN and approved payment voucher","isApprovedBaseline":false,"baselineTargetValue":null,"baselineBudgetValue":null,"revisionReason":null,"revisedAt":null,"revisedById":null,"createdAt":"2026-07-08T20:20:36.063Z","updatedAt":"2026-07-09T20:12:48.323Z"}]}	\N	2026-07-09 20:12:48.328955
418	1	System Administrator	transition:submit	scorecard	2	{"status":"Draft"}	{"status":"Submitted"}	1	2026-07-09 20:12:59.223786
419	1	System Administrator	transition:review	scorecard_kpi	26	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 20:15:02.30873
420	1	System Administrator	transition:review	scorecard_kpi	28	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 20:15:33.151091
421	1	System Administrator	transition:review	scorecard_kpi	27	{"status":"Submitted"}	{"status":"Reviewed"}	\N	2026-07-09 20:15:35.87757
422	1	System Administrator	transition:review	scorecard	2	{"status":"Submitted"}	{"status":"Reviewed"}	1	2026-07-09 20:15:36.969376
423	1	System Administrator	generate	report_run	43	\N	{"id":43,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T20:15:53.417Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T20:15:53.417Z\\"}","createdAt":"2026-07-09T20:15:53.417Z"}	1	2026-07-09 20:15:53.427068
424	1	System Administrator	transition:approve	scorecard_kpi	26	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 20:16:37.009658
425	1	System Administrator	transition:approve	scorecard_kpi	28	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 20:16:37.331466
426	1	System Administrator	transition:approve	scorecard_kpi	27	{"status":"Reviewed"}	{"status":"Approved"}	\N	2026-07-09 20:16:37.692888
427	1	System Administrator	transition:approve	scorecard	2	{"status":"Reviewed"}	{"status":"Approved"}	1	2026-07-09 20:16:38.185428
428	1	System Administrator	generate	report_run	44	\N	{"id":44,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T20:18:57.988Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T20:18:57.988Z\\"}","createdAt":"2026-07-09T20:18:57.988Z"}	1	2026-07-09 20:18:58.025461
429	1	System Administrator	update	sdbip_field_config	0	{"fields":[{"id":103,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":104,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":1,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":105,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":106,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":3,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":107,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":108,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":5,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":109,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":6,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":110,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":111,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":8,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":112,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":113,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":114,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":115,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"},{"id":116,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-09T20:48:55.914Z","updatedAt":"2026-07-09T20:48:55.914Z"}]}	{"fields":[{"id":117,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"kpiNumber","fieldLabel":"Number","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":0,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":118,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_nkpa","fieldLabel":"NKPA","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":1,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":119,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_department","fieldLabel":"Department","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":2,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":120,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"description","fieldLabel":"Indicator Description","fieldType":"textarea","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":3,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":121,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"strategicObjective","fieldLabel":"Strategic Objective","fieldType":"textarea","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":4,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":122,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"baseline","fieldLabel":"Baseline","fieldType":"text","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":5,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":123,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"annualTarget","fieldLabel":"Annual Target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":true,"sortOrder":6,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":124,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"unitOfMeasureId","fieldLabel":"Unit of Measure","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":7,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":125,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_quarter_1_target","fieldLabel":"Q1 target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":8,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":126,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q1_actual","fieldLabel":"Q1 Actual","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":9,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":127,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q1_poe","fieldLabel":"Q1 POE","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":10,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":128,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q2_target","fieldLabel":"Q2 target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":11,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":129,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q2_actual","fieldLabel":"Q2 Actual","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":12,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":130,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q2_poe","fieldLabel":"Q2 POE","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":13,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":131,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q3_target","fieldLabel":"Q3 target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":14,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":132,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q3_actual","fieldLabel":"Q3 Actual","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":15,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":133,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q3_poe","fieldLabel":"Q3 POE","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":16,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":134,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q4_target","fieldLabel":"Q4 target","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":17,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":135,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q4_actual","fieldLabel":"Q4 Actual","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":18,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":136,"sdbipType":"quarterly","fieldKind":"custom","fieldKey":"cf_q4_poe","fieldLabel":"Q4 POE","fieldType":"text","isIncluded":true,"isRequired":true,"isLocked":false,"sortOrder":19,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":137,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"responsiblePostId","fieldLabel":"Responsible Post","fieldType":"select","isIncluded":true,"isRequired":false,"isLocked":false,"sortOrder":20,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":138,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"annualBudgetTarget","fieldLabel":"Financial Baseline (R)","fieldType":"number","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":21,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":139,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"fundingSource","fieldLabel":"Funding Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":22,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":140,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"budgetDescription","fieldLabel":"Budget Description","fieldType":"textarea","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":23,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":141,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"evidenceSource","fieldLabel":"POE Source","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":24,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":142,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"idpReference","fieldLabel":"IDP Reference","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":25,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":143,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"programme","fieldLabel":"Programme","fieldType":"text","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":26,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"},{"id":144,"sdbipType":"quarterly","fieldKind":"primary","fieldKey":"custodianPostId","fieldLabel":"Custodian Post","fieldType":"select","isIncluded":false,"isRequired":false,"isLocked":false,"sortOrder":27,"createdAt":"2026-07-09T21:00:59.206Z","updatedAt":"2026-07-09T21:00:59.206Z"}]}	\N	2026-07-09 21:00:59.615584
517	1	System Administrator	actual:approve	kpi_quarter_actual	487	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 07:07:40.748668
430	1	System Administrator	update	kpi_rating_threshold	0	{"thresholds":[{"id":1,"level":5,"label":"Outstanding","descriptor":"Far exceeds expectations","minPct":151,"maxPct":null},{"id":2,"level":4,"label":"Exceeds Expectations","descriptor":"Above target","minPct":111,"maxPct":150},{"id":3,"level":3,"label":"Fully Effective","descriptor":"On target","minPct":100,"maxPct":110},{"id":4,"level":2,"label":"Partially Effective","descriptor":"Below target","minPct":50,"maxPct":99},{"id":5,"level":1,"label":"Not Effective","descriptor":"Far below target","minPct":null,"maxPct":49}]}	{"thresholds":[{"id":6,"level":5,"label":"Outstanding","descriptor":"Far exceeds expectations","minPct":151,"maxPct":null},{"id":7,"level":4,"label":"Exceeds Expectations","descriptor":"Above target","minPct":111,"maxPct":150},{"id":8,"level":3,"label":"Fully Effective","descriptor":"On target","minPct":100,"maxPct":110},{"id":9,"level":2,"label":"Partially Effective","descriptor":"Below target","minPct":50,"maxPct":99},{"id":10,"level":1,"label":"Not Effective","descriptor":"Far below target","minPct":null,"maxPct":49}]}	\N	2026-07-09 22:52:26.237535
431	1	System Administrator	create	kpi_quarter_actual	474	\N	{"id":474,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"3","commentary":null,"isAchieved":true,"assessment":"Over Achieved","scorePct":150,"ratingLevel":4,"ratingLabel":"Exceeds Expectations","qualitativeScorePct":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":"demand","budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:02:14.484Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:02:14.484Z","updatedAt":"2026-07-09T23:02:14.484Z"}	\N	2026-07-09 23:02:14.493737
432	1	System Administrator	update	kpi_quarter_actual	474	{"id":474,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"3","commentary":null,"isAchieved":true,"assessment":"Over Achieved","scorePct":150,"ratingLevel":4,"ratingLabel":"Exceeds Expectations","qualitativeScorePct":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":"demand","budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:02:14.484Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:02:14.484Z","updatedAt":"2026-07-09T23:02:14.484Z"}	{"id":474,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"1","commentary":"c","isAchieved":false,"assessment":"Partially Achieved","scorePct":50,"ratingLevel":2,"ratingLabel":"Partially Effective","qualitativeScorePct":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"ch","correctiveAction":"ca","underperformanceReason":null,"overperformanceReason":"demand","budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:02:14.484Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:02:14.484Z","updatedAt":"2026-07-09T23:02:21.905Z"}	\N	2026-07-09 23:02:21.913074
433	1	System Administrator	update	kpi_quarter_actual	474	{"id":474,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"1","commentary":"c","isAchieved":false,"assessment":"Partially Achieved","scorePct":50,"ratingLevel":2,"ratingLabel":"Partially Effective","qualitativeScorePct":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"ch","correctiveAction":"ca","underperformanceReason":null,"overperformanceReason":"demand","budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:02:14.484Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:02:14.484Z","updatedAt":"2026-07-09T23:02:21.905Z"}	{"id":474,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"c","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"ch","correctiveAction":"ca","underperformanceReason":null,"overperformanceReason":"demand","budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:02:14.484Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:02:14.484Z","updatedAt":"2026-07-09T23:02:22.067Z"}	\N	2026-07-09 23:02:22.072479
434	1	System Administrator	create	kpi_quarter_actual	475	\N	{"id":475,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"Annual Financial Statements submitted to the Auditor-General on 28 Aug 2026","commentary":"AFS submitted ahead of the statutory deadline with all supporting schedules","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":null,"correctiveAction":null,"underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:10:36.972Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:10:36.972Z","updatedAt":"2026-07-09T23:10:36.972Z"}	\N	2026-07-09 23:10:37.008394
435	1	System Administrator	create	kpi_quarter_actual	476	\N	{"id":476,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"2026-09-15","commentary":"AFS submitted two weeks late due to audit file delays","isAchieved":false,"assessment":"Not Achieved","scorePct":0,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Staff shortage in BTO","correctiveAction":"Additional capacity contracted for next cycle","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:17:00.957Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:17:00.957Z","updatedAt":"2026-07-09T23:17:00.957Z"}	\N	2026-07-09 23:17:01.070781
450	1	System Administrator	delete	kpi_evidence_document	47	{"id":47,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"poe2.txt","fileSize":15,"mimeType":"text/plain","filePath":"/objects/uploads/b06d2705-b533-4387-9873-a128b137ffa2","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:56:23.014Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	\N	2026-07-09 23:56:24.942019
518	1	System Administrator	actual:approve	kpi_quarter_actual	485	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 07:07:56.081281
436	1	System Administrator	create	kpi_quarter_actual	477	\N	{"id":477,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"2026-09-15","commentary":"AFS submitted late","isAchieved":false,"assessment":"Not Achieved","scorePct":0,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Staff shortage","correctiveAction":"Capacity contracted","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:17:59.562Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:17:59.562Z","updatedAt":"2026-07-09T23:17:59.562Z"}	\N	2026-07-09 23:17:59.567304
437	1	System Administrator	generate	report_run	45	\N	{"id":45,"cycleId":1,"reportType":"quarterly","quarter":null,"departmentId":null,"scorecardType":null,"title":"Verification run","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:17:59.717Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:17:59.717Z\\"}","createdAt":"2026-07-09T23:17:59.717Z"}	1	2026-07-09 23:17:59.721783
438	1	System Administrator	create	kpi_quarter_actual	478	\N	{"id":478,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"N/A","commentary":"N/A","isAchieved":null,"assessment":"Not Applicable","scorePct":null,"ratingLevel":null,"ratingLabel":null,"qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"N/A","correctiveAction":"N/A","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:39:43.780Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:39:43.780Z","updatedAt":"2026-07-09T23:39:43.780Z"}	\N	2026-07-09 23:39:43.961144
439	1	System Administrator	create	kpi_quarter_actual	479	\N	{"id":479,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"N/A","commentary":"N/A","isAchieved":null,"assessment":"On Hold","scorePct":null,"ratingLevel":null,"ratingLabel":null,"qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":true,"onHoldReason":"Budget hold","challengeNarrative":"N/A","correctiveAction":"N/A","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:39:44.223Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:39:44.223Z","updatedAt":"2026-07-09T23:39:44.223Z"}	\N	2026-07-09 23:39:44.22973
440	1	System Administrator	generate	report_run	46	\N	{"id":46,"cycleId":1,"reportType":"quarterly","quarter":null,"departmentId":null,"scorecardType":null,"title":"NA test","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:39:44.653Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:39:44.653Z\\"}","createdAt":"2026-07-09T23:39:44.653Z"}	1	2026-07-09 23:39:44.660278
441	1	System Administrator	generate	report_run	47	\N	{"id":47,"cycleId":1,"reportType":"sdbip","quarter":null,"departmentId":null,"scorecardType":"organisational","title":"SDBIP Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:44:18.289Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:44:18.289Z\\"}","createdAt":"2026-07-09T23:44:18.290Z"}	1	2026-07-09 23:44:18.329955
442	1	System Administrator	generate	report_run	48	\N	{"id":48,"cycleId":1,"reportType":"revised-sdbip","quarter":null,"departmentId":null,"scorecardType":"revised","title":"Revised SDBIP 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:44:32.355Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:44:32.355Z\\"}","createdAt":"2026-07-09T23:44:32.357Z"}	1	2026-07-09 23:44:32.437764
443	1	System Administrator	generate	report_run	49	\N	{"id":49,"cycleId":1,"reportType":"quarterly","quarter":1,"departmentId":null,"scorecardType":null,"title":"Quarterly Progress Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:44:47.478Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:44:47.478Z\\"}","createdAt":"2026-07-09T23:44:47.480Z"}	1	2026-07-09 23:44:47.502891
444	1	System Administrator	create	kpi_quarter_actual	480	\N	{"id":480,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"On hold","commentary":"N/A","isAchieved":null,"assessment":"On Hold","scorePct":null,"ratingLevel":null,"ratingLabel":null,"qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":true,"onHoldReason":"Budget hold","challengeNarrative":"N/A","correctiveAction":"N/A","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-09T23:44:49.989Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-09T23:44:49.989Z","updatedAt":"2026-07-09T23:44:49.989Z"}	\N	2026-07-09 23:44:49.993796
445	1	System Administrator	generate	report_run	50	\N	{"id":50,"cycleId":1,"reportType":"quarterly","quarter":null,"departmentId":null,"scorecardType":null,"title":"OH test","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:44:50.266Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:44:50.266Z\\"}","createdAt":"2026-07-09T23:44:50.266Z"}	1	2026-07-09 23:44:50.271688
446	1	System Administrator	generate	report_run	51	\N	{"id":51,"cycleId":1,"reportType":"quarterly","quarter":2,"departmentId":null,"scorecardType":null,"title":"Quarterly Progress Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-09T23:45:32.168Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-09T23:45:32.168Z\\"}","createdAt":"2026-07-09T23:45:32.168Z"}	1	2026-07-09 23:45:32.173889
447	1	System Administrator	upload	kpi_evidence_document	46	\N	{"id":46,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"poe-test.txt","fileSize":15,"mimeType":"text/plain","filePath":"/objects/uploads/d3a32cf6-05be-4cf4-873a-e14abe16439c","documentType":"Test","description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:53:41.760Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 23:53:41.919885
448	1	System Administrator	delete	kpi_evidence_document	46	{"id":46,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"poe-test.txt","fileSize":15,"mimeType":"text/plain","filePath":"/objects/uploads/d3a32cf6-05be-4cf4-873a-e14abe16439c","documentType":"Test","description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:53:41.760Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	\N	2026-07-09 23:53:43.286556
461	1	System Administrator	actual:submit	kpi_quarter_actual	482	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 00:40:17.281334
451	1	System Administrator	upload	kpi_evidence_document	48	\N	{"id":48,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"p3.txt","fileSize":2,"mimeType":"text/plain","filePath":"/objects/uploads/2fba4f66-a265-4940-87bb-23a4026f3414","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:56:50.821Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-09 23:56:50.855348
452	1	System Administrator	delete	kpi_evidence_document	48	{"id":48,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"p3.txt","fileSize":2,"mimeType":"text/plain","filePath":"/objects/uploads/2fba4f66-a265-4940-87bb-23a4026f3414","documentType":null,"description":null,"uploadedById":1,"uploadedAt":"2026-07-09T23:56:50.821Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	\N	2026-07-09 23:56:51.933658
453	1	System Administrator	create	kpi_quarter_actual	481	\N	{"id":481,"kpiId":26,"periodType":"quarterly","quarter":2,"actualValue":"1","commentary":"test","isAchieved":false,"assessment":"Partially Achieved","scorePct":50,"ratingLevel":2,"ratingLabel":"Partially Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"t","correctiveAction":"t","underperformanceReason":"t","overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:21:32.507Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:21:32.507Z","updatedAt":"2026-07-10T00:21:32.507Z"}	\N	2026-07-10 00:21:32.664969
454	1	System Administrator	actual:submit	kpi_quarter_actual	481	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 00:21:32.911441
455	1	System Administrator	upload	kpi_evidence_document	49	\N	{"id":49,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/fc31e077-9c01-438e-9483-31cb6442bc25","documentType":null,"description":"GRN and approved payment voucher","uploadedById":1,"uploadedAt":"2026-07-10T00:34:52.767Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 00:34:52.877823
456	1	System Administrator	delete	kpi_evidence_document	49	{"id":49,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/fc31e077-9c01-438e-9483-31cb6442bc25","documentType":null,"description":"GRN and approved payment voucher","uploadedById":1,"uploadedAt":"2026-07-10T00:34:52.767Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	\N	2026-07-10 00:35:09.897863
457	1	System Administrator	upload	kpi_evidence_document	50	\N	{"id":50,"kpiId":26,"periodType":"quarterly","quarter":1,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/ed3272b7-8e27-431c-9097-aaf478e7f779","documentType":null,"description":"GRN and approved payment voucher","uploadedById":1,"uploadedAt":"2026-07-10T00:35:27.384Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 00:35:27.520826
458	1	System Administrator	create	kpi_quarter_actual	482	\N	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T00:36:02.560Z"}	\N	2026-07-10 00:36:02.590209
459	1	System Administrator	update	kpi_quarter_actual	482	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T00:36:02.560Z"}	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T00:36:08.390Z"}	\N	2026-07-10 00:36:08.394818
460	1	System Administrator	update	kpi_quarter_actual	482	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T00:36:08.390Z"}	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T00:40:16.947Z"}	\N	2026-07-10 00:40:16.955662
462	1	System Administrator	upload	kpi_evidence_document	51	\N	{"id":51,"kpiId":28,"periodType":"quarterly","quarter":1,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/b5c4577f-8da0-4bff-a22b-366d25189d85","documentType":null,"description":"Internal Audit Progress Report","uploadedById":1,"uploadedAt":"2026-07-10T01:13:50.815Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 01:13:51.001838
463	1	System Administrator	create	kpi_quarter_actual	483	\N	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T01:13:50.933Z"}	\N	2026-07-10 01:13:51.004129
464	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T01:13:50.933Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T01:14:00.908Z"}	\N	2026-07-10 01:14:00.914206
465	1	System Administrator	actual:submit	kpi_quarter_actual	483	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 01:14:01.231886
466	1	System Administrator	create	kpi_quarter_actual	484	\N	{"id":484,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"AFS were submitted on 31 August 2026","commentary":"Annual financial statements were submitted on time.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:19:47.423Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T01:19:47.423Z","updatedAt":"2026-07-10T01:19:47.423Z"}	\N	2026-07-10 01:19:47.505214
467	1	System Administrator	upload	kpi_evidence_document	52	\N	{"id":52,"kpiId":27,"periodType":"quarterly","quarter":1,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/3e8aa1a7-3525-41a8-835a-85dfe72934b9","documentType":null,"description":"AFS and Acknowledgement of receipt ","uploadedById":1,"uploadedAt":"2026-07-10T01:19:47.628Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 01:19:47.632332
468	1	System Administrator	actual:submit	kpi_quarter_actual	484	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 01:19:47.875042
469	1	System Administrator	actual:return	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-10 03:11:22.751467
470	1	System Administrator	actual:submit	kpi_quarter_actual	482	{"status":"Returned","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:14:40.693675
471	1	System Administrator	actual:return	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-10 03:14:40.855777
472	1	System Administrator	actual:submit	kpi_quarter_actual	482	{"status":"Returned","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:16:24.061434
473	1	System Administrator	actual:return	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-10 03:16:24.189773
513	1	System Administrator	actual:approve	kpi_quarter_actual	487	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 07:01:11.862026
519	1	System Administrator	actual:approve	kpi_quarter_actual	486	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 07:08:01.218306
520	1	System Administrator	actual:approve	kpi_quarter_actual	487	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 07:08:03.554897
474	1	System Administrator	update	kpi_quarter_actual	482	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Please attach the delivery note as evidence.","reviewedById":1,"reviewedAt":"2026-07-10T03:16:24.177Z","createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T03:16:24.177Z"}	{"id":482,"kpiId":26,"periodType":"quarterly","quarter":1,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T00:36:02.560Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Please attach the delivery note as evidence.","reviewedById":1,"reviewedAt":"2026-07-10T03:16:24.177Z","createdAt":"2026-07-10T00:36:02.560Z","updatedAt":"2026-07-10T03:21:34.349Z"}	\N	2026-07-10 03:21:34.425217
475	1	System Administrator	actual:submit	kpi_quarter_actual	482	{"status":"Returned","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:21:34.836437
476	1	System Administrator	actual:return	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"Returned","reviewLevel":"line_manager"}	\N	2026-07-10 03:22:08.341216
477	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Check actual assessment","reviewedById":1,"reviewedAt":"2026-07-10T03:22:08.193Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:22:08.193Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"line_manager","reviewStatus":"Returned","reviewComments":"Check actual assessment","reviewedById":1,"reviewedAt":"2026-07-10T03:22:08.193Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:22:25.368Z"}	\N	2026-07-10 03:22:25.374537
478	1	System Administrator	actual:submit	kpi_quarter_actual	483	{"status":"Returned","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:22:25.726456
479	1	System Administrator	actual:approve	kpi_quarter_actual	484	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:22:54.955478
480	1	System Administrator	generate	report_run	52	\N	{"id":52,"cycleId":1,"reportType":"quarterly","quarter":1,"departmentId":null,"scorecardType":null,"title":"Quarterly Progress Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-10T03:27:03.787Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-10T03:27:03.787Z\\"}","createdAt":"2026-07-10T03:27:03.787Z"}	1	2026-07-10 03:27:04.03451
481	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:31:31.566743
482	1	System Administrator	actual:approve	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:31:34.072766
483	1	System Administrator	actual:return	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"Returned","reviewLevel":"pms_manager"}	\N	2026-07-10 03:32:53.259823
484	1	System Administrator	actual:return	kpi_quarter_actual	484	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"Returned","reviewLevel":"pms_manager"}	\N	2026-07-10 03:39:05.519152
485	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"pms_manager","reviewStatus":"Returned","reviewComments":"Fix actual","reviewedById":1,"reviewedAt":"2026-07-10T03:32:52.910Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:32:52.910Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"pms_manager","reviewStatus":"Returned","reviewComments":"Fix actual","reviewedById":1,"reviewedAt":"2026-07-10T03:32:52.910Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:50:42.824Z"}	\N	2026-07-10 03:50:42.861007
486	1	System Administrator	actual:submit	kpi_quarter_actual	483	{"status":"Returned","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:50:43.566056
487	1	System Administrator	update	kpi_quarter_actual	484	{"id":484,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"AFS were submitted on 31 August 2026","commentary":"Annual financial statements were submitted on time.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:19:47.423Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"pms_manager","reviewStatus":"Returned","reviewComments":"Check actual","reviewedById":1,"reviewedAt":"2026-07-10T03:39:05.505Z","createdAt":"2026-07-10T01:19:47.423Z","updatedAt":"2026-07-10T03:39:05.505Z"}	{"id":484,"kpiId":27,"periodType":"quarterly","quarter":1,"actualValue":"AFS were submitted on 31 August 2026","commentary":"Annual financial statements were submitted on time.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:19:47.423Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"pms_manager","reviewStatus":"Returned","reviewComments":"Check actual","reviewedById":1,"reviewedAt":"2026-07-10T03:39:05.505Z","createdAt":"2026-07-10T01:19:47.423Z","updatedAt":"2026-07-10T03:50:52.132Z"}	\N	2026-07-10 03:50:52.136967
488	1	System Administrator	actual:submit	kpi_quarter_actual	484	{"status":"Returned","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:50:52.454022
489	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:51:14.952881
490	1	System Administrator	actual:approve	kpi_quarter_actual	484	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:51:17.32868
491	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 03:51:31.135118
492	1	System Administrator	actual:approve	kpi_quarter_actual	484	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 03:51:32.934667
493	1	System Administrator	actual:approve	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 03:51:34.80491
494	1	System Administrator	actual:return	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Returned","reviewLevel":"internal_audit"}	\N	2026-07-10 03:52:35.591539
495	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:52:35.552Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:53:24.127Z"}	\N	2026-07-10 03:53:24.132475
496	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:53:24.127Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:53:26.819Z"}	\N	2026-07-10 03:53:26.823609
514	1	System Administrator	actual:approve	kpi_quarter_actual	487	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 07:02:33.680409
521	1	System Administrator	actual:approve	kpi_quarter_actual	485	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 07:08:11.800434
522	1	System Administrator	actual:approve	kpi_quarter_actual	486	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 07:08:13.781506
523	1	System Administrator	actual:approve	kpi_quarter_actual	487	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 07:08:15.239838
497	1	System Administrator	update	kpi_quarter_actual	483	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:53:26.819Z"}	{"id":483,"kpiId":28,"periodType":"quarterly","quarter":1,"actualValue":"10","commentary":"10% progress on implementation of the Internal Audit plan.","isAchieved":false,"assessment":"Not Achieved","scorePct":40,"ratingLevel":1,"ratingLabel":"Not Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"Delays in completing planned audits due to staff shortages.","correctiveAction":"Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T01:13:50.933Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Returned","reviewLevel":"internal_audit","reviewStatus":"Returned","reviewComments":"Check rating","reviewedById":1,"reviewedAt":"2026-07-10T03:52:35.552Z","createdAt":"2026-07-10T01:13:50.933Z","updatedAt":"2026-07-10T03:53:35.782Z"}	\N	2026-07-10 03:53:35.788248
498	1	System Administrator	actual:submit	kpi_quarter_actual	483	{"status":"Returned","reviewLevel":"internal_audit"}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 03:53:36.193711
499	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"line_manager"}	{"status":"In Review","reviewLevel":"pms_manager"}	\N	2026-07-10 03:54:06.021472
500	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"pms_manager"}	{"status":"In Review","reviewLevel":"internal_audit"}	\N	2026-07-10 03:54:13.713649
501	1	System Administrator	actual:approve	kpi_quarter_actual	483	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 03:54:32.332219
502	1	System Administrator	actual:approve	kpi_quarter_actual	484	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 03:54:34.257141
503	1	System Administrator	actual:approve	kpi_quarter_actual	482	{"status":"In Review","reviewLevel":"internal_audit"}	{"status":"Approved","reviewLevel":"internal_audit"}	\N	2026-07-10 03:54:36.460599
504	1	System Administrator	generate	report_run	53	\N	{"id":53,"cycleId":1,"reportType":"quarterly","quarter":1,"departmentId":null,"scorecardType":null,"title":"Quarterly Progress Report 2025/2026","status":"Generated","generatedById":1,"generatedAt":"2026-07-10T04:04:29.628Z","filePath":null,"fileFormat":"json","metadata":"{\\"generatedAt\\":\\"2026-07-10T04:04:29.628Z\\"}","createdAt":"2026-07-10T04:04:29.629Z"}	1	2026-07-10 04:04:29.635139
505	1	System Administrator	create	kpi_quarter_actual	485	\N	{"id":485,"kpiId":26,"periodType":"quarterly","quarter":2,"actualValue":"2","commentary":"2 mobile tuckshops were purchased.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T06:38:31.389Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T06:38:31.389Z","updatedAt":"2026-07-10T06:38:31.389Z"}	\N	2026-07-10 06:38:31.577371
506	1	System Administrator	actual:submit	kpi_quarter_actual	485	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 06:38:31.97101
507	1	System Administrator	upload	kpi_evidence_document	53	\N	{"id":53,"kpiId":26,"periodType":"quarterly","quarter":2,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/ee609e3b-ae85-4815-a637-5eafd90ce48b","documentType":null,"description":"GRN and approved payment voucher","uploadedById":1,"uploadedAt":"2026-07-10T06:38:33.150Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 06:38:33.156216
508	1	System Administrator	create	kpi_quarter_actual	486	\N	{"id":486,"kpiId":28,"periodType":"quarterly","quarter":2,"actualValue":"50%","commentary":"Planned audit engagements were completed during the reporting period.","isAchieved":true,"assessment":"Achieved","scorePct":100,"ratingLevel":3,"ratingLabel":"Fully Effective","qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"None","correctiveAction":"None","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T06:41:24.433Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T06:41:24.433Z","updatedAt":"2026-07-10T06:41:24.433Z"}	\N	2026-07-10 06:41:24.468178
509	1	System Administrator	actual:submit	kpi_quarter_actual	486	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 06:41:24.842434
510	1	System Administrator	upload	kpi_evidence_document	54	\N	{"id":54,"kpiId":28,"periodType":"quarterly","quarter":2,"fileName":"POE.pdf","fileSize":25686,"mimeType":"application/pdf","filePath":"/objects/uploads/e925808c-636a-4960-a3b5-fbd3664b2fde","documentType":null,"description":"Internal Audit Progress Report","uploadedById":1,"uploadedAt":"2026-07-10T06:41:25.104Z","verificationStatus":"Pending","verifiedById":null,"verifiedAt":null,"rejectionReason":null}	\N	2026-07-10 06:41:25.108309
511	1	System Administrator	create	kpi_quarter_actual	487	\N	{"id":487,"kpiId":27,"periodType":"quarterly","quarter":2,"actualValue":"N/A","commentary":"N/A","isAchieved":null,"assessment":"Not Applicable","scorePct":null,"ratingLevel":null,"ratingLabel":null,"qualitativeScorePct":null,"aiRationale":null,"progressStatusId":null,"isOnHold":false,"onHoldReason":null,"challengeNarrative":"N/A","correctiveAction":"N/A","underperformanceReason":null,"overperformanceReason":null,"budgetImplication":null,"analysisNotes":null,"submittedById":1,"submittedAt":"2026-07-10T06:41:46.520Z","isLateSubmission":false,"lateOverrideReason":null,"status":"Draft","reviewLevel":null,"reviewStatus":null,"reviewComments":null,"reviewedById":null,"reviewedAt":null,"createdAt":"2026-07-10T06:41:46.520Z","updatedAt":"2026-07-10T06:41:46.520Z"}	\N	2026-07-10 06:41:46.52732
512	1	System Administrator	actual:submit	kpi_quarter_actual	487	{"status":"Draft","reviewLevel":null}	{"status":"In Review","reviewLevel":"line_manager"}	\N	2026-07-10 06:41:46.891387
\.


--
-- Data for Name: competency_requirements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_requirements (id, name, description, weight, cycle_id, is_active, sort_order) FROM stdin;
1	Strategic Capability & Leadership		25	1	t	1
2	Financial Management		20	1	t	2
3	Programme & Project Management		20	1	t	3
4	People Management & Empowerment		20	1	t	4
5	Problem Solving & Analysis		15	1	t	5
\.


--
-- Data for Name: competency_template_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_template_items (id, template_id, competency_name, description, weighting, sort_order) FROM stdin;
1	1	Strategic Capability & Leadership		25	0
2	1	Financial Management		20	0
3	1	Programme & Project Management		20	0
4	1	People Management & Empowerment		20	0
5	1	Problem Solving & Analysis		15	0
\.


--
-- Data for Name: competency_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_templates (id, name, description, post_level, is_active, created_at, updated_at) FROM stdin;
1	Strategic Capability & Leadership	\N	Directors	t	2026-04-10 04:02:11.802955	2026-04-10 04:02:11.802955
\.


--
-- Data for Name: constraint_register; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.constraint_register (id, kpi_id, department_id, category, description, impact, mitigation_action, status, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, cycle_id, created_at, updated_at) FROM stdin;
12	Community Services	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
13	Corporate Services	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
14	Infrastructural Planning & Development	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
15	Local Economic Development	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
16	Office Of The Executive Mayor	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
17	Office of the Municipal Manager	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
18	Office of the Speaker	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
19	Strategic Management	1	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
11	Budget & Treasury	1	2026-07-08 16:13:43.45448	2026-07-08 16:22:43.467
\.


--
-- Data for Name: dept_scorecard_kpis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dept_scorecard_kpis (id, dept_scorecard_id, parent_kpi_id, kpi_number, description, strategic_objective, nkpa_link, responsible_post_id, baseline, annual_target, annual_budget_target, weighting, unit_of_measure_id, is_cumulative, is_inherited, sort_order, created_at, updated_at, custom_fields) FROM stdin;
\.


--
-- Data for Name: dept_scorecards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dept_scorecards (id, name, cycle_id, department_id, department_name, parent_scorecard_id, owner_id, status, approved_by_id, approved_at, approval_comments, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: divisions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.divisions (id, department_id, name, created_at, updated_at) FROM stdin;
71	11	Information Technology	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
72	11	Logistics Assets and Fleet Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
73	11	Office of the CFO	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
74	11	Office of the Portflio Head	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
75	11	Office of the Senior Accountant	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
76	11	Revenue and Debt Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
77	11	Supply Chain Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
78	12	Human Resources & Employee Relations	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
79	12	Licencing	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
80	12	Office of the Director-community	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
81	12	Office of the Portflio Head	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
82	12	Public Ammenities	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
83	12	Satellite Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
84	12	Security Services	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
85	12	Solid Waste & Environmental Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
86	12	Solid waste and Public Amenities	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
87	12	Traffic and Law enforcement	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
88	13	Administration	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
89	13	Council Support	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
90	13	Employee Relations	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
91	13	Employee Wellness	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
92	13	Human resources and Employee Relations	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
93	13	Information and Communication Technology	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
94	13	Office of the Director- Corporate Services	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
95	13	Satellite Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
96	13	Skills Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
97	13	The Public Participation Division	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
98	14	Building and Housing	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
99	14	Civil Services	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
100	14	Engineering	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
101	14	Mechanical workshop	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
102	14	Office of the Director-Infrastructure	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
103	14	Project Management Unit	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
104	14	Public Works Roads	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
105	15	Investment promotions	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
106	15	Land Use Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
107	15	Office of the Director-LED	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
108	15	Programme Manangement Office	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
109	15	Research and Policy Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
110	15	Small Enterprise Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
111	15	SMME & Cooperate services	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
112	15	Sustainable Rural Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
113	15	Tourism Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
114	16	Office of the Mayor	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
115	17	Internal Audit	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
116	17	Legal Services	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
117	17	Office of the MM	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
118	17	Risk Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
119	18	Office of the speaker	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
120	19	Communication	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
121	19	Events Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
122	19	IDP & PMS	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
123	19	Media Liason	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
124	19	Municipal Relations	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
125	19	Office of the Director- Strategic Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
126	19	Office Of The Executive Mayor	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
127	19	Office of the MPAC	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
128	19	Office of the Speaker	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
129	19	Research and Policy Development	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
130	19	Risk Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
131	19	Special Programmes Unit	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
132	19	Strategic Management	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
133	19	The Public Participation	2026-07-08 16:13:43.45448	2026-07-08 16:13:43.45448
69	11	Budget Planning and Financial Reporting	2026-07-08 16:13:43.45448	2026-07-08 16:22:43.567
135	11	Expenditure and Payroll	2026-07-08 16:27:36.855691	2026-07-08 16:27:36.855691
\.


--
-- Data for Name: employee_competency_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_competency_scores (id, agreement_id, competency_item_id, competency_name, weighting, self_score, reviewer_score, moderated_score, development_need, scored_by_id, scored_at, created_at) FROM stdin;
\.


--
-- Data for Name: employee_kpas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_kpas (id, agreement_id, title, description, weighting, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: employee_kpis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_kpis (id, kpa_id, agreement_id, dept_kpi_id, kpi_number, description, unit_of_measure, baseline, annual_target, weighting, q1_target, q2_target, q3_target, q4_target, q1_actual, q2_actual, q3_actual, q4_actual, q1_score, q2_score, q3_score, q4_score, annual_score, created_at) FROM stdin;
\.


--
-- Data for Name: individual_assessment_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.individual_assessment_records (id, agreement_id, assessment_type, quarter, reviewer_id, kpi_score, competency_score, overall_score, comments, development_needs, performance_gaps, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: individual_performance_agreements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.individual_performance_agreements (id, cycle_id, employee_id, employee_name, post_title, department_id, department_name, dept_scorecard_id, primary_reviewer_id, secondary_reviewer_id, status, kpi_weight_pct, competency_weight_pct, final_score, approved_by_id, approved_at, approval_comments, locked_at, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: integration_sync_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integration_sync_log (id, integration_type, direction, entity_type, entity_id, status, record_count, error_message, synced_by_id, synced_at) FROM stdin;
\.


--
-- Data for Name: kpi_data_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_data_types (id, name, code, is_active) FROM stdin;
1	Numeric	numeric	t
2	Percentage	percentage	t
3	Currency	currency	t
4	Date	date	t
5	Text	text	t
6	Boolean	boolean	t
\.


--
-- Data for Name: kpi_evidence_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_evidence_documents (id, kpi_id, quarter, file_name, file_size, mime_type, file_path, document_type, description, uploaded_by_id, uploaded_at, verification_status, verified_by_id, verified_at, rejection_reason, period_type) FROM stdin;
50	26	1	POE.pdf	25686	application/pdf	/objects/uploads/ed3272b7-8e27-431c-9097-aaf478e7f779	\N	GRN and approved payment voucher	1	2026-07-10 00:35:27.384281	Pending	\N	\N	\N	quarterly
51	28	1	POE.pdf	25686	application/pdf	/objects/uploads/b5c4577f-8da0-4bff-a22b-366d25189d85	\N	Internal Audit Progress Report	1	2026-07-10 01:13:50.815464	Pending	\N	\N	\N	quarterly
52	27	1	POE.pdf	25686	application/pdf	/objects/uploads/3e8aa1a7-3525-41a8-835a-85dfe72934b9	\N	AFS and Acknowledgement of receipt 	1	2026-07-10 01:19:47.628772	Pending	\N	\N	\N	quarterly
53	26	2	POE.pdf	25686	application/pdf	/objects/uploads/ee609e3b-ae85-4815-a637-5eafd90ce48b	\N	GRN and approved payment voucher	1	2026-07-10 06:38:33.15083	Pending	\N	\N	\N	quarterly
54	28	2	POE.pdf	25686	application/pdf	/objects/uploads/e925808c-636a-4960-a3b5-fbd3664b2fde	\N	Internal Audit Progress Report	1	2026-07-10 06:41:25.104606	Pending	\N	\N	\N	quarterly
\.


--
-- Data for Name: kpi_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_groups (id, name, code, parent_id, cycle_id, is_active, sort_order) FROM stdin;
1	Basic Service Delivery	NKPA1	\N	1	t	0
2	Local Economic Development	NKPA2	\N	1	t	1
3	Municipal Institutional Development & Transformation	NKPA3	\N	1	t	2
4	Municipal Financial Viability & Management	NKPA4	\N	1	t	3
5	Good Governance & Public Participation	NKPA5	\N	1	t	4
\.


--
-- Data for Name: kpi_moderation_outcomes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_moderation_outcomes (id, actual_id, kpi_id, quarter, moderator_user_id, outcome, score_adjustment_reason, adjusted_score, notes, created_at) FROM stdin;
\.


--
-- Data for Name: kpi_month_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_month_activities (id, kpi_id, quarter, month, description, due_date, owner_id, status, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kpi_quarter_actuals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_quarter_actuals (id, kpi_id, quarter, actual_value, commentary, is_achieved, progress_status_id, is_on_hold, on_hold_reason, challenge_narrative, corrective_action, underperformance_reason, overperformance_reason, budget_implication, analysis_notes, submitted_by_id, submitted_at, is_late_submission, late_override_reason, status, created_at, updated_at, review_level, review_status, review_comments, reviewed_by_id, reviewed_at, period_type, assessment, score_pct, rating_level, rating_label, qualitative_score_pct, ai_rationale) FROM stdin;
483	28	1	10	10% progress on implementation of the Internal Audit plan.	f	\N	f	\N	Delays in completing planned audits due to staff shortages.	Prioritize high-risk audits, revise the audit schedule where necessary, optimize allocation of available resources	\N	\N	\N	\N	1	2026-07-10 01:13:50.933995	f	\N	Approved	2026-07-10 01:13:50.933995	2026-07-10 03:54:32.327	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 03:54:32.328	quarterly	Not Achieved	40	1	Not Effective	\N	\N
484	27	1	AFS were submitted on 31 August 2026	Annual financial statements were submitted on time.	t	\N	f	\N	None	None	\N	\N	\N	\N	1	2026-07-10 01:19:47.423015	f	\N	Approved	2026-07-10 01:19:47.423015	2026-07-10 03:54:34.252	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 03:54:34.252	quarterly	Achieved	100	3	Fully Effective	\N	\N
482	26	1	2	2 mobile tuckshops were purchased.	t	\N	f	\N	None	None	\N	\N	\N	\N	1	2026-07-10 00:36:02.560748	f	\N	Approved	2026-07-10 00:36:02.560748	2026-07-10 03:54:36.455	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 03:54:36.455	quarterly	Achieved	100	3	Fully Effective	\N	\N
485	26	2	2	2 mobile tuckshops were purchased.	t	\N	f	\N	None	None	\N	\N	\N	\N	1	2026-07-10 06:38:31.389952	f	\N	Approved	2026-07-10 06:38:31.389952	2026-07-10 07:08:11.794	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 07:08:11.795	quarterly	Achieved	100	3	Fully Effective	\N	\N
486	28	2	50%	Planned audit engagements were completed during the reporting period.	t	\N	f	\N	None	None	\N	\N	\N	\N	1	2026-07-10 06:41:24.433282	f	\N	Approved	2026-07-10 06:41:24.433282	2026-07-10 07:08:13.775	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 07:08:13.776	quarterly	Achieved	100	3	Fully Effective	\N	\N
487	27	2	N/A	N/A	\N	\N	f	\N	N/A	N/A	\N	\N	\N	\N	1	2026-07-10 06:41:46.520897	f	\N	Approved	2026-07-10 06:41:46.520897	2026-07-10 07:08:15.232	internal_audit	Approved	Approved at Internal Audit level	1	2026-07-10 07:08:15.232	quarterly	Not Applicable	\N	\N	\N	\N	\N
\.


--
-- Data for Name: kpi_quarter_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_quarter_targets (id, kpi_id, quarter, target_value, budget_value, evidence_expected, is_approved_baseline, baseline_target_value, baseline_budget_value, revision_reason, revised_at, revised_by_id, created_at, updated_at, target_status) FROM stdin;
90	26	3	2	\N	GRN and approved payment voucher	t	2	\N	\N	\N	\N	2026-07-08 20:20:36.061241	2026-07-09 20:12:48.319	active
91	26	4	2	\N	GRN and approved payment voucher	t	2	\N	\N	\N	\N	2026-07-08 20:20:36.063911	2026-07-09 20:12:48.323	active
88	26	1	2	\N	GRN and approved payment voucher	t	2	\N	\N	\N	\N	2026-07-08 20:20:36.054242	2026-07-09 20:12:48.311	active
89	26	2	2	\N	GRN and approved payment voucher	t	2	\N	\N	\N	\N	2026-07-08 20:20:36.058587	2026-07-09 20:12:48.316	active
96	28	1	25%	\N	Internal Audit Progress Report	t	25%	\N	\N	\N	\N	2026-07-08 21:39:20.343912	2026-07-09 16:25:33.757	active
97	28	2	50%	\N	Internal Audit Progress Report	t	50%	\N	\N	\N	\N	2026-07-08 21:39:20.347174	2026-07-09 16:25:33.76	active
98	28	3	75%	\N	Internal Audit Progress Report	t	75%	\N	\N	\N	\N	2026-07-08 21:39:20.357436	2026-07-09 16:25:33.763	active
99	28	4	100%	\N	Internal Audit Progress Report	t	100%	\N	\N	\N	\N	2026-07-08 21:39:20.500792	2026-07-09 16:25:33.769	active
92	27	1	AFS Submitted by 31 Aug 2026	\N	Annual financial statement and acknowledgement of receit by AGSA	t	AFS Submitted by 31 Aug 2026	\N	\N	\N	\N	2026-07-08 21:32:55.301063	2026-07-09 16:26:19.632	active
93	27	2	N/A	\N	N/A	t	N/A	\N	\N	\N	\N	2026-07-08 21:32:55.304563	2026-07-09 16:26:19.636	active
94	27	3	N/A	\N	N/A	t	N/A	\N	\N	\N	\N	2026-07-08 21:32:55.307615	2026-07-09 16:26:19.646	active
95	27	4	N/A	\N	N/A	t	N/A	\N	\N	\N	\N	2026-07-08 21:32:55.310545	2026-07-09 16:26:19.649	active
\.


--
-- Data for Name: kpi_rating_thresholds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_rating_thresholds (id, level, label, descriptor, min_pct, max_pct) FROM stdin;
6	5	Outstanding	Far exceeds expectations	151	\N
7	4	Exceeds Expectations	Above target	111	150
8	3	Fully Effective	On target	100	110
9	2	Partially Effective	Below target	50	99
10	1	Not Effective	Far below target	\N	49
\.


--
-- Data for Name: kpi_review_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_review_submissions (id, actual_id, kpi_id, quarter, reviewer_user_id, action, comments, return_reason, assessment_rating, created_at) FROM stdin;
7	482	26	1	1	return	Update actual	Update actual	\N	2026-07-10 03:11:22.821447
8	482	26	1	1	return	Test: please verify supporting evidence before resubmitting.	Test: please verify supporting evidence before resubmitting.	\N	2026-07-10 03:14:40.859902
9	482	26	1	1	return	Please attach the delivery note as evidence.	Please attach the delivery note as evidence.	\N	2026-07-10 03:16:24.192674
10	483	28	1	1	return	Check actual assessment	Check actual assessment	\N	2026-07-10 03:22:08.354408
11	484	27	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:22:54.958399
12	483	28	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:31:31.637408
13	482	26	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:31:34.096842
14	483	28	1	1	return	Fix actual	Fix actual	\N	2026-07-10 03:32:53.269729
15	484	27	1	1	return	Check actual	Check actual	\N	2026-07-10 03:39:05.63189
16	483	28	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:51:14.956043
17	484	27	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:51:17.331505
18	483	28	1	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 03:51:31.137992
19	484	27	1	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 03:51:32.937643
20	482	26	1	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 03:51:34.807785
21	483	28	1	1	return	Check rating	Check rating	\N	2026-07-10 03:52:35.596919
22	483	28	1	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 03:54:06.024503
23	483	28	1	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 03:54:13.716717
24	483	28	1	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 03:54:32.335034
25	484	27	1	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 03:54:34.259855
26	482	26	1	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 03:54:36.463158
29	485	26	2	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 07:07:36.322137
30	486	28	2	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 07:07:39.118716
31	487	27	2	1	approve	Approved at Manager Review level	\N	\N	2026-07-10 07:07:40.868492
32	485	26	2	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 07:07:56.086444
33	486	28	2	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 07:08:01.221318
34	487	27	2	1	approve	Approved at PMS Review level	\N	\N	2026-07-10 07:08:03.557981
35	485	26	2	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 07:08:11.803579
36	486	28	2	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 07:08:13.786537
37	487	27	2	1	approve	Approved at Internal Audit level	\N	\N	2026-07-10 07:08:15.242407
\.


--
-- Data for Name: kpi_variances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kpi_variances (id, kpi_id, quarter, variance_percentage, variance_reason, is_underperformance, budget_impact, created_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: moderation_records_individual; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.moderation_records_individual (id, assessment_id, agreement_id, moderator_id, outcome, original_score, adjusted_score, adjustment_reason, notes, created_at) FROM stdin;
\.


--
-- Data for Name: national_kpas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.national_kpas (id, name, code, description, is_active, sort_order) FROM stdin;
4	Municipal Institutional Development & Transformation	NKPA3	Building institutional capacity, skills development and organisational transformation.	t	2
5	Municipal Financial Viability & Management	NKPA4	Sound financial management, budgeting and viability of the municipality.	t	3
6	Good Governance & Public Participation	NKPA5	Transparent governance, accountability and community participation.	t	4
3	Local Economic Development	NKPA2	Initiatives that stimulate and support local economic growth and job creation.	t	1
7	Basic service delivery and infrastructure development	NKPA1		t	0
\.


--
-- Data for Name: nkpa_weightings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nkpa_weightings (id, nkpa_name, weight, scope, cycle_id, department_id) FROM stdin;
1	Basic Service Delivery	30	organisational	1	\N
2	Local Economic Development	15	organisational	1	\N
3	Municipal Institutional Development & Transformation	20	organisational	1	\N
4	Municipal Financial Viability & Management	25	organisational	1	\N
5	Good Governance & Public Participation	10	organisational	1	\N
\.


--
-- Data for Name: notification_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_configs (id, cycle_id, event_type, days_before, is_email, is_in_app, is_active) FROM stdin;
1	1	deadline_approaching	7	f	t	t
2	1	review_required	7	t	t	t
3	1	approval_pending	7	t	t	t
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at, link, dedupe_key) FROM stdin;
7	41	Actual returned for correction	KPI 1 (Q1) actual was returned by the reviewer: Test: please verify supporting evidence before resubmitting.	warning	f	2026-07-10 03:14:40.865906	/?tab=actuals	actual:482:return:1783653280865
8	1	Actual returned for correction	KPI 1 (Q1) actual was returned by the reviewer: Please attach the delivery note as evidence.	warning	f	2026-07-10 03:16:24.197224	/?tab=actuals	actual:482:return:1783653384196
9	41	Actual returned for correction	KPI 1 (Q1) actual was returned by the reviewer: Please attach the delivery note as evidence.	warning	f	2026-07-10 03:16:24.197224	/?tab=actuals	actual:482:return:1783653384196
10	1	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Check actual assessment	warning	f	2026-07-10 03:22:08.366683	/?tab=actuals	actual:483:return:1783653728366
11	32	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Check actual assessment	warning	f	2026-07-10 03:22:08.366683	/?tab=actuals	actual:483:return:1783653728366
12	1	Submission progressed	KPI 3 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:22:55.034782	/?tab=actuals	actual:484:approve:1783653775032
13	1	Submission progressed	KPI 2 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:31:31.646147	/?tab=actuals	actual:483:approve:1783654291643
14	1	Submission progressed	KPI 1 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:31:34.244422	/?tab=actuals	actual:482:approve:1783654294239
15	1	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Fix actual	warning	f	2026-07-10 03:32:53.280939	/?tab=actuals	actual:483:return:1783654373280
16	32	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Fix actual	warning	f	2026-07-10 03:32:53.280939	/?tab=actuals	actual:483:return:1783654373280
17	1	Actual returned for correction	KPI 3 (Q1) actual was returned by the reviewer: Check actual	warning	f	2026-07-10 03:39:05.637135	/?tab=actuals	actual:484:return:1783654745636
18	37	Actual returned for correction	KPI 3 (Q1) actual was returned by the reviewer: Check actual	warning	f	2026-07-10 03:39:05.637135	/?tab=actuals	actual:484:return:1783654745636
19	1	Submission progressed	KPI 2 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:51:14.964585	/?tab=actuals	actual:483:approve:1783655474961
20	1	Submission progressed	KPI 3 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:51:17.335963	/?tab=actuals	actual:484:approve:1783655477334
21	1	Submission progressed	KPI 2 (Q1) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 03:51:31.144413	/?tab=actuals	actual:483:approve:1783655491142
22	1	Submission progressed	KPI 3 (Q1) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 03:51:32.942813	/?tab=actuals	actual:484:approve:1783655492941
23	1	Submission progressed	KPI 1 (Q1) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 03:51:34.813571	/?tab=actuals	actual:482:approve:1783655494811
24	1	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Check rating	warning	f	2026-07-10 03:52:35.611018	/?tab=actuals	actual:483:return:1783655555610
25	32	Actual returned for correction	KPI 2 (Q1) actual was returned by the reviewer: Check rating	warning	f	2026-07-10 03:52:35.611018	/?tab=actuals	actual:483:return:1783655555610
26	1	Submission progressed	KPI 2 (Q1) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 03:54:06.135141	/?tab=actuals	actual:483:approve:1783655646133
27	1	Submission progressed	KPI 2 (Q1) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 03:54:13.722123	/?tab=actuals	actual:483:approve:1783655653720
28	1	Actual fully approved	KPI 2 (Q1) actual has completed all review stages and is approved.	success	f	2026-07-10 03:54:32.338746	/?tab=actuals	actual:483:approve:1783655672338
29	1	Actual fully approved	KPI 3 (Q1) actual has completed all review stages and is approved.	success	f	2026-07-10 03:54:34.264011	/?tab=actuals	actual:484:approve:1783655674263
30	1	Actual fully approved	KPI 1 (Q1) actual has completed all review stages and is approved.	success	f	2026-07-10 03:54:36.467411	/?tab=actuals	actual:482:approve:1783655676467
33	1	Submission progressed	KPI 1 (Q2) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 07:07:36.330313	/?tab=actuals	actual:485:approve:1783667256326
34	1	Submission progressed	KPI 2 (Q2) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 07:07:39.124159	/?tab=actuals	actual:486:approve:1783667259122
35	1	Submission progressed	KPI 3 (Q2) actual passed line_manager and moved to the next review stage.	success	f	2026-07-10 07:07:40.87449	/?tab=actuals	actual:487:approve:1783667260872
36	1	Submission progressed	KPI 1 (Q2) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 07:07:56.092156	/?tab=actuals	actual:485:approve:1783667276089
37	1	Submission progressed	KPI 2 (Q2) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 07:08:01.22683	/?tab=actuals	actual:486:approve:1783667281224
38	1	Submission progressed	KPI 3 (Q2) actual passed pms_manager and moved to the next review stage.	success	f	2026-07-10 07:08:03.565196	/?tab=actuals	actual:487:approve:1783667283562
39	1	Actual fully approved	KPI 1 (Q2) actual has completed all review stages and is approved.	success	f	2026-07-10 07:08:11.80889	/?tab=actuals	actual:485:approve:1783667291806
40	1	Actual fully approved	KPI 2 (Q2) actual has completed all review stages and is approved.	success	f	2026-07-10 07:08:13.791956	/?tab=actuals	actual:486:approve:1783667293791
41	1	Actual fully approved	KPI 3 (Q2) actual has completed all review stages and is approved.	success	f	2026-07-10 07:08:15.246129	/?tab=actuals	actual:487:approve:1783667295245
\.


--
-- Data for Name: performance_cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.performance_cycles (id, financial_year_label, start_date, end_date, status, created_at, updated_at) FROM stdin;
1	2025/2026	2025-07-01	2026-06-30	Open	2026-04-09 18:05:07.994715	2026-04-09 18:05:07.994715
\.


--
-- Data for Name: period_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.period_locks (id, cycle_id, quarter, period_type, is_locked, locked_by_id, locked_at, lock_comments, reopened_by_id, reopened_at, reopen_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: progress_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.progress_statuses (id, name, code, color, cycle_id, is_active, sort_order) FROM stdin;
1	On track	On_track	#3b82f6	1	t	1
2	Achieved	AC	#7df73b	1	t	2
3	Not achieved	NA	#f73b3b	1	t	3
4	On hold	H	#f7d83b	1	t	4
\.


--
-- Data for Name: remedial_action_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remedial_action_plans (id, kpi_id, quarter, action_description, action_owner_id, due_date, status, evidence_document_id, completed_at, created_by_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: report_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_fields (id, cycle_id, report_type, field_name, field_label, field_type, is_required, sort_order) FROM stdin;
\.


--
-- Data for Name: report_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_runs (id, cycle_id, report_type, quarter, department_id, scorecard_type, title, status, generated_by_id, generated_at, file_path, file_format, metadata, created_at) FROM stdin;
1	1	mid-year	1	\N	\N	Mid-Year Report Test 1	Generated	1	2026-04-09 20:01:40.927	\N	json	{"generatedAt":"2026-04-09T20:01:40.927Z"}	2026-04-09 20:01:40.928977
2	1	quarterly	1	\N	\N	Quarter 1 Test	Generated	1	2026-04-09 20:38:09.207	\N	json	{"generatedAt":"2026-04-09T20:38:09.207Z"}	2026-04-09 20:38:09.208109
3	1	annual	1	\N	\N	Annual Report_Test	Generated	1	2026-04-10 08:25:27.733	\N	json	{"generatedAt":"2026-04-10T08:25:27.733Z"}	2026-04-10 08:25:27.73418
4	1	institutional-evaluation	1	\N	\N	Institutional Evaluation	Generated	1	2026-04-21 07:40:28.862	\N	json	{"generatedAt":"2026-04-21T07:40:28.862Z"}	2026-04-21 07:40:28.86276
5	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:09:58.121	\N	json	{"generatedAt":"2026-07-09T14:09:58.122Z"}	2026-07-09 14:09:58.123071
6	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:12:22.907	\N	json	{"generatedAt":"2026-07-09T14:12:22.907Z"}	2026-07-09 14:12:22.908489
19	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:27:07.877	\N	json	{"generatedAt":"2026-07-09T14:27:07.877Z"}	2026-07-09 14:27:07.879105
24	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:30:57.627	\N	json	{"generatedAt":"2026-07-09T14:30:57.627Z"}	2026-07-09 14:30:57.63015
25	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:32:28.187	\N	json	{"generatedAt":"2026-07-09T14:32:28.187Z"}	2026-07-09 14:32:28.189365
26	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:36:44.729	\N	json	{"generatedAt":"2026-07-09T14:36:44.729Z"}	2026-07-09 14:36:44.730922
27	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:39:40.774	\N	json	{"generatedAt":"2026-07-09T14:39:40.774Z"}	2026-07-09 14:39:40.774575
28	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:49:28.306	\N	json	{"generatedAt":"2026-07-09T14:49:28.306Z"}	2026-07-09 14:49:28.307379
29	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 14:55:19.288	\N	json	{"generatedAt":"2026-07-09T14:55:19.288Z"}	2026-07-09 14:55:19.289298
30	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 16:42:30.533	\N	json	{"generatedAt":"2026-07-09T16:42:30.533Z"}	2026-07-09 16:42:30.533493
31	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 16:57:10.349	\N	json	{"generatedAt":"2026-07-09T16:57:10.349Z"}	2026-07-09 16:57:10.349727
32	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 17:05:25.995	\N	json	{"generatedAt":"2026-07-09T17:05:25.995Z"}	2026-07-09 17:05:25.995757
33	1	sdbip	\N	\N	\N	UoM check	Generated	1	2026-07-09 17:08:24.057	\N	json	{"generatedAt":"2026-07-09T17:08:24.057Z"}	2026-07-09 17:08:24.058563
34	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 17:09:24.236	\N	json	{"generatedAt":"2026-07-09T17:09:24.236Z"}	2026-07-09 17:09:24.237309
35	1	sdbip	\N	\N	\N	SDBIP Report 2025/2026	Generated	1	2026-07-09 18:09:09.152	\N	json	{"generatedAt":"2026-07-09T18:09:09.152Z"}	2026-07-09 18:09:09.153901
36	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 18:09:56.93	\N	json	{"generatedAt":"2026-07-09T18:09:56.930Z"}	2026-07-09 18:09:56.93095
37	1	sdbip	\N	\N	\N	Order check	Generated	1	2026-07-09 18:12:13.42	\N	json	{"generatedAt":"2026-07-09T18:12:13.420Z"}	2026-07-09 18:12:13.421502
38	1	sdbip	\N	\N	\N	Order check3	Generated	1	2026-07-09 18:12:58.278	\N	json	{"generatedAt":"2026-07-09T18:12:58.278Z"}	2026-07-09 18:12:58.279027
39	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 18:15:51.467	\N	json	{"generatedAt":"2026-07-09T18:15:51.467Z"}	2026-07-09 18:15:51.468011
40	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 18:18:51.261	\N	json	{"generatedAt":"2026-07-09T18:18:51.261Z"}	2026-07-09 18:18:51.262288
41	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 19:56:34.259	\N	json	{"generatedAt":"2026-07-09T19:56:34.259Z"}	2026-07-09 19:56:34.260423
42	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 20:10:50.375	\N	json	{"generatedAt":"2026-07-09T20:10:50.375Z"}	2026-07-09 20:10:50.376447
43	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 20:15:53.417	\N	json	{"generatedAt":"2026-07-09T20:15:53.417Z"}	2026-07-09 20:15:53.417919
44	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 20:18:57.988	\N	json	{"generatedAt":"2026-07-09T20:18:57.988Z"}	2026-07-09 20:18:57.988543
47	1	sdbip	\N	\N	organisational	SDBIP Report 2025/2026	Generated	1	2026-07-09 23:44:18.289	\N	json	{"generatedAt":"2026-07-09T23:44:18.289Z"}	2026-07-09 23:44:18.290474
48	1	revised-sdbip	\N	\N	revised	Revised SDBIP 2025/2026	Generated	1	2026-07-09 23:44:32.355	\N	json	{"generatedAt":"2026-07-09T23:44:32.355Z"}	2026-07-09 23:44:32.357237
49	1	quarterly	1	\N	\N	Quarterly Progress Report 2025/2026	Generated	1	2026-07-09 23:44:47.478	\N	json	{"generatedAt":"2026-07-09T23:44:47.478Z"}	2026-07-09 23:44:47.480052
51	1	quarterly	2	\N	\N	Quarterly Progress Report 2025/2026	Generated	1	2026-07-09 23:45:32.168	\N	json	{"generatedAt":"2026-07-09T23:45:32.168Z"}	2026-07-09 23:45:32.168454
52	1	quarterly	1	\N	\N	Quarterly Progress Report 2025/2026	Generated	1	2026-07-10 03:27:03.787	\N	json	{"generatedAt":"2026-07-10T03:27:03.787Z"}	2026-07-10 03:27:03.787929
53	1	quarterly	1	\N	\N	Quarterly Progress Report 2025/2026	Generated	1	2026-07-10 04:04:29.628	\N	json	{"generatedAt":"2026-07-10T04:04:29.628Z"}	2026-07-10 04:04:29.629357
\.


--
-- Data for Name: reviewer_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviewer_assignments (id, cycle_id, employee_id, primary_reviewer_id, secondary_reviewer_id, version, is_active, changed_by_id, change_reason, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role_code, permission) FROM stdin;
1	system_admin	*
2	perf_admin	cycles.create
3	perf_admin	cycles.update
4	perf_admin	cycles.delete
5	perf_admin	config.create
6	perf_admin	config.update
7	perf_admin	config.delete
8	perf_admin	config.manage
9	perf_admin	weightings.create
10	perf_admin	weightings.update
11	perf_admin	weightings.delete
12	perf_admin	deadlines.create
13	perf_admin	deadlines.update
14	perf_admin	agreement.edit
15	perf_admin	reviewer.manage
16	perf_admin	assessment.edit
17	perf_admin	moderation.manage
18	perf_admin	integration.manage
19	hod	agreement.edit
20	hod	reviewer.manage
21	hod	assessment.edit
22	hod	moderation.manage
23	dept_coordinator	agreement.edit
24	dept_coordinator	assessment.edit
25	reviewer	assessment.edit
26	responsible_post	agreement.edit
27	hr_admin	agreement.edit
28	hr_admin	reviewer.manage
29	hr_admin	integration.manage
30	muni_manager	agreement.edit
31	muni_manager	reviewer.manage
32	muni_manager	assessment.edit
33	muni_manager	moderation.manage
34	muni_manager	config.manage
35	audit_viewer	audit.view
36	council_readonly	dashboard.view
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, code, description) FROM stdin;
1	System Administrator	system_admin	Full system access
2	Performance Administrator	perf_admin	Manage performance configuration
3	Municipal Manager	muni_manager	Overall municipal performance oversight
4	Head of Department	hod	Department-level management
5	Departmental Coordinator	dept_coordinator	Department coordination
6	Responsible Post	responsible_post	KPI responsible person
7	Custodian	custodian	KPI custodian
8	Reviewer	reviewer	Review and moderate
9	HR Administrator	hr_admin	HR administration
10	Audit Viewer	audit_viewer	Read-only audit access
11	Council Read-only	council_readonly	Council read-only access
\.


--
-- Data for Name: scorecard_kpis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scorecard_kpis (id, scorecard_id, kpi_number, description, idp_reference, strategic_objective, programme, responsible_post_id, custodian_post_id, baseline, annual_target, annual_budget_target, evidence_source, evidence_portfolio, weighting, funding_source, budget_description, unit_of_measure_id, data_type_id, kpi_group_id, status, is_cumulative, sort_order, created_at, updated_at, custom_fields, return_comments) FROM stdin;
26	2	1	Procurement of 8 mobile tuckshops	\N	Promote local economic development and support sustainable livelihood opportunities through the provision of economic infrastructure.	\N	41	\N	6	8	\N	\N	\N	0	\N	\N	2	\N	2	Approved	t	0	2026-07-08 20:20:36.042312	2026-07-09 20:16:36.969	{"cf_nkpa": "Local Economic Development", "cf_department": "Local Economic Development", "cf_quarter_1_poe": "GRN and approved payment voucher", "cf_quarter_2_poe": "GRN and approved payment voucher", "cf_quarter_3_poe": "GRN and approved payment voucher", "cf_quarter_4_poe": "GRN and approved payment voucher", "cf_quarter_1_target": "2", "cf_quarter_2_target": "2", "cf_quarter_3_target": "2", "cf_quarter_4_target": "2"}	\N
28	2	2	Percentage implementation of the approved Internal Audit Plan.	\N	Strategic Objective\tKPI\tUnit of Measure\nStrengthen governance and internal control	\N	32	\N	0%	100% of the approved Internal Audit Plan implemented	\N	\N	\N	0	\N	\N	1	\N	5	Approved	t	1	2026-07-08 21:39:20.214511	2026-07-09 20:16:37.326	{"cf_nkpa": "Good Governance & Public Participation", "cf_department": "Office of the Municipal Manager", "cf_quarter_1_poe": "Internal Audit Progress Report", "cf_quarter_2_poe": "Internal Audit Progress Report", "cf_quarter_3_poe": "Internal Audit Progress Report", "cf_quarter_4_poe": "Internal Audit Progress Report", "cf_quarter_1_target": "25%", "cf_quarter_2_target": "50%", "cf_quarter_3_target": "75%", "cf_quarter_4_target": "100%"}	\N
27	2	3	Submission of the 2024/2025 Annual financial statement to AGSA.	\N	To ensure the timely preparation and submission of accurate, complete and GRAP-compliant Annual Financial Statements to the Auditor-General of South Africa (AGSA) in accordance with legislative requirements.	\N	37	\N	31 Aug	31 Aug 2026	\N	\N	\N	0	\N	\N	6	\N	4	Approved	f	2	2026-07-08 21:32:55.28488	2026-07-09 20:16:37.687	{"cf_nkpa": "Municipal Financial Viability & Management", "cf_department": "Budget & Treasury", "cf_quarter_1_poe": "Annual financial statement and acknowledgement of receit by AGSA", "cf_quarter_2_poe": "N/A", "cf_quarter_3_poe": "N/A", "cf_quarter_4_poe": "N/A", "cf_quarter_1_target": "AFS Submitted by 31 Aug 2026", "cf_quarter_2_target": "N/A", "cf_quarter_3_target": "N/A", "cf_quarter_4_target": "N/A"}	\N
\.


--
-- Data for Name: scorecard_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scorecard_types (id, name, code, description, is_active) FROM stdin;
1	Organisational	Org		t
2	Departmental	Dept		t
3	Individual	Ind		t
\.


--
-- Data for Name: scorecards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scorecards (id, name, cycle_id, scorecard_type, department_id, status, approved_by_id, approved_at, approval_comments, created_by_id, created_at, updated_at, return_comments, field_config_snapshot, parent_scorecard_id) FROM stdin;
2	SDBIP 2025/2026	1	organisational	\N	Approved	1	2026-07-09 20:16:38.017	\N	1	2026-04-09 18:47:53.455052	2026-07-09 20:16:38.017	\N	[{"id": 70, "fieldKey": "kpiNumber", "isLocked": true, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 0, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Number", "isIncluded": true, "isRequired": true}, {"id": 71, "fieldKey": "cf_nkpa", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "text", "sdbipType": "original", "sortOrder": 1, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "NKPA", "isIncluded": true, "isRequired": true}, {"id": 72, "fieldKey": "cf_department", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "text", "sdbipType": "original", "sortOrder": 2, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Department", "isIncluded": true, "isRequired": true}, {"id": 73, "fieldKey": "description", "isLocked": true, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "textarea", "sdbipType": "original", "sortOrder": 3, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Indicator Description", "isIncluded": true, "isRequired": true}, {"id": 74, "fieldKey": "strategicObjective", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "textarea", "sdbipType": "original", "sortOrder": 4, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Strategic Objective", "isIncluded": true, "isRequired": false}, {"id": 75, "fieldKey": "baseline", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 5, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Baseline", "isIncluded": true, "isRequired": false}, {"id": 76, "fieldKey": "annualTarget", "isLocked": true, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 6, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Annual Target", "isIncluded": true, "isRequired": true}, {"id": 77, "fieldKey": "unitOfMeasureId", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "select", "sdbipType": "original", "sortOrder": 7, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Unit of Measure", "isIncluded": true, "isRequired": false}, {"id": 78, "fieldKey": "cf_quarter_1_target", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 8, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 1 target", "isIncluded": true, "isRequired": true}, {"id": 79, "fieldKey": "cf_quarter_1_poe", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 9, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 1 POE", "isIncluded": true, "isRequired": true}, {"id": 80, "fieldKey": "cf_quarter_2_target", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 10, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 2 target", "isIncluded": true, "isRequired": true}, {"id": 81, "fieldKey": "cf_quarter_2_poe", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 11, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 2 POE", "isIncluded": true, "isRequired": true}, {"id": 82, "fieldKey": "cf_quarter_3_target", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 12, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 3 target", "isIncluded": true, "isRequired": true}, {"id": 83, "fieldKey": "cf_quarter_3_poe", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 13, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 3 POE", "isIncluded": true, "isRequired": true}, {"id": 84, "fieldKey": "cf_quarter_4_target", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 14, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 4 target", "isIncluded": true, "isRequired": true}, {"id": 85, "fieldKey": "cf_quarter_4_poe", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "custom", "fieldType": "alphanumeric", "sdbipType": "original", "sortOrder": 15, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Quarter 4 POE", "isIncluded": true, "isRequired": true}, {"id": 86, "fieldKey": "responsiblePostId", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "select", "sdbipType": "original", "sortOrder": 16, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Responsible Post", "isIncluded": true, "isRequired": false}, {"id": 87, "fieldKey": "idpReference", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 17, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "IDP Reference", "isIncluded": false, "isRequired": false}, {"id": 88, "fieldKey": "programme", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 18, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Programme", "isIncluded": false, "isRequired": false}, {"id": 89, "fieldKey": "custodianPostId", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "select", "sdbipType": "original", "sortOrder": 19, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Custodian Post", "isIncluded": false, "isRequired": false}, {"id": 90, "fieldKey": "annualBudgetTarget", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "number", "sdbipType": "original", "sortOrder": 20, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Financial Baseline (R)", "isIncluded": false, "isRequired": false}, {"id": 91, "fieldKey": "fundingSource", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 21, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Funding Source", "isIncluded": false, "isRequired": false}, {"id": 92, "fieldKey": "budgetDescription", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "textarea", "sdbipType": "original", "sortOrder": 22, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "Budget Description", "isIncluded": false, "isRequired": false}, {"id": 93, "fieldKey": "evidenceSource", "isLocked": false, "createdAt": "2026-07-08T15:33:52.009Z", "fieldKind": "primary", "fieldType": "text", "sdbipType": "original", "sortOrder": 23, "updatedAt": "2026-07-08T15:33:52.009Z", "fieldLabel": "POE Source", "isIncluded": false, "isRequired": false}]	\N
\.


--
-- Data for Name: sdbip_field_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sdbip_field_configs (id, sdbip_type, field_kind, field_key, field_label, field_type, is_included, is_required, is_locked, sort_order, created_at, updated_at) FROM stdin;
57	revised	primary	description	Indicator Description	textarea	t	t	t	1	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
58	revised	primary	idpReference	IDP Reference	text	t	f	f	2	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
59	revised	primary	strategicObjective	Strategic Objective	textarea	t	f	f	3	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
60	revised	primary	programme	Programme	text	t	f	f	4	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
61	revised	primary	responsiblePostId	Responsible Post	select	t	f	f	5	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
62	revised	primary	custodianPostId	Custodian Post	select	t	f	f	6	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
63	revised	primary	baseline	Baseline	text	t	f	f	7	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
64	revised	primary	annualTarget	Annual Target	text	t	t	t	8	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
65	revised	primary	annualBudgetTarget	Financial Baseline (R)	number	t	f	f	9	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
66	revised	primary	fundingSource	Funding Source	text	t	f	f	10	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
67	revised	primary	unitOfMeasureId	Unit of Measure	select	t	f	f	11	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
68	revised	primary	budgetDescription	Budget Description	textarea	t	f	f	12	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
69	revised	primary	evidenceSource	POE Source	text	t	f	f	13	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
56	revised	primary	kpiNumber	Number	text	t	t	t	0	2026-07-08 15:12:23.420155	2026-07-08 15:12:23.420155
70	original	primary	kpiNumber	Number	text	t	t	t	0	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
71	original	custom	cf_nkpa	NKPA	text	t	t	f	1	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
72	original	custom	cf_department	Department	text	t	t	f	2	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
73	original	primary	description	Indicator Description	textarea	t	t	t	3	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
74	original	primary	strategicObjective	Strategic Objective	textarea	t	f	f	4	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
75	original	primary	baseline	Baseline	text	t	f	f	5	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
76	original	primary	annualTarget	Annual Target	text	t	t	t	6	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
77	original	primary	unitOfMeasureId	Unit of Measure	select	t	f	f	7	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
78	original	custom	cf_quarter_1_target	Quarter 1 target	alphanumeric	t	t	f	8	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
79	original	custom	cf_quarter_1_poe	Quarter 1 POE	alphanumeric	t	t	f	9	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
80	original	custom	cf_quarter_2_target	Quarter 2 target	alphanumeric	t	t	f	10	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
81	original	custom	cf_quarter_2_poe	Quarter 2 POE	alphanumeric	t	t	f	11	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
82	original	custom	cf_quarter_3_target	Quarter 3 target	alphanumeric	t	t	f	12	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
83	original	custom	cf_quarter_3_poe	Quarter 3 POE	alphanumeric	t	t	f	13	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
84	original	custom	cf_quarter_4_target	Quarter 4 target	alphanumeric	t	t	f	14	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
85	original	custom	cf_quarter_4_poe	Quarter 4 POE	alphanumeric	t	t	f	15	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
86	original	primary	responsiblePostId	Responsible Post	select	t	f	f	16	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
87	original	primary	idpReference	IDP Reference	text	f	f	f	17	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
88	original	primary	programme	Programme	text	f	f	f	18	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
89	original	primary	custodianPostId	Custodian Post	select	f	f	f	19	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
90	original	primary	annualBudgetTarget	Financial Baseline (R)	number	f	f	f	20	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
91	original	primary	fundingSource	Funding Source	text	f	f	f	21	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
92	original	primary	budgetDescription	Budget Description	textarea	f	f	f	22	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
93	original	primary	evidenceSource	POE Source	text	f	f	f	23	2026-07-08 15:33:52.009991	2026-07-08 15:33:52.009991
94	departmental	primary	kpiNumber	Number	text	t	t	t	0	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
95	departmental	primary	description	KPI Description	textarea	t	t	t	1	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
96	departmental	primary	strategicObjective	Strategic Objective	textarea	f	f	f	2	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
97	departmental	primary	nkpaLink	NKPA Link	text	f	f	f	3	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
98	departmental	primary	responsiblePostId	Responsible Post	select	f	f	f	4	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
99	departmental	primary	baseline	Baseline	text	f	f	f	5	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
100	departmental	primary	annualTarget	Annual Target	text	t	t	t	6	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
101	departmental	primary	annualBudgetTarget	Annual Budget (R)	number	f	f	f	7	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
102	departmental	primary	unitOfMeasureId	Unit of Measure	select	f	f	f	8	2026-07-08 19:20:40.457859	2026-07-08 19:20:40.457859
117	quarterly	primary	kpiNumber	Number	text	t	t	t	0	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
118	quarterly	custom	cf_nkpa	NKPA	text	t	t	f	1	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
119	quarterly	custom	cf_department	Department	text	t	t	f	2	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
120	quarterly	primary	description	Indicator Description	textarea	t	t	t	3	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
121	quarterly	primary	strategicObjective	Strategic Objective	textarea	t	f	f	4	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
122	quarterly	primary	baseline	Baseline	text	t	f	f	5	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
123	quarterly	primary	annualTarget	Annual Target	text	t	t	t	6	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
124	quarterly	primary	unitOfMeasureId	Unit of Measure	select	t	f	f	7	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
125	quarterly	custom	cf_quarter_1_target	Q1 target	text	t	t	f	8	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
126	quarterly	custom	cf_q1_actual	Q1 Actual	text	t	t	f	9	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
127	quarterly	custom	cf_q1_poe	Q1 POE	text	t	t	f	10	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
128	quarterly	custom	cf_q2_target	Q2 target	text	t	t	f	11	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
129	quarterly	custom	cf_q2_actual	Q2 Actual	text	t	t	f	12	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
130	quarterly	custom	cf_q2_poe	Q2 POE	text	t	t	f	13	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
131	quarterly	custom	cf_q3_target	Q3 target	text	t	t	f	14	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
132	quarterly	custom	cf_q3_actual	Q3 Actual	text	t	t	f	15	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
133	quarterly	custom	cf_q3_poe	Q3 POE	text	t	t	f	16	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
134	quarterly	custom	cf_q4_target	Q4 target	text	t	t	f	17	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
135	quarterly	custom	cf_q4_actual	Q4 Actual	text	t	t	f	18	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
136	quarterly	custom	cf_q4_poe	Q4 POE	text	t	t	f	19	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
137	quarterly	primary	responsiblePostId	Responsible Post	select	t	f	f	20	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
138	quarterly	primary	annualBudgetTarget	Financial Baseline (R)	number	f	f	f	21	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
139	quarterly	primary	fundingSource	Funding Source	text	f	f	f	22	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
140	quarterly	primary	budgetDescription	Budget Description	textarea	f	f	f	23	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
141	quarterly	primary	evidenceSource	POE Source	text	f	f	f	24	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
142	quarterly	primary	idpReference	IDP Reference	text	f	f	f	25	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
143	quarterly	primary	programme	Programme	text	f	f	f	26	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
144	quarterly	primary	custodianPostId	Custodian Post	select	f	f	f	27	2026-07-09 21:00:59.206348	2026-07-09 21:00:59.206348
\.


--
-- Data for Name: sdbip_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sdbip_items (id, cycle_id, kpi_id, department_id, description, q1_target, q2_target, q3_target, q4_target, q1_budget, q2_budget, q3_budget, q4_budget, annual_budget, responsible_post_id, status, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sdbip_revision_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sdbip_revision_logs (id, scorecard_id, kpi_id, revision_type, field_name, old_value, new_value, revision_reason, quarter, user_id, user_name, created_at) FROM stdin;
\.


--
-- Data for Name: sdbip_revisions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sdbip_revisions (id, sdbip_item_id, revision_number, reason, previous_q1_target, previous_q2_target, previous_q3_target, previous_q4_target, previous_q1_budget, previous_q2_budget, previous_q3_budget, previous_q4_budget, new_q1_target, new_q2_target, new_q3_target, new_q4_target, new_q1_budget, new_q2_budget, new_q3_budget, new_q4_budget, revised_by_id, approved_by_id, status, created_at, approved_at) FROM stdin;
\.


--
-- Data for Name: submission_deadlines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submission_deadlines (id, cycle_id, quarter, deadline_date, reminder_days_before, is_active) FROM stdin;
\.


--
-- Data for Name: units_of_measure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.units_of_measure (id, name, abbreviation, cycle_id, is_active, data_type_id) FROM stdin;
1	Percentage	%	1	t	2
3	Rand	R	1	t	3
4	Days	d	1	t	1
5	Report	RP	1	t	5
6	Date	D	1	t	4
2	Number	#	1	t	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, display_name, email, role, department_id, is_active, created_at, updated_at, employee_number, job_title, level, supervisor_id, first_name, surname, id_number, cellphone, division_id, performance_category, start_date, termination_date) FROM stdin;
84	test_orgsc_1783601471582	Org Scorecard Test	test_orgsc_1783601471582@test.local	admin	\N	t	2026-07-09 12:51:11.668243	2026-07-09 12:51:11.668243	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	admin	System Administrator	admin@municipality.gov.za	system_admin	\N	t	2026-04-09 09:47:58.668785	2026-04-09 09:47:58.668785	\N	\N	\N	\N	System	Administrator	\N	\N	\N	\N	\N	\N
32	admin2	Lindiwe Dlamini	admin@municipality.gov.za	responsible_post	17	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	2	Manager: Internal Audit	Manager	\N	Lindiwe	Dlamini	\N	\N	115	Employees (Regulation 890)	2025-07-01	\N
33	admin3	Zanele Mofokeng	admin@municipality.gov.za	responsible_post	17	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	3	Internal Auditor	Staff	\N	Zanele	Mofokeng	\N	\N	115	Employees (Regulation 890)	2025-07-01	\N
34	admin4	Sindiswa Benya	admin@municipality.gov.za	responsible_post	19	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	4	Director: Strategic Management	Director	\N	Sindiswa	Benya	\N	\N	122	Section 56/57 Managers (Regulation 805)	2025-07-01	\N
35	admin5	Phumela Mkata	admin@municipality.gov.za	responsible_post	19	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	5	Manager: Strategic Management	Manager	\N	Phumela	Mkata	\N	\N	122	Employees (Regulation 890)	2025-07-01	\N
36	admin6	Mawande Mafongosi	admin@municipality.gov.za	responsible_post	19	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	6	PMS administrator	Staff	\N	Mawande	Mafongosi	\N	\N	122	Employees (Regulation 890)	2025-07-01	\N
37	admin7	Keith Khoabane	admin@municipality.gov.za	responsible_post	11	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	7	Chief Financial Officer	Director	\N	Keith	Khoabane	\N	\N	77	Section 56/57 Managers (Regulation 805)	2025-07-01	\N
38	admin8	Lerato Ndlovu	admin@municipality.gov.za	responsible_post	11	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	8	Manager: Expenditure	Manager	\N	Lerato	Ndlovu	\N	\N	77	Employees (Regulation 890)	2025-07-01	\N
39	admin9	Zanele Mthembu	admin@municipality.gov.za	responsible_post	11	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	9	SCM Practitioner	Staff	\N	Zanele	Mthembu	\N	\N	77	Employees (Regulation 890)	2025-07-01	\N
40	admin10	Ayanda Ngcobo	admin@municipality.gov.za	responsible_post	15	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	10	Director: Local Economic Development	Director	\N	Ayanda	Ngcobo	\N	\N	105	Section 56/57 Managers (Regulation 805)	2025-07-01	\N
41	admin11	Mpho Molefe	admin@municipality.gov.za	responsible_post	15	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	11	Manager: LED Programmes	Manager	\N	Mpho	Molefe	\N	\N	105	Employees (Regulation 890)	2025-07-01	\N
42	admin12	Faith Mahlangu	admin@municipality.gov.za	responsible_post	15	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	12	SMME Development Officer	Staff	\N	Faith	Mahlangu	\N	\N	105	Employees (Regulation 890)	2025-07-01	\N
31	admin1	Simon Moloi	admin@municipality.gov.za	responsible_post	17	t	2026-07-08 20:18:32.761633	2026-07-08 20:18:32.761633	1	Municipal Manager	MM	\N	Simon	Moloi	\N	\N	117	Section 56/57 Managers (Regulation 805)	2025-07-01	\N
\.


--
-- Data for Name: workflow_step_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_step_configs (id, scorecard_type_id, step_name, step_order, required_role, is_active, version, description, created_at, updated_at) FROM stdin;
\.


--
-- Name: ai_insight_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_insight_log_id_seq', 256, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 523, true);


--
-- Name: competency_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.competency_requirements_id_seq', 5, true);


--
-- Name: competency_template_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.competency_template_items_id_seq', 5, true);


--
-- Name: competency_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.competency_templates_id_seq', 1, true);


--
-- Name: constraint_register_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.constraint_register_id_seq', 1, false);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 48, true);


--
-- Name: dept_scorecard_kpis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dept_scorecard_kpis_id_seq', 77, true);


--
-- Name: dept_scorecards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dept_scorecards_id_seq', 66, true);


--
-- Name: divisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.divisions_id_seq', 138, true);


--
-- Name: employee_competency_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_competency_scores_id_seq', 1, false);


--
-- Name: employee_kpas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_kpas_id_seq', 5, true);


--
-- Name: employee_kpis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_kpis_id_seq', 5, true);


--
-- Name: individual_assessment_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.individual_assessment_records_id_seq', 3, true);


--
-- Name: individual_performance_agreements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.individual_performance_agreements_id_seq', 4, true);


--
-- Name: integration_sync_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.integration_sync_log_id_seq', 1, false);


--
-- Name: kpi_data_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_data_types_id_seq', 6, true);


--
-- Name: kpi_evidence_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_evidence_documents_id_seq', 54, true);


--
-- Name: kpi_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_groups_id_seq', 26, true);


--
-- Name: kpi_moderation_outcomes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_moderation_outcomes_id_seq', 1, false);


--
-- Name: kpi_month_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_month_activities_id_seq', 1, false);


--
-- Name: kpi_quarter_actuals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_quarter_actuals_id_seq', 487, true);


--
-- Name: kpi_quarter_targets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_quarter_targets_id_seq', 477, true);


--
-- Name: kpi_rating_thresholds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_rating_thresholds_id_seq', 10, true);


--
-- Name: kpi_review_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_review_submissions_id_seq', 37, true);


--
-- Name: kpi_variances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kpi_variances_id_seq', 1, false);


--
-- Name: moderation_records_individual_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.moderation_records_individual_id_seq', 2, true);


--
-- Name: national_kpas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.national_kpas_id_seq', 8, true);


--
-- Name: nkpa_weightings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nkpa_weightings_id_seq', 5, true);


--
-- Name: notification_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_configs_id_seq', 3, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 41, true);


--
-- Name: performance_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.performance_cycles_id_seq', 94, true);


--
-- Name: period_locks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.period_locks_id_seq', 1, false);


--
-- Name: progress_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.progress_statuses_id_seq', 4, true);


--
-- Name: remedial_action_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.remedial_action_plans_id_seq', 4, true);


--
-- Name: report_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.report_fields_id_seq', 1, false);


--
-- Name: report_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.report_runs_id_seq', 53, true);


--
-- Name: reviewer_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviewer_assignments_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 37, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 11, true);


--
-- Name: scorecard_kpis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scorecard_kpis_id_seq', 467, true);


--
-- Name: scorecard_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scorecard_types_id_seq', 3, true);


--
-- Name: scorecards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scorecards_id_seq', 157, true);


--
-- Name: sdbip_field_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sdbip_field_configs_id_seq', 144, true);


--
-- Name: sdbip_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sdbip_items_id_seq', 18, true);


--
-- Name: sdbip_revision_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sdbip_revision_logs_id_seq', 1, true);


--
-- Name: sdbip_revisions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sdbip_revisions_id_seq', 1, false);


--
-- Name: submission_deadlines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.submission_deadlines_id_seq', 1, false);


--
-- Name: units_of_measure_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.units_of_measure_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 163, true);


--
-- Name: workflow_step_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workflow_step_configs_id_seq', 1, false);


--
-- Name: ai_insight_log ai_insight_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insight_log
    ADD CONSTRAINT ai_insight_log_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: competency_requirements competency_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_requirements
    ADD CONSTRAINT competency_requirements_pkey PRIMARY KEY (id);


--
-- Name: competency_template_items competency_template_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_template_items
    ADD CONSTRAINT competency_template_items_pkey PRIMARY KEY (id);


--
-- Name: competency_templates competency_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_templates
    ADD CONSTRAINT competency_templates_pkey PRIMARY KEY (id);


--
-- Name: constraint_register constraint_register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constraint_register
    ADD CONSTRAINT constraint_register_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: dept_scorecard_kpis dept_scorecard_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecard_kpis
    ADD CONSTRAINT dept_scorecard_kpis_pkey PRIMARY KEY (id);


--
-- Name: dept_scorecards dept_scorecards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_pkey PRIMARY KEY (id);


--
-- Name: divisions divisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_pkey PRIMARY KEY (id);


--
-- Name: employee_competency_scores employee_competency_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_competency_scores
    ADD CONSTRAINT employee_competency_scores_pkey PRIMARY KEY (id);


--
-- Name: employee_kpas employee_kpas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpas
    ADD CONSTRAINT employee_kpas_pkey PRIMARY KEY (id);


--
-- Name: employee_kpis employee_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpis
    ADD CONSTRAINT employee_kpis_pkey PRIMARY KEY (id);


--
-- Name: individual_assessment_records individual_assessment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_assessment_records
    ADD CONSTRAINT individual_assessment_records_pkey PRIMARY KEY (id);


--
-- Name: individual_performance_agreements individual_performance_agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_pkey PRIMARY KEY (id);


--
-- Name: integration_sync_log integration_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_sync_log
    ADD CONSTRAINT integration_sync_log_pkey PRIMARY KEY (id);


--
-- Name: kpi_data_types kpi_data_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_data_types
    ADD CONSTRAINT kpi_data_types_pkey PRIMARY KEY (id);


--
-- Name: kpi_evidence_documents kpi_evidence_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_evidence_documents
    ADD CONSTRAINT kpi_evidence_documents_pkey PRIMARY KEY (id);


--
-- Name: kpi_groups kpi_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_groups
    ADD CONSTRAINT kpi_groups_pkey PRIMARY KEY (id);


--
-- Name: kpi_moderation_outcomes kpi_moderation_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_moderation_outcomes
    ADD CONSTRAINT kpi_moderation_outcomes_pkey PRIMARY KEY (id);


--
-- Name: kpi_month_activities kpi_month_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_month_activities
    ADD CONSTRAINT kpi_month_activities_pkey PRIMARY KEY (id);


--
-- Name: kpi_quarter_actuals kpi_quarter_actuals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_actuals
    ADD CONSTRAINT kpi_quarter_actuals_pkey PRIMARY KEY (id);


--
-- Name: kpi_quarter_targets kpi_quarter_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_targets
    ADD CONSTRAINT kpi_quarter_targets_pkey PRIMARY KEY (id);


--
-- Name: kpi_rating_thresholds kpi_rating_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_rating_thresholds
    ADD CONSTRAINT kpi_rating_thresholds_pkey PRIMARY KEY (id);


--
-- Name: kpi_review_submissions kpi_review_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_review_submissions
    ADD CONSTRAINT kpi_review_submissions_pkey PRIMARY KEY (id);


--
-- Name: kpi_variances kpi_variances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_variances
    ADD CONSTRAINT kpi_variances_pkey PRIMARY KEY (id);


--
-- Name: moderation_records_individual moderation_records_individual_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_records_individual
    ADD CONSTRAINT moderation_records_individual_pkey PRIMARY KEY (id);


--
-- Name: national_kpas national_kpas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.national_kpas
    ADD CONSTRAINT national_kpas_pkey PRIMARY KEY (id);


--
-- Name: nkpa_weightings nkpa_weightings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nkpa_weightings
    ADD CONSTRAINT nkpa_weightings_pkey PRIMARY KEY (id);


--
-- Name: notification_configs notification_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_configs
    ADD CONSTRAINT notification_configs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: performance_cycles performance_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_cycles
    ADD CONSTRAINT performance_cycles_pkey PRIMARY KEY (id);


--
-- Name: period_locks period_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period_locks
    ADD CONSTRAINT period_locks_pkey PRIMARY KEY (id);


--
-- Name: progress_statuses progress_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_statuses
    ADD CONSTRAINT progress_statuses_pkey PRIMARY KEY (id);


--
-- Name: remedial_action_plans remedial_action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remedial_action_plans
    ADD CONSTRAINT remedial_action_plans_pkey PRIMARY KEY (id);


--
-- Name: report_fields report_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_fields
    ADD CONSTRAINT report_fields_pkey PRIMARY KEY (id);


--
-- Name: report_runs report_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_runs
    ADD CONSTRAINT report_runs_pkey PRIMARY KEY (id);


--
-- Name: reviewer_assignments reviewer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_unique UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: scorecard_kpis scorecard_kpis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_kpis
    ADD CONSTRAINT scorecard_kpis_pkey PRIMARY KEY (id);


--
-- Name: scorecard_types scorecard_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_types
    ADD CONSTRAINT scorecard_types_pkey PRIMARY KEY (id);


--
-- Name: scorecards scorecards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecards
    ADD CONSTRAINT scorecards_pkey PRIMARY KEY (id);


--
-- Name: sdbip_field_configs sdbip_field_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_field_configs
    ADD CONSTRAINT sdbip_field_configs_pkey PRIMARY KEY (id);


--
-- Name: sdbip_items sdbip_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_items
    ADD CONSTRAINT sdbip_items_pkey PRIMARY KEY (id);


--
-- Name: sdbip_revision_logs sdbip_revision_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revision_logs
    ADD CONSTRAINT sdbip_revision_logs_pkey PRIMARY KEY (id);


--
-- Name: sdbip_revisions sdbip_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revisions
    ADD CONSTRAINT sdbip_revisions_pkey PRIMARY KEY (id);


--
-- Name: submission_deadlines submission_deadlines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_deadlines
    ADD CONSTRAINT submission_deadlines_pkey PRIMARY KEY (id);


--
-- Name: units_of_measure units_of_measure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: workflow_step_configs workflow_step_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_step_configs
    ADD CONSTRAINT workflow_step_configs_pkey PRIMARY KEY (id);


--
-- Name: departments_cycle_name_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX departments_cycle_name_uq ON public.departments USING btree (cycle_id, lower(name));


--
-- Name: divisions_department_name_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX divisions_department_name_uq ON public.divisions USING btree (department_id, lower(name));


--
-- Name: notifications_user_dedupe_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX notifications_user_dedupe_uq ON public.notifications USING btree (user_id, dedupe_key);


--
-- Name: scorecard_kpis_scorecard_number_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX scorecard_kpis_scorecard_number_uq ON public.scorecard_kpis USING btree (scorecard_id, kpi_number) WHERE (kpi_number ~ '^[0-9]+$'::text);


--
-- Name: users_employee_number_lower_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_employee_number_lower_uq ON public.users USING btree (lower(employee_number)) WHERE (employee_number IS NOT NULL);


--
-- Name: ai_insight_log ai_insight_log_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insight_log
    ADD CONSTRAINT ai_insight_log_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: ai_insight_log ai_insight_log_generated_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_insight_log
    ADD CONSTRAINT ai_insight_log_generated_by_id_users_id_fk FOREIGN KEY (generated_by_id) REFERENCES public.users(id);


--
-- Name: competency_requirements competency_requirements_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_requirements
    ADD CONSTRAINT competency_requirements_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: competency_template_items competency_template_items_template_id_competency_templates_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competency_template_items
    ADD CONSTRAINT competency_template_items_template_id_competency_templates_id_f FOREIGN KEY (template_id) REFERENCES public.competency_templates(id);


--
-- Name: constraint_register constraint_register_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constraint_register
    ADD CONSTRAINT constraint_register_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: constraint_register constraint_register_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.constraint_register
    ADD CONSTRAINT constraint_register_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: departments departments_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: dept_scorecard_kpis dept_scorecard_kpis_dept_scorecard_id_dept_scorecards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecard_kpis
    ADD CONSTRAINT dept_scorecard_kpis_dept_scorecard_id_dept_scorecards_id_fk FOREIGN KEY (dept_scorecard_id) REFERENCES public.dept_scorecards(id);


--
-- Name: dept_scorecard_kpis dept_scorecard_kpis_parent_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecard_kpis
    ADD CONSTRAINT dept_scorecard_kpis_parent_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (parent_kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: dept_scorecard_kpis dept_scorecard_kpis_responsible_post_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecard_kpis
    ADD CONSTRAINT dept_scorecard_kpis_responsible_post_id_users_id_fk FOREIGN KEY (responsible_post_id) REFERENCES public.users(id);


--
-- Name: dept_scorecards dept_scorecards_approved_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_approved_by_id_users_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: dept_scorecards dept_scorecards_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: dept_scorecards dept_scorecards_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: dept_scorecards dept_scorecards_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: dept_scorecards dept_scorecards_parent_scorecard_id_scorecards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dept_scorecards
    ADD CONSTRAINT dept_scorecards_parent_scorecard_id_scorecards_id_fk FOREIGN KEY (parent_scorecard_id) REFERENCES public.scorecards(id);


--
-- Name: divisions divisions_department_id_departments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_department_id_departments_id_fk FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employee_competency_scores employee_competency_scores_agreement_id_individual_performance_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_competency_scores
    ADD CONSTRAINT employee_competency_scores_agreement_id_individual_performance_ FOREIGN KEY (agreement_id) REFERENCES public.individual_performance_agreements(id);


--
-- Name: employee_competency_scores employee_competency_scores_competency_item_id_competency_templa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_competency_scores
    ADD CONSTRAINT employee_competency_scores_competency_item_id_competency_templa FOREIGN KEY (competency_item_id) REFERENCES public.competency_template_items(id);


--
-- Name: employee_competency_scores employee_competency_scores_scored_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_competency_scores
    ADD CONSTRAINT employee_competency_scores_scored_by_id_users_id_fk FOREIGN KEY (scored_by_id) REFERENCES public.users(id);


--
-- Name: employee_kpas employee_kpas_agreement_id_individual_performance_agreements_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpas
    ADD CONSTRAINT employee_kpas_agreement_id_individual_performance_agreements_id FOREIGN KEY (agreement_id) REFERENCES public.individual_performance_agreements(id);


--
-- Name: employee_kpis employee_kpis_agreement_id_individual_performance_agreements_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpis
    ADD CONSTRAINT employee_kpis_agreement_id_individual_performance_agreements_id FOREIGN KEY (agreement_id) REFERENCES public.individual_performance_agreements(id);


--
-- Name: employee_kpis employee_kpis_dept_kpi_id_dept_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpis
    ADD CONSTRAINT employee_kpis_dept_kpi_id_dept_scorecard_kpis_id_fk FOREIGN KEY (dept_kpi_id) REFERENCES public.dept_scorecard_kpis(id);


--
-- Name: employee_kpis employee_kpis_kpa_id_employee_kpas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_kpis
    ADD CONSTRAINT employee_kpis_kpa_id_employee_kpas_id_fk FOREIGN KEY (kpa_id) REFERENCES public.employee_kpas(id);


--
-- Name: individual_assessment_records individual_assessment_records_agreement_id_individual_performan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_assessment_records
    ADD CONSTRAINT individual_assessment_records_agreement_id_individual_performan FOREIGN KEY (agreement_id) REFERENCES public.individual_performance_agreements(id);


--
-- Name: individual_assessment_records individual_assessment_records_reviewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_assessment_records
    ADD CONSTRAINT individual_assessment_records_reviewer_id_users_id_fk FOREIGN KEY (reviewer_id) REFERENCES public.users(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_approved_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_approved_by_id_users_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_cycle_id_performance_cycles_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_cycle_id_performance_cycles_i FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_dept_scorecard_id_dept_scorec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_dept_scorecard_id_dept_scorec FOREIGN KEY (dept_scorecard_id) REFERENCES public.dept_scorecards(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_employee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_employee_id_users_id_fk FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_primary_reviewer_id_users_id_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_primary_reviewer_id_users_id_ FOREIGN KEY (primary_reviewer_id) REFERENCES public.users(id);


--
-- Name: individual_performance_agreements individual_performance_agreements_secondary_reviewer_id_users_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.individual_performance_agreements
    ADD CONSTRAINT individual_performance_agreements_secondary_reviewer_id_users_i FOREIGN KEY (secondary_reviewer_id) REFERENCES public.users(id);


--
-- Name: integration_sync_log integration_sync_log_synced_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integration_sync_log
    ADD CONSTRAINT integration_sync_log_synced_by_id_users_id_fk FOREIGN KEY (synced_by_id) REFERENCES public.users(id);


--
-- Name: kpi_evidence_documents kpi_evidence_documents_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_evidence_documents
    ADD CONSTRAINT kpi_evidence_documents_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_evidence_documents kpi_evidence_documents_uploaded_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_evidence_documents
    ADD CONSTRAINT kpi_evidence_documents_uploaded_by_id_users_id_fk FOREIGN KEY (uploaded_by_id) REFERENCES public.users(id);


--
-- Name: kpi_evidence_documents kpi_evidence_documents_verified_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_evidence_documents
    ADD CONSTRAINT kpi_evidence_documents_verified_by_id_users_id_fk FOREIGN KEY (verified_by_id) REFERENCES public.users(id);


--
-- Name: kpi_groups kpi_groups_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_groups
    ADD CONSTRAINT kpi_groups_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: kpi_moderation_outcomes kpi_moderation_outcomes_actual_id_kpi_quarter_actuals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_moderation_outcomes
    ADD CONSTRAINT kpi_moderation_outcomes_actual_id_kpi_quarter_actuals_id_fk FOREIGN KEY (actual_id) REFERENCES public.kpi_quarter_actuals(id);


--
-- Name: kpi_moderation_outcomes kpi_moderation_outcomes_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_moderation_outcomes
    ADD CONSTRAINT kpi_moderation_outcomes_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_moderation_outcomes kpi_moderation_outcomes_moderator_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_moderation_outcomes
    ADD CONSTRAINT kpi_moderation_outcomes_moderator_user_id_users_id_fk FOREIGN KEY (moderator_user_id) REFERENCES public.users(id);


--
-- Name: kpi_month_activities kpi_month_activities_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_month_activities
    ADD CONSTRAINT kpi_month_activities_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_month_activities kpi_month_activities_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_month_activities
    ADD CONSTRAINT kpi_month_activities_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: kpi_quarter_actuals kpi_quarter_actuals_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_actuals
    ADD CONSTRAINT kpi_quarter_actuals_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_quarter_actuals kpi_quarter_actuals_reviewed_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_actuals
    ADD CONSTRAINT kpi_quarter_actuals_reviewed_by_id_users_id_fk FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id);


--
-- Name: kpi_quarter_actuals kpi_quarter_actuals_submitted_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_actuals
    ADD CONSTRAINT kpi_quarter_actuals_submitted_by_id_users_id_fk FOREIGN KEY (submitted_by_id) REFERENCES public.users(id);


--
-- Name: kpi_quarter_targets kpi_quarter_targets_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_targets
    ADD CONSTRAINT kpi_quarter_targets_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_quarter_targets kpi_quarter_targets_revised_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_quarter_targets
    ADD CONSTRAINT kpi_quarter_targets_revised_by_id_users_id_fk FOREIGN KEY (revised_by_id) REFERENCES public.users(id);


--
-- Name: kpi_review_submissions kpi_review_submissions_actual_id_kpi_quarter_actuals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_review_submissions
    ADD CONSTRAINT kpi_review_submissions_actual_id_kpi_quarter_actuals_id_fk FOREIGN KEY (actual_id) REFERENCES public.kpi_quarter_actuals(id);


--
-- Name: kpi_review_submissions kpi_review_submissions_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_review_submissions
    ADD CONSTRAINT kpi_review_submissions_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: kpi_review_submissions kpi_review_submissions_reviewer_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_review_submissions
    ADD CONSTRAINT kpi_review_submissions_reviewer_user_id_users_id_fk FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id);


--
-- Name: kpi_variances kpi_variances_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_variances
    ADD CONSTRAINT kpi_variances_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: kpi_variances kpi_variances_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_variances
    ADD CONSTRAINT kpi_variances_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: moderation_records_individual moderation_records_individual_agreement_id_individual_performan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_records_individual
    ADD CONSTRAINT moderation_records_individual_agreement_id_individual_performan FOREIGN KEY (agreement_id) REFERENCES public.individual_performance_agreements(id);


--
-- Name: moderation_records_individual moderation_records_individual_assessment_id_individual_assessme; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_records_individual
    ADD CONSTRAINT moderation_records_individual_assessment_id_individual_assessme FOREIGN KEY (assessment_id) REFERENCES public.individual_assessment_records(id);


--
-- Name: moderation_records_individual moderation_records_individual_moderator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_records_individual
    ADD CONSTRAINT moderation_records_individual_moderator_id_users_id_fk FOREIGN KEY (moderator_id) REFERENCES public.users(id);


--
-- Name: nkpa_weightings nkpa_weightings_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nkpa_weightings
    ADD CONSTRAINT nkpa_weightings_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: notification_configs notification_configs_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_configs
    ADD CONSTRAINT notification_configs_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: period_locks period_locks_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period_locks
    ADD CONSTRAINT period_locks_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: period_locks period_locks_locked_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period_locks
    ADD CONSTRAINT period_locks_locked_by_id_users_id_fk FOREIGN KEY (locked_by_id) REFERENCES public.users(id);


--
-- Name: period_locks period_locks_reopened_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period_locks
    ADD CONSTRAINT period_locks_reopened_by_id_users_id_fk FOREIGN KEY (reopened_by_id) REFERENCES public.users(id);


--
-- Name: progress_statuses progress_statuses_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_statuses
    ADD CONSTRAINT progress_statuses_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: remedial_action_plans remedial_action_plans_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remedial_action_plans
    ADD CONSTRAINT remedial_action_plans_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: remedial_action_plans remedial_action_plans_evidence_document_id_kpi_evidence_documen; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remedial_action_plans
    ADD CONSTRAINT remedial_action_plans_evidence_document_id_kpi_evidence_documen FOREIGN KEY (evidence_document_id) REFERENCES public.kpi_evidence_documents(id);


--
-- Name: remedial_action_plans remedial_action_plans_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remedial_action_plans
    ADD CONSTRAINT remedial_action_plans_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: report_fields report_fields_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_fields
    ADD CONSTRAINT report_fields_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: report_runs report_runs_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_runs
    ADD CONSTRAINT report_runs_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: report_runs report_runs_generated_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_runs
    ADD CONSTRAINT report_runs_generated_by_id_users_id_fk FOREIGN KEY (generated_by_id) REFERENCES public.users(id);


--
-- Name: reviewer_assignments reviewer_assignments_changed_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_changed_by_id_users_id_fk FOREIGN KEY (changed_by_id) REFERENCES public.users(id);


--
-- Name: reviewer_assignments reviewer_assignments_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: reviewer_assignments reviewer_assignments_employee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_employee_id_users_id_fk FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: reviewer_assignments reviewer_assignments_primary_reviewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_primary_reviewer_id_users_id_fk FOREIGN KEY (primary_reviewer_id) REFERENCES public.users(id);


--
-- Name: reviewer_assignments reviewer_assignments_secondary_reviewer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviewer_assignments
    ADD CONSTRAINT reviewer_assignments_secondary_reviewer_id_users_id_fk FOREIGN KEY (secondary_reviewer_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_role_code_roles_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_code_roles_code_fk FOREIGN KEY (role_code) REFERENCES public.roles(code);


--
-- Name: scorecard_kpis scorecard_kpis_custodian_post_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_kpis
    ADD CONSTRAINT scorecard_kpis_custodian_post_id_users_id_fk FOREIGN KEY (custodian_post_id) REFERENCES public.users(id);


--
-- Name: scorecard_kpis scorecard_kpis_responsible_post_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_kpis
    ADD CONSTRAINT scorecard_kpis_responsible_post_id_users_id_fk FOREIGN KEY (responsible_post_id) REFERENCES public.users(id);


--
-- Name: scorecard_kpis scorecard_kpis_scorecard_id_scorecards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecard_kpis
    ADD CONSTRAINT scorecard_kpis_scorecard_id_scorecards_id_fk FOREIGN KEY (scorecard_id) REFERENCES public.scorecards(id);


--
-- Name: scorecards scorecards_approved_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecards
    ADD CONSTRAINT scorecards_approved_by_id_users_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: scorecards scorecards_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecards
    ADD CONSTRAINT scorecards_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: scorecards scorecards_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scorecards
    ADD CONSTRAINT scorecards_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: sdbip_items sdbip_items_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_items
    ADD CONSTRAINT sdbip_items_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: sdbip_items sdbip_items_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_items
    ADD CONSTRAINT sdbip_items_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: sdbip_items sdbip_items_responsible_post_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_items
    ADD CONSTRAINT sdbip_items_responsible_post_id_users_id_fk FOREIGN KEY (responsible_post_id) REFERENCES public.users(id);


--
-- Name: sdbip_revision_logs sdbip_revision_logs_kpi_id_scorecard_kpis_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revision_logs
    ADD CONSTRAINT sdbip_revision_logs_kpi_id_scorecard_kpis_id_fk FOREIGN KEY (kpi_id) REFERENCES public.scorecard_kpis(id);


--
-- Name: sdbip_revision_logs sdbip_revision_logs_scorecard_id_scorecards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revision_logs
    ADD CONSTRAINT sdbip_revision_logs_scorecard_id_scorecards_id_fk FOREIGN KEY (scorecard_id) REFERENCES public.scorecards(id);


--
-- Name: sdbip_revision_logs sdbip_revision_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revision_logs
    ADD CONSTRAINT sdbip_revision_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sdbip_revisions sdbip_revisions_approved_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revisions
    ADD CONSTRAINT sdbip_revisions_approved_by_id_users_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.users(id);


--
-- Name: sdbip_revisions sdbip_revisions_revised_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revisions
    ADD CONSTRAINT sdbip_revisions_revised_by_id_users_id_fk FOREIGN KEY (revised_by_id) REFERENCES public.users(id);


--
-- Name: sdbip_revisions sdbip_revisions_sdbip_item_id_sdbip_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sdbip_revisions
    ADD CONSTRAINT sdbip_revisions_sdbip_item_id_sdbip_items_id_fk FOREIGN KEY (sdbip_item_id) REFERENCES public.sdbip_items(id);


--
-- Name: submission_deadlines submission_deadlines_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_deadlines
    ADD CONSTRAINT submission_deadlines_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: units_of_measure units_of_measure_cycle_id_performance_cycles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_cycle_id_performance_cycles_id_fk FOREIGN KEY (cycle_id) REFERENCES public.performance_cycles(id);


--
-- Name: units_of_measure units_of_measure_data_type_id_kpi_data_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_data_type_id_kpi_data_types_id_fk FOREIGN KEY (data_type_id) REFERENCES public.kpi_data_types(id);


--
-- PostgreSQL database dump complete
--

\unrestrict EgxTlsX3GhJn2l4lPGgCqG1aEy2YfJpdzjmqi4s1xOPAa2gPQTID2pqaYKoH5c1

