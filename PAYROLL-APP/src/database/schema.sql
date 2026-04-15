--
-- PostgreSQL database dump
--

\restrict HaLjZzuHV18W09DdlnrgINMmHwXFUKaGpZCLArKnmuBHA53vKwrzG91JebCKQsw

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absence_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absence_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    leave_type_id integer,
    enabled boolean DEFAULT true
);


ALTER TABLE public.absence_types OWNER TO postgres;

--
-- Name: absence_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absence_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absence_types_id_seq OWNER TO postgres;

--
-- Name: absence_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absence_types_id_seq OWNED BY public.absence_types.id;


--
-- Name: applicant_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_scores (
    id integer NOT NULL,
    applicant_id integer,
    criterion character varying(200) NOT NULL,
    score integer DEFAULT 0,
    max_score integer DEFAULT 10,
    scored_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.applicant_scores OWNER TO postgres;

--
-- Name: applicant_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_scores_id_seq OWNER TO postgres;

--
-- Name: applicant_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_scores_id_seq OWNED BY public.applicant_scores.id;


--
-- Name: approval_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_workflows (
    id integer NOT NULL,
    workflow_name character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    steps jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.approval_workflows OWNER TO postgres;

--
-- Name: approval_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_workflows_id_seq OWNER TO postgres;

--
-- Name: approval_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_workflows_id_seq OWNED BY public.approval_workflows.id;


--
-- Name: arrears; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arrears (
    id integer NOT NULL,
    employee_id integer,
    salary_head_id integer,
    run_id integer,
    amount numeric(15,2) NOT NULL,
    reason character varying(100),
    recovered boolean DEFAULT false,
    recovered_run_id integer,
    recovered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.arrears OWNER TO postgres;

--
-- Name: arrears_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.arrears_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.arrears_id_seq OWNER TO postgres;

--
-- Name: arrears_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.arrears_id_seq OWNED BY public.arrears.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    user_id integer,
    user_name character varying(200),
    ip_address character varying(50),
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    entity character varying(100),
    username character varying(200),
    request_method character varying(10),
    request_url character varying(1000),
    request_body text,
    response_status integer,
    CONSTRAINT audit_log_action_check CHECK (((action)::text = ANY (ARRAY[('CREATE'::character varying)::text, ('UPDATE'::character varying)::text, ('DELETE'::character varying)::text, ('VIEW'::character varying)::text, ('APPROVE'::character varying)::text, ('REJECT'::character varying)::text, ('LOGIN'::character varying)::text, ('LOGOUT'::character varying)::text])))
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: bargaining_councils; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bargaining_councils (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bargaining_councils OWNER TO postgres;

--
-- Name: bargaining_councils_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bargaining_councils_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bargaining_councils_id_seq OWNER TO postgres;

--
-- Name: bargaining_councils_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bargaining_councils_id_seq OWNED BY public.bargaining_councils.id;


--
-- Name: benefit_rate_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.benefit_rate_tables (
    id integer NOT NULL,
    scheme_id integer,
    plan_name character varying(100),
    member_rate numeric(10,2),
    adult_dependant_rate numeric(10,2),
    child_dependant_rate numeric(10,2),
    effective_date date DEFAULT CURRENT_DATE,
    end_date date
);


ALTER TABLE public.benefit_rate_tables OWNER TO postgres;

--
-- Name: benefit_rate_tables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.benefit_rate_tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.benefit_rate_tables_id_seq OWNER TO postgres;

--
-- Name: benefit_rate_tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.benefit_rate_tables_id_seq OWNED BY public.benefit_rate_tables.id;


--
-- Name: claim_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_rates (
    id integer NOT NULL,
    claim_type character varying(50) NOT NULL,
    description character varying(200),
    rate numeric(10,2) NOT NULL,
    rate_unit character varying(20) DEFAULT 'FIXED'::character varying,
    effective_date date DEFAULT CURRENT_DATE,
    end_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.claim_rates OWNER TO postgres;

--
-- Name: claim_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claim_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claim_rates_id_seq OWNER TO postgres;

--
-- Name: claim_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claim_rates_id_seq OWNED BY public.claim_rates.id;


--
-- Name: claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claims (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    claim_type character varying(20) NOT NULL,
    sub_type character varying(100),
    start_date date NOT NULL,
    end_date date,
    amount numeric(18,2) NOT NULL,
    kilometres numeric(10,2),
    reason text,
    override_project boolean DEFAULT false,
    override_project_id character varying(50),
    status character varying(20) DEFAULT 'PENDING'::character varying,
    approved_by integer,
    approved_at timestamp without time zone,
    period_id integer,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    document_path character varying(500),
    reference_no character varying(100),
    CONSTRAINT claims_claim_type_check CHECK (((claim_type)::text = ANY (ARRAY[('S_AND_T'::character varying)::text, ('TRAVEL'::character varying)::text, ('OTHER'::character varying)::text]))),
    CONSTRAINT claims_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('PAID'::character varying)::text])))
);


ALTER TABLE public.claims OWNER TO postgres;

--
-- Name: claims_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.claims_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.claims_id_seq OWNER TO postgres;

--
-- Name: claims_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.claims_id_seq OWNED BY public.claims.id;


--
-- Name: sars_prescribed_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sars_prescribed_rates (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    description character varying(200) NOT NULL,
    subtype_index character varying(100) NOT NULL,
    irp5_code character varying(50),
    rate numeric(10,2) NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sars_prescribed_rates_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sars_prescribed_rates OWNER TO postgres;

CREATE SEQUENCE public.sars_prescribed_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.sars_prescribed_rates_id_seq OWNER TO postgres;
ALTER SEQUENCE public.sars_prescribed_rates_id_seq OWNED BY public.sars_prescribed_rates.id;
ALTER TABLE ONLY public.sars_prescribed_rates ALTER COLUMN id SET DEFAULT nextval('public.sars_prescribed_rates_id_seq'::regclass);

--
-- Seed data: 2026/2027 SARS Prescribed Rates
--
INSERT INTO public.sars_prescribed_rates (tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date) VALUES
  (2027, 'Meals and Incidental Cost', 'Local – Meals and Incidental Costs', '3704, 3705, 3714', 595.00, '2026-03-01', '9999-12-31'),
  (2027, 'Incidental Cost Only', 'Local – Incidental Costs', '3704, 3705, 3714', 184.00, '2026-03-01', '9999-12-31');


--
-- Name: claim_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_configurations (
    id integer NOT NULL,
    claim_type character varying(50) NOT NULL,
    claim_subtype character varying(100) NOT NULL,
    claim_group character varying(100),
    employee_type_id integer,
    client_policy character varying(200),
    sars_prescribed_rate_id integer,
    salary_head_id integer,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer,
    CONSTRAINT claim_configurations_pkey PRIMARY KEY (id)
);

ALTER TABLE public.claim_configurations OWNER TO postgres;

CREATE SEQUENCE public.claim_configurations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.claim_configurations_id_seq OWNER TO postgres;
ALTER SEQUENCE public.claim_configurations_id_seq OWNED BY public.claim_configurations.id;
ALTER TABLE ONLY public.claim_configurations ALTER COLUMN id SET DEFAULT nextval('public.claim_configurations_id_seq'::regclass);


--
-- Name: coe_projections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coe_projections (
    id integer NOT NULL,
    projection_name character varying(100) NOT NULL,
    financial_year character varying(10) NOT NULL,
    base_coe numeric(14,2),
    salary_increase_pct numeric(5,2),
    vacancy_fill_rate numeric(5,2),
    new_positions integer DEFAULT 0,
    projected_coe numeric(14,2),
    projected_headcount integer,
    assumptions text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.coe_projections OWNER TO postgres;

--
-- Name: coe_projections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coe_projections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coe_projections_id_seq OWNER TO postgres;

--
-- Name: coe_projections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coe_projections_id_seq OWNED BY public.coe_projections.id;


--
-- Name: competencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competencies (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(50) DEFAULT 'CORE'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.competencies OWNER TO postgres;

--
-- Name: competencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competencies_id_seq OWNER TO postgres;

--
-- Name: competencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competencies_id_seq OWNED BY public.competencies.id;


--
-- Name: competency_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.competency_levels (
    id integer NOT NULL,
    competency_id integer,
    level integer NOT NULL,
    description text
);


ALTER TABLE public.competency_levels OWNER TO postgres;

--
-- Name: competency_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.competency_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.competency_levels_id_seq OWNER TO postgres;

--
-- Name: competency_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.competency_levels_id_seq OWNED BY public.competency_levels.id;


--
-- Name: conditions_of_service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conditions_of_service (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    working_hours_per_day numeric(4,2) DEFAULT 8.00,
    working_days_per_week numeric(3,1) DEFAULT 5.0,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


ALTER TABLE public.conditions_of_service OWNER TO postgres;

--
-- Name: conditions_of_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conditions_of_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conditions_of_service_id_seq OWNER TO postgres;

--
-- Name: conditions_of_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conditions_of_service_id_seq OWNED BY public.conditions_of_service.id;


--
-- Name: conversion_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversion_logs (
    id integer NOT NULL,
    conversion_type character varying(100),
    file_name character varying(500),
    status character varying(50),
    total_rows integer DEFAULT 0,
    inserted_rows integer DEFAULT 0,
    skipped_rows integer DEFAULT 0,
    error_message text,
    details jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);

ALTER TABLE public.conversion_logs OWNER TO postgres;

CREATE SEQUENCE public.conversion_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.conversion_logs_id_seq OWNER TO postgres;

ALTER SEQUENCE public.conversion_logs_id_seq OWNED BY public.conversion_logs.id;

ALTER TABLE ONLY public.conversion_logs ALTER COLUMN id SET DEFAULT nextval('public.conversion_logs_id_seq'::regclass);

ALTER TABLE ONLY public.conversion_logs ADD CONSTRAINT conversion_logs_pkey PRIMARY KEY (id);


--
-- Name: cons_vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cons_vendors (
    id integer NOT NULL,
    code character varying(50),
    name character varying(200) NOT NULL,
    active_for_payroll boolean DEFAULT false,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cons_vendors OWNER TO postgres;

--
-- Name: cons_vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cons_vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cons_vendors_id_seq OWNER TO postgres;

--
-- Name: cons_vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cons_vendors_id_seq OWNED BY public.cons_vendors.id;


--
-- Name: councillor_upper_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.councillor_upper_limits (
    id integer NOT NULL,
    council_category character varying(10) NOT NULL,
    position_type character varying(50),
    annual_limit numeric(15,2) NOT NULL,
    effective_date date DEFAULT CURRENT_DATE,
    gazette_reference character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.councillor_upper_limits OWNER TO postgres;

--
-- Name: councillor_upper_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.councillor_upper_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.councillor_upper_limits_id_seq OWNER TO postgres;

--
-- Name: councillor_upper_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.councillor_upper_limits_id_seq OWNED BY public.councillor_upper_limits.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10),
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.countries_id_seq OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: delegations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delegations (
    id integer NOT NULL,
    from_user integer,
    to_user integer,
    start_date date,
    end_date date,
    module character varying(50),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.delegations OWNER TO postgres;

--
-- Name: delegations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delegations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delegations_id_seq OWNER TO postgres;

--
-- Name: delegations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delegations_id_seq OWNED BY public.delegations.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    scoa_function_id character varying(50),
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: disciplinary_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disciplinary_cases (
    id integer NOT NULL,
    employee_id integer,
    case_number character varying(30),
    charge_description text NOT NULL,
    offence_date date,
    charge_date date DEFAULT CURRENT_DATE,
    hearing_date timestamp without time zone,
    hearing_chairperson character varying(200),
    outcome character varying(30) DEFAULT 'PENDING'::character varying,
    sanction text,
    appeal_date date,
    appeal_outcome character varying(30),
    ccma_referral boolean DEFAULT false,
    ccma_case_number character varying(50),
    ccma_outcome character varying(30),
    status character varying(30) DEFAULT 'INITIATED'::character varying,
    created_by integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    hearing_minutes text,
    progressive_step character varying(30)
);


ALTER TABLE public.disciplinary_cases OWNER TO postgres;

--
-- Name: disciplinary_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disciplinary_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disciplinary_cases_id_seq OWNER TO postgres;

--
-- Name: disciplinary_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disciplinary_cases_id_seq OWNED BY public.disciplinary_cases.id;


--
-- Name: divisions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.divisions (
    id integer NOT NULL,
    department_id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    parent_id integer,
    scoa_function_id character varying(50),
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


ALTER TABLE public.divisions OWNER TO postgres;

--
-- Name: divisions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.divisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.divisions_id_seq OWNER TO postgres;

--
-- Name: divisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.divisions_id_seq OWNED BY public.divisions.id;



--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    document_type character varying(100),
    file_name character varying(500) NOT NULL,
    file_path character varying(1000),
    file_size integer,
    mime_type character varying(100),
    description text,
    uploaded_by integer,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: ee_occupational_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ee_occupational_levels (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    level_order integer
);


ALTER TABLE public.ee_occupational_levels OWNER TO postgres;

--
-- Name: ee_occupational_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ee_occupational_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ee_occupational_levels_id_seq OWNER TO postgres;

--
-- Name: ee_occupational_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ee_occupational_levels_id_seq OWNED BY public.ee_occupational_levels.id;


--
-- Name: ee_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ee_plans (
    id integer NOT NULL,
    plan_name character varying(200) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(30) DEFAULT 'DRAFT'::character varying,
    submitted_date date,
    created_by integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ee_plans OWNER TO postgres;

--
-- Name: ee_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ee_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ee_plans_id_seq OWNER TO postgres;

--
-- Name: ee_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ee_plans_id_seq OWNED BY public.ee_plans.id;


--
-- Name: ee_targets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ee_targets (
    id integer NOT NULL,
    plan_id integer,
    occupational_level character varying(50) NOT NULL,
    race character varying(30),
    gender character varying(10),
    target_count integer DEFAULT 0,
    current_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ee_targets OWNER TO postgres;

--
-- Name: ee_targets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ee_targets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ee_targets_id_seq OWNER TO postgres;

--
-- Name: ee_targets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ee_targets_id_seq OWNED BY public.ee_targets.id;


--
-- Name: eft_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eft_batches (
    id integer NOT NULL,
    run_id integer,
    batch_number character varying(50) NOT NULL,
    bank_format character varying(50) NOT NULL,
    total_amount numeric(18,2) NOT NULL,
    record_count integer NOT NULL,
    status character varying(20) DEFAULT 'GENERATED'::character varying,
    file_path character varying(1000),
    generated_at timestamp without time zone DEFAULT now(),
    generated_by integer,
    submitted_at timestamp without time zone,
    CONSTRAINT eft_batches_status_check CHECK (((status)::text = ANY (ARRAY[('GENERATED'::character varying)::text, ('SUBMITTED'::character varying)::text, ('PROCESSED'::character varying)::text, ('FAILED'::character varying)::text])))
);


ALTER TABLE public.eft_batches OWNER TO postgres;

--
-- Name: eft_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eft_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eft_batches_id_seq OWNER TO postgres;

--
-- Name: eft_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eft_batches_id_seq OWNED BY public.eft_batches.id;


--
-- Name: eft_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eft_records (
    id integer NOT NULL,
    batch_id integer NOT NULL,
    employee_id integer NOT NULL,
    bank_name character varying(100),
    branch_code character varying(20),
    account_number character varying(50),
    account_type character varying(20),
    account_holder character varying(200),
    amount numeric(18,2) NOT NULL,
    reference character varying(100),
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.eft_records OWNER TO postgres;

--
-- Name: eft_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eft_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eft_records_id_seq OWNER TO postgres;

--
-- Name: eft_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eft_records_id_seq OWNED BY public.eft_records.id;


--
-- Name: employee_attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    attendance_date date NOT NULL,
    clock_in timestamp without time zone,
    clock_out timestamp without time zone,
    hours_worked numeric(6,2),
    shift_id integer,
    status character varying(20) DEFAULT 'PRESENT'::character varying,
    source character varying(20) DEFAULT 'MANUAL'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT employee_attendance_source_check CHECK (((source)::text = ANY (ARRAY[('MANUAL'::character varying)::text, ('BIOMETRIC'::character varying)::text, ('IMPORT'::character varying)::text]))),
    CONSTRAINT employee_attendance_status_check CHECK (((status)::text = ANY (ARRAY[('PRESENT'::character varying)::text, ('ABSENT'::character varying)::text, ('LATE'::character varying)::text, ('LEAVE'::character varying)::text, ('HOLIDAY'::character varying)::text])))
);


ALTER TABLE public.employee_attendance OWNER TO postgres;

--
-- Name: employee_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_attendance_id_seq OWNER TO postgres;

--
-- Name: employee_attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_attendance_id_seq OWNED BY public.employee_attendance.id;


--
-- Name: employee_competencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_competencies (
    id integer NOT NULL,
    employee_id integer,
    competency_id integer,
    assessed_level integer,
    assessed_date date DEFAULT CURRENT_DATE,
    assessed_by integer
);


ALTER TABLE public.employee_competencies OWNER TO postgres;

--
-- Name: employee_competencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_competencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_competencies_id_seq OWNER TO postgres;

--
-- Name: employee_competencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_competencies_id_seq OWNED BY public.employee_competencies.id;


--
-- Name: employee_dependants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_dependants (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    surname character varying(100) NOT NULL,
    id_number character varying(20),
    date_of_birth date,
    relationship character varying(50),
    gender character varying(10),
    disability boolean DEFAULT false,
    contact_number character varying(20),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_dependants OWNER TO postgres;

--
-- Name: employee_dependants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_dependants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_dependants_id_seq OWNER TO postgres;

--
-- Name: employee_dependants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_dependants_id_seq OWNED BY public.employee_dependants.id;


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_documents (
    id integer NOT NULL,
    employee_id integer,
    document_name character varying(300) NOT NULL,
    document_type character varying(50) DEFAULT 'OTHER'::character varying,
    file_path character varying(500),
    file_size integer,
    mime_type character varying(100),
    uploaded_by integer DEFAULT 1,
    uploaded_at timestamp without time zone DEFAULT now(),
    expiry_date date,
    notes text,
    version_number integer DEFAULT 1,
    parent_document_id integer
);


ALTER TABLE public.employee_documents OWNER TO postgres;

--
-- Name: employee_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_documents_id_seq OWNER TO postgres;

--
-- Name: employee_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_documents_id_seq OWNED BY public.employee_documents.id;


--
-- Name: employee_emergency_contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_emergency_contacts (
    id integer NOT NULL,
    employee_id integer,
    contact_name character varying(200) NOT NULL,
    relationship character varying(50),
    phone_primary character varying(20),
    phone_secondary character varying(20),
    email character varying(200),
    address text,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_emergency_contacts OWNER TO postgres;

--
-- Name: employee_emergency_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_emergency_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_emergency_contacts_id_seq OWNER TO postgres;

--
-- Name: employee_emergency_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_emergency_contacts_id_seq OWNED BY public.employee_emergency_contacts.id;


--
-- Name: employee_group_life; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_group_life (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    benefit_id integer NOT NULL,
    cover_amount numeric(14,2),
    employer_contribution numeric(12,2),
    employee_contribution numeric(12,2),
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    beneficiary_name character varying(200),
    beneficiary_id_number character varying(20),
    beneficiary_relationship character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_group_life OWNER TO postgres;

--
-- Name: employee_group_life_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_group_life_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_group_life_id_seq OWNER TO postgres;

--
-- Name: employee_group_life_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_group_life_id_seq OWNED BY public.employee_group_life.id;


--
-- Name: employee_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_history (
    id integer NOT NULL,
    employee_id integer,
    field_name character varying(100) NOT NULL,
    old_value text,
    new_value text,
    changed_by integer DEFAULT 1,
    changed_at timestamp without time zone DEFAULT now(),
    change_type character varying(20) DEFAULT 'UPDATE'::character varying,
    notes text
);


ALTER TABLE public.employee_history OWNER TO postgres;

--
-- Name: employee_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_history_id_seq OWNER TO postgres;

--
-- Name: employee_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_history_id_seq OWNED BY public.employee_history.id;


--
-- Name: employee_leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_leave_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    balance_days numeric(8,2) DEFAULT 0,
    accrued_days numeric(8,2) DEFAULT 0,
    taken_days numeric(8,2) DEFAULT 0,
    forfeited_days numeric(8,2) DEFAULT 0,
    as_at_date date NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_leave_balances OWNER TO postgres;

--
-- Name: employee_leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_leave_balances_id_seq OWNER TO postgres;

--
-- Name: employee_leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_leave_balances_id_seq OWNED BY public.employee_leave_balances.id;


--
-- Name: employee_medical_aid; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_medical_aid (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    scheme_id integer NOT NULL,
    membership_number character varying(50),
    join_date date NOT NULL,
    termination_date date,
    is_current boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_medical_aid OWNER TO postgres;

--
-- Name: employee_medical_aid_dependants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_medical_aid_dependants (
    id integer NOT NULL,
    employee_medical_aid_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    surname character varying(100) NOT NULL,
    id_number character varying(20),
    date_of_birth date,
    gender character varying(10),
    dependant_type character varying(20),
    employer_contributes boolean DEFAULT false,
    start_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    student_dependant boolean DEFAULT false,
    disabled_dependant boolean DEFAULT false,
    CONSTRAINT employee_medical_aid_dependants_dependant_type_check CHECK (((dependant_type)::text = ANY (ARRAY[('SPOUSE'::character varying)::text, ('CHILD'::character varying)::text, ('ADULT'::character varying)::text, ('STUDENT'::character varying)::text, ('DISABLED'::character varying)::text])))
);


ALTER TABLE public.employee_medical_aid_dependants OWNER TO postgres;

--
-- Name: employee_medical_aid_dependants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_medical_aid_dependants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_medical_aid_dependants_id_seq OWNER TO postgres;

--
-- Name: employee_medical_aid_dependants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_medical_aid_dependants_id_seq OWNED BY public.employee_medical_aid_dependants.id;


--
-- Name: employee_medical_aid_extra_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_medical_aid_extra_transactions (
    id integer NOT NULL,
    employee_medical_aid_id integer NOT NULL,
    contribution_type character varying(30) NOT NULL,
    amount numeric(15,2) DEFAULT 0 NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    employer_contributes boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT employee_medical_aid_extra_transactions_contribution_type_check CHECK (((contribution_type)::text = ANY ((ARRAY['LATE_JOINER_FEE'::character varying, 'ARREAR_CONTRIBUTION'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE public.employee_medical_aid_extra_transactions OWNER TO postgres;

--
-- Name: employee_medical_aid_extra_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_medical_aid_extra_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_medical_aid_extra_transactions_id_seq OWNER TO postgres;

--
-- Name: employee_medical_aid_extra_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_medical_aid_extra_transactions_id_seq OWNED BY public.employee_medical_aid_extra_transactions.id;


--
-- Name: employee_medical_aid_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_medical_aid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_medical_aid_id_seq OWNER TO postgres;

--
-- Name: employee_medical_aid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_medical_aid_id_seq OWNED BY public.employee_medical_aid.id;


--
-- Name: employee_qualifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_qualifications (
    id integer NOT NULL,
    employee_id integer,
    qualification_name character varying(200) NOT NULL,
    institution character varying(200),
    year_obtained integer,
    nqf_level integer,
    qualification_type character varying(50),
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_qualifications OWNER TO postgres;

--
-- Name: employee_qualifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_qualifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_qualifications_id_seq OWNER TO postgres;

--
-- Name: employee_qualifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_qualifications_id_seq OWNED BY public.employee_qualifications.id;


--
-- Name: employee_retirement_funds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_retirement_funds (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    fund_type_id integer NOT NULL,
    fund_number character varying(50),
    join_date date NOT NULL,
    termination_date date,
    employee_amount numeric(18,2) DEFAULT 0,
    employer_amount numeric(18,2) DEFAULT 0,
    is_private boolean DEFAULT false,
    is_current boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    plan_name character varying(200),
    status character varying(20) DEFAULT 'ACTIVE'::character varying
);


ALTER TABLE public.employee_retirement_funds OWNER TO postgres;

--
-- Name: employee_retirement_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_retirement_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_retirement_funds_id_seq OWNER TO postgres;

--
-- Name: employee_retirement_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_retirement_funds_id_seq OWNED BY public.employee_retirement_funds.id;


--
-- Name: employee_salary_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_salary_transactions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);

CREATE TABLE public.employee_payslip_transactions (
    id integer NOT NULL,
    employee_salary_transaction_id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    captured_amount numeric(18,2) NOT NULL,
    entry_date date NOT NULL,
    enabled boolean DEFAULT true,
    period_id integer,
    every_month boolean DEFAULT false,
    processed boolean DEFAULT false,
    processed_on_period_id integer,
    reference_no varchar(50),
    included_in_package boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone,
    updated_by integer
);

CREATE SEQUENCE public.employee_payslip_transactions_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.employee_payslip_transactions_id_seq OWNED BY public.employee_payslip_transactions.id;
ALTER TABLE ONLY public.employee_payslip_transactions ALTER COLUMN id SET DEFAULT nextval('public.employee_payslip_transactions_id_seq'::regclass);


--
-- Name: employee_upper_limit_structure; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_upper_limit_structure (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    amount numeric(18,2) NOT NULL DEFAULT 0,
    included_in_package boolean NOT NULL DEFAULT true,
    captured_by integer,
    captured_at timestamp without time zone DEFAULT now(),
    modified_by integer,
    modified_at timestamp without time zone
);

ALTER TABLE public.employee_upper_limit_structure OWNER TO postgres;

CREATE SEQUENCE public.employee_upper_limit_structure_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.employee_upper_limit_structure_id_seq OWNER TO postgres;
ALTER SEQUENCE public.employee_upper_limit_structure_id_seq OWNED BY public.employee_upper_limit_structure.id;
ALTER TABLE ONLY public.employee_upper_limit_structure ALTER COLUMN id SET DEFAULT nextval('public.employee_upper_limit_structure_id_seq'::regclass);

ALTER TABLE ONLY public.employee_upper_limit_structure
    ADD CONSTRAINT employee_upper_limit_structure_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employee_upper_limit_structure
    ADD CONSTRAINT employee_upper_limit_structure_emp_head_unique UNIQUE (employee_id, salary_head_id);

ALTER TABLE ONLY public.employee_upper_limit_structure
    ADD CONSTRAINT employee_upper_limit_structure_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.employee_upper_limit_structure
    ADD CONSTRAINT employee_upper_limit_structure_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);

CREATE INDEX idx_upper_limit_structure_employee ON public.employee_upper_limit_structure USING btree (employee_id);
CREATE INDEX idx_upper_limit_structure_head ON public.employee_upper_limit_structure USING btree (salary_head_id);


ALTER TABLE public.employee_salary_transactions OWNER TO postgres;

--
-- Name: employee_salary_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_salary_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_salary_transactions_id_seq OWNER TO postgres;

--
-- Name: employee_salary_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_salary_transactions_id_seq OWNED BY public.employee_salary_transactions.id;


--
-- Name: employee_subtypes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_subtypes (
    id integer NOT NULL,
    employee_type_id integer,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    description text,
    start_date date DEFAULT '2021-01-01'::date,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    exclude_uif boolean DEFAULT false,
    exclude_sdl boolean DEFAULT false,
    enable_bonus boolean DEFAULT false
);


ALTER TABLE public.employee_subtypes OWNER TO postgres;

--
-- Name: employee_subtypes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_subtypes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_subtypes_id_seq OWNER TO postgres;

--
-- Name: employee_subtypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_subtypes_id_seq OWNED BY public.employee_subtypes.id;


--
-- Name: employee_terminations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_terminations (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    termination_type character varying(50) NOT NULL,
    reason character varying(500),
    last_date_of_service date NOT NULL,
    employed_full_month boolean DEFAULT false,
    position_status character varying(20) DEFAULT 'VACANT'::character varying,
    assets_returned boolean DEFAULT false,
    has_outstanding_transactions boolean DEFAULT false,
    tax_directive_required boolean DEFAULT false,
    finalised boolean DEFAULT false,
    finalised_by integer,
    finalised_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    notice_period_days integer,
    notice_pay numeric(15,2),
    severance_pay numeric(15,2),
    leave_payout numeric(15,2),
    pro_rata_bonus numeric(15,2),
    tax_directive_number character varying(50),
    tax_directive_amount numeric(15,2),
    lump_sum_amount numeric(15,2),
    final_pay_run_id integer,
    ui8_generated boolean DEFAULT false,
    exit_interview_notes text,
    re_employable boolean DEFAULT true,
    checklist jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT employee_terminations_termination_type_check CHECK (((termination_type)::text = ANY (ARRAY[('RESIGNATION'::character varying)::text, ('DISMISSAL'::character varying)::text, ('RETIREMENT'::character varying)::text, ('DECEASED'::character varying)::text, ('END_OF_CONTRACT'::character varying)::text, ('INCAPACITY'::character varying)::text, ('RETRENCHMENT'::character varying)::text])))
);


ALTER TABLE public.employee_terminations OWNER TO postgres;

--
-- Name: employee_terminations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_terminations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_terminations_id_seq OWNER TO postgres;

--
-- Name: employee_terminations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_terminations_id_seq OWNED BY public.employee_terminations.id;


--
-- Name: employee_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_types (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    enabled boolean DEFAULT true,
    working_hours_per_month numeric(6,2) DEFAULT 166.00,
    working_days_per_month numeric(5,2) DEFAULT 20.75
);


ALTER TABLE public.employee_types OWNER TO postgres;

--
-- Name: employee_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_types_id_seq OWNER TO postgres;

--
-- Name: employee_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_types_id_seq OWNED BY public.employee_types.id;


--
-- Name: ethnic_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ethnic_groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ethnic_groups OWNER TO postgres;

--
-- Name: ethnic_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ethnic_groups_id_seq
    AS integer
    START WITH 7
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ethnic_groups_id_seq OWNER TO postgres;

--
-- Name: ethnic_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ethnic_groups_id_seq OWNED BY public.ethnic_groups.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    id_number character varying(20) NOT NULL,
    title character varying(10),
    initials character varying(10),
    first_name character varying(100) NOT NULL,
    second_name character varying(100),
    surname character varying(100) NOT NULL,
    known_as character varying(100),
    date_of_birth date NOT NULL,
    gender character varying(10) NOT NULL,
    language character varying(50),
    marital_status character varying(20),
    dependants integer DEFAULT 0,
    passport_number character varying(50),
    passport_country character varying(50),
    email_address character varying(200),
    home_number character varying(50),
    work_number character varying(50),
    cell_number character varying(50),
    joining_date date NOT NULL,
    end_date date,
    income_tax_number character varying(50),
    exclude_uif boolean DEFAULT false,
    exclude_sdl boolean DEFAULT false,
    physical_address_1 character varying(200),
    physical_address_2 character varying(200),
    physical_postal_code character varying(20),
    physical_province character varying(50),
    physical_city character varying(100),
    postal_address_1 character varying(200),
    postal_address_2 character varying(200),
    postal_postal_code character varying(20),
    payment_type character varying(20) DEFAULT 'EFT'::character varying,
    bank_name character varying(100),
    bank_branch_code character varying(20),
    bank_account_number character varying(50),
    bank_account_type character varying(20),
    bank_account_holder character varying(100),
    position_id integer,
    employee_type_id integer,
    employee_subtype_id integer,
    condition_of_service_id integer,
    task_grade_id integer,
    current_notch integer,
    annual_salary numeric(18,2),
    monthly_salary numeric(18,2),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    race character varying(20),
    disability_status character varying(20) DEFAULT 'None'::character varying,
    nationality character varying(50) DEFAULT 'South African'::character varying,
    working_hours_per_day numeric(4,2) DEFAULT 8.00,
    working_days_per_week numeric(3,1) DEFAULT 5.0,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    postal_address text,
    photo_url character varying(500),
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(20),
    postal_city character varying(100),
    postal_province character varying(50),
    postal_code character varying(10),
    probation_end_date date,
    probation_status character varying(20) DEFAULT 'N/A'::character varying,
    previous_employer text,
    confirmation_date date,
    employee_category character varying(30),
    working_hours_per_week numeric(5,2) DEFAULT 45,
    is_councillor boolean DEFAULT false,
    employee_create_type character varying(20),
    division_id integer,
    job_profile_id integer,
    full_name character varying(200),
    nickname character varying(100),
    nature_of_person_code character varying(5),
    marital_date date,
    home_language character varying(50),
    ethnic_group character varying(50),
    is_youth boolean DEFAULT false,
    is_foreigner boolean DEFAULT false,
    has_disability boolean DEFAULT false,
    photo_path character varying(500),
    pay_point_id integer,
    payslip_pref_email boolean DEFAULT false,
    payslip_pref_sms boolean DEFAULT false,
    payslip_pref_print boolean DEFAULT true,
    physical_address_type character varying(20) DEFAULT 'Non Standard'::character varying,
    physical_country_id integer,
    physical_province_id integer,
    physical_town_id integer,
    physical_suburb_id integer,
    physical_unit_number character varying(50),
    physical_complex character varying(100),
    physical_street_number character varying(50),
    physical_address_3 character varying(200),
    physical_address_4 character varying(200),
    physical_address_5 character varying(20),
    postal_address_type character varying(20) DEFAULT 'Non Standard'::character varying,
    postal_same_as_physical boolean DEFAULT false,
    postal_country_id integer,
    postal_province_id integer,
    postal_town_id integer,
    postal_suburb_id integer,
    postal_unit_number character varying(50),
    postal_complex character varying(100),
    postal_street_number character varying(50),
    postal_address_3 character varying(200),
    postal_address_4 character varying(200),
    postal_address_5 character varying(20),
    payroll_cycle character varying(20) DEFAULT 'MONTHLY'::character varying,
    tax_method character varying(20) DEFAULT 'TAX_TABLES'::character varying,
    working_hours_per_month numeric(6,2),
    working_days_per_month numeric(5,2),
    allow_overtime boolean DEFAULT false,
    upper_limit_value_type character varying(10),
    payroll_cycle_id integer,
    salary_based_on character varying(30) DEFAULT 'CAPTURED_VALUE'::character varying,
    wage_rate numeric(12,4) DEFAULT 0,
    CONSTRAINT employees_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text]))),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('SUSPENDED'::character varying)::text, ('TERMINATED'::character varying)::text, ('DECEASED'::character varying)::text]))),
    CONSTRAINT employees_salary_based_on_check CHECK (((salary_based_on)::text = ANY (ARRAY['RATE_PER_HOUR'::text, 'RATE_PER_DAY'::text, 'CAPTURED_VALUE'::text, 'FIXED_RATE'::text])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: employment_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_categories (
    id integer NOT NULL,
    code character varying(20),
    name character varying(200) NOT NULL,
    description text,
    enabled boolean DEFAULT true
);


ALTER TABLE public.employment_categories OWNER TO postgres;

--
-- Name: employment_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_categories_id_seq OWNER TO postgres;

--
-- Name: employment_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_categories_id_seq OWNED BY public.employment_categories.id;


--
-- Name: employment_change_reason_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_change_reason_history (
    id integer NOT NULL,
    employment_change_reason_id integer,
    change_type character varying(20) NOT NULL,
    snapshot jsonb NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employment_change_reason_history OWNER TO postgres;

--
-- Name: employment_change_reason_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_change_reason_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_change_reason_history_id_seq OWNER TO postgres;

--
-- Name: employment_change_reason_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_change_reason_history_id_seq OWNED BY public.employment_change_reason_history.id;


--
-- Name: employment_change_reasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_change_reasons (
    id integer NOT NULL,
    employment_change_type_id integer NOT NULL,
    reason_description character varying(200) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_by integer
);


ALTER TABLE public.employment_change_reasons OWNER TO postgres;

--
-- Name: employment_change_reasons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_change_reasons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_change_reasons_id_seq OWNER TO postgres;

--
-- Name: employment_change_reasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_change_reasons_id_seq OWNED BY public.employment_change_reasons.id;


--
-- Name: employment_change_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_change_types (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employment_change_types OWNER TO postgres;

--
-- Name: employment_change_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_change_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_change_types_id_seq OWNER TO postgres;

--
-- Name: employment_change_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_change_types_id_seq OWNED BY public.employment_change_types.id;


--
-- Name: employment_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employment_codes (
    id integer NOT NULL,
    code character varying(20),
    name character varying(200) NOT NULL,
    description text,
    enabled boolean DEFAULT true
);


ALTER TABLE public.employment_codes OWNER TO postgres;

--
-- Name: employment_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employment_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employment_codes_id_seq OWNER TO postgres;

--
-- Name: employment_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employment_codes_id_seq OWNED BY public.employment_codes.id;


--
-- Name: feedback_360; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback_360 (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer,
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    initiated_by integer,
    initiated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    overall_score numeric(4,2),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feedback_360 OWNER TO postgres;

--
-- Name: feedback_360_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_360_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_360_id_seq OWNER TO postgres;

--
-- Name: feedback_360_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_360_id_seq OWNED BY public.feedback_360.id;


--
-- Name: feedback_360_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback_360_responses (
    id integer NOT NULL,
    feedback_id integer NOT NULL,
    reviewer_id integer,
    reviewer_type character varying(20) NOT NULL,
    rating_leadership numeric(3,1),
    rating_communication numeric(3,1),
    rating_teamwork numeric(3,1),
    rating_technical numeric(3,1),
    rating_initiative numeric(3,1),
    overall_rating numeric(3,1),
    strengths text,
    improvements text,
    comments text,
    submitted_at timestamp without time zone,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feedback_360_responses OWNER TO postgres;

--
-- Name: feedback_360_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_360_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_360_responses_id_seq OWNER TO postgres;

--
-- Name: feedback_360_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_360_responses_id_seq OWNED BY public.feedback_360_responses.id;


--
-- Name: flexi_time_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flexi_time_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    balance_hours numeric(8,2) DEFAULT 0,
    accrued_hours numeric(8,2) DEFAULT 0,
    used_hours numeric(8,2) DEFAULT 0,
    period_start date,
    period_end date,
    last_updated timestamp without time zone DEFAULT now()
);


ALTER TABLE public.flexi_time_balances OWNER TO postgres;

--
-- Name: flexi_time_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flexi_time_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flexi_time_balances_id_seq OWNER TO postgres;

--
-- Name: flexi_time_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flexi_time_balances_id_seq OWNED BY public.flexi_time_balances.id;


--
-- Name: genders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.genders (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.genders OWNER TO postgres;

--
-- Name: genders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genders_id_seq
    AS integer
    START WITH 3
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.genders_id_seq OWNER TO postgres;

--
-- Name: genders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genders_id_seq OWNED BY public.genders.id;


--
-- Name: grievances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grievances (
    id integer NOT NULL,
    employee_id integer,
    grievance_number character varying(30),
    description text NOT NULL,
    category character varying(50),
    date_submitted date DEFAULT CURRENT_DATE,
    investigator character varying(200),
    resolution text,
    status character varying(30) DEFAULT 'SUBMITTED'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    sla_deadline date,
    sla_status character varying(20) DEFAULT 'ON_TIME'::character varying
);


ALTER TABLE public.grievances OWNER TO postgres;

--
-- Name: grievances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grievances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grievances_id_seq OWNER TO postgres;

--
-- Name: grievances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grievances_id_seq OWNED BY public.grievances.id;


--
-- Name: group_life_benefits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_life_benefits (
    id integer NOT NULL,
    benefit_name character varying(100) NOT NULL,
    benefit_type character varying(30) NOT NULL,
    provider character varying(100),
    policy_number character varying(50),
    cover_multiple numeric(4,2),
    employer_contribution_pct numeric(5,2),
    employee_contribution_pct numeric(5,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.group_life_benefits OWNER TO postgres;

--
-- Name: group_life_benefits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.group_life_benefits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_life_benefits_id_seq OWNER TO postgres;

--
-- Name: group_life_benefits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.group_life_benefits_id_seq OWNED BY public.group_life_benefits.id;


--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    holiday_date date NOT NULL,
    recurring boolean DEFAULT true,
    enabled boolean DEFAULT true
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.holidays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holidays_id_seq OWNER TO postgres;

--
-- Name: holidays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.holidays_id_seq OWNED BY public.holidays.id;


--
-- Name: instalments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instalments (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    description character varying(500),
    total_amount numeric(18,2) NOT NULL,
    monthly_instalment numeric(18,2) NOT NULL,
    period_months integer NOT NULL,
    balance numeric(18,2) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    vendor_name character varying(200),
    reference_number character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT instalments_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('COMPLETED'::character varying)::text, ('SUSPENDED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.instalments OWNER TO postgres;

--
-- Name: instalments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instalments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instalments_id_seq OWNER TO postgres;

--
-- Name: instalments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instalments_id_seq OWNED BY public.instalments.id;


--
-- Name: interview_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_slots (
    id integer NOT NULL,
    vacancy_id integer NOT NULL,
    applicant_id integer NOT NULL,
    interview_date date NOT NULL,
    interview_time time without time zone,
    interview_type character varying(30) DEFAULT 'PANEL'::character varying,
    venue character varying(200),
    panel_members text,
    status character varying(20) DEFAULT 'SCHEDULED'::character varying,
    score numeric(5,2),
    feedback text,
    conducted_by character varying(200),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.interview_slots OWNER TO postgres;

--
-- Name: interview_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_slots_id_seq OWNER TO postgres;

--
-- Name: interview_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_slots_id_seq OWNED BY public.interview_slots.id;


--
-- Name: irp5_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.irp5_codes (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    description character varying(200) NOT NULL,
    taxable_percentage integer DEFAULT 0,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    type smallint DEFAULT 0,
    start_date date DEFAULT '1964-03-01',
    end_date date DEFAULT '9999-12-31'
);


ALTER TABLE public.irp5_codes OWNER TO postgres;

--
-- Name: irp5_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.irp5_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.irp5_codes_id_seq OWNER TO postgres;

--
-- Name: irp5_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.irp5_codes_id_seq OWNED BY public.irp5_codes.id;


--
-- Name: job_families; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_families (
    id integer NOT NULL,
    code character varying(20),
    name character varying(200) NOT NULL,
    description text,
    enabled boolean DEFAULT true
);


ALTER TABLE public.job_families OWNER TO postgres;

--
-- Name: job_families_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_families_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_families_id_seq OWNER TO postgres;

--
-- Name: job_families_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_families_id_seq OWNED BY public.job_families.id;


--
-- Name: job_profile_duties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_profile_duties (
    id integer NOT NULL,
    job_profile_id integer NOT NULL,
    duty_description text NOT NULL,
    sequence integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_profile_duties OWNER TO postgres;

--
-- Name: job_profile_duties_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_profile_duties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_profile_duties_id_seq OWNER TO postgres;

--
-- Name: job_profile_duties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_profile_duties_id_seq OWNED BY public.job_profile_duties.id;


--
-- Name: job_profile_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_profile_history (
    id integer NOT NULL,
    job_profile_id integer NOT NULL,
    job_title character varying(500),
    ofo_code character varying(50),
    occupation character varying(500),
    job_family_id integer,
    job_purpose text,
    job_responsibility text,
    reports_to_description text,
    who_reports_to_position text,
    who_are_peers text,
    qualifications_required text,
    experience_required text,
    knowledge text,
    skills text,
    liaison_internal text,
    internal_communication_purpose text,
    liaison_external text,
    external_communication_purpose text,
    own_decision_making text,
    superior_decision_making text,
    can_draft_policies boolean,
    can_escalate boolean,
    can_approve boolean,
    description text,
    contractual_agreements boolean,
    expenditure boolean,
    preceding_questions text,
    problem_solving text,
    financial text,
    planning text,
    short_term text,
    med_term text,
    long_term text,
    amount numeric(18,2),
    ofo_major_group_id integer,
    ofo_sub_major_group_id integer,
    ofo_minor_group_id integer,
    ofo_unit_group_id integer,
    ofo_occupation_id integer,
    specialist_id integer,
    core_function boolean,
    employment_category_id integer,
    employment_code_id integer,
    work_area_id integer,
    no_of_positions integer,
    office_bound boolean,
    employee_type_id integer,
    employee_subtype_id integer,
    task_grade_id integer,
    salary_transaction_group_id integer,
    shift_id integer,
    allow_overtime boolean,
    department_id integer,
    division_id integer,
    recommended_contractor_rate numeric(18,2),
    scoa_costing_percentage numeric(5,2),
    start_date date,
    end_date date,
    parent_id integer,
    reports_to_job_profile_id integer,
    status integer,
    job_description_code character varying(20),
    upper_limit_id integer,
    upper_limit_type character varying(10),
    performance_assessment boolean,
    is_active boolean,
    enabled boolean,
    condition_of_service_id integer,
    captured_at timestamp without time zone DEFAULT now(),
    captured_by integer,
    change_type character varying(20) DEFAULT 'UPDATE'::character varying
);


ALTER TABLE public.job_profile_history OWNER TO postgres;

--
-- Name: job_profile_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_profile_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_profile_history_id_seq OWNER TO postgres;

--
-- Name: job_profile_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_profile_history_id_seq OWNED BY public.job_profile_history.id;


--
-- Name: job_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_profiles (
    id integer NOT NULL,
    job_title character varying(500) NOT NULL,
    ofo_code character varying(50),
    occupation character varying(500),
    job_purpose text,
    job_responsibility text,
    reports_to_job_profile_id integer,
    qualifications_required text,
    experience_required text,
    knowledge text,
    skills text,
    can_draft_policies boolean DEFAULT false,
    contractual_agreements boolean DEFAULT false,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    task_grade_id integer,
    employee_type_id integer,
    employee_subtype_id integer,
    condition_of_service_id integer,
    salary_transaction_group_id integer,
    allow_overtime boolean DEFAULT false,
    performance_assessment boolean DEFAULT false,
    start_date date,
    end_date date,
    job_description_code character varying(20),
    upper_limit_id integer,
    upper_limit_type character varying(10) DEFAULT 'maximum'::character varying,
    job_family_id integer,
    ofo_major_group_id integer,
    ofo_sub_major_group_id integer,
    ofo_minor_group_id integer,
    ofo_unit_group_id integer,
    ofo_occupation_id integer,
    specialist_id integer,
    employment_category_id integer,
    employment_code_id integer,
    work_area_id integer,
    reports_to_description text,
    who_reports_to_position text,
    who_are_peers text,
    liaison_internal text,
    internal_communication_purpose text,
    liaison_external text,
    external_communication_purpose text,
    own_decision_making text,
    superior_decision_making text,
    can_escalate boolean DEFAULT false,
    can_approve boolean DEFAULT false,
    description text,
    expenditure boolean DEFAULT false,
    preceding_questions text,
    problem_solving text,
    financial text,
    planning text,
    short_term text,
    med_term text,
    long_term text,
    amount numeric(18,2),
    core_function boolean DEFAULT false,
    no_of_positions integer DEFAULT 0,
    office_bound boolean DEFAULT false,
    shift_id integer,
    department_id integer,
    division_id integer,
    recommended_contractor_rate numeric(18,2),
    scoa_costing_percentage numeric(5,2),
    parent_id integer,
    status integer DEFAULT 1,
    is_active boolean DEFAULT true
);


ALTER TABLE public.job_profiles OWNER TO postgres;

--
-- Name: job_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_profiles_id_seq OWNER TO postgres;

--
-- Name: job_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_profiles_id_seq OWNED BY public.job_profiles.id;


--
-- Name: leave_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_policies (
    id integer NOT NULL,
    leave_type_id integer,
    accrual_method character varying(30) DEFAULT 'ANNUAL'::character varying,
    accrual_amount numeric(8,2),
    max_balance numeric(8,2),
    carry_over_limit numeric(8,2),
    forfeiture_months integer,
    cycle_months integer DEFAULT 36,
    cycle_entitlement numeric(8,2),
    exclude_holidays boolean DEFAULT true,
    exclude_weekends boolean DEFAULT true,
    min_service_months integer DEFAULT 0,
    requires_medical_cert_after_days integer,
    consecutive_only boolean DEFAULT false,
    max_consecutive_months integer,
    gender_restriction character varying(10),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_policies OWNER TO postgres;

--
-- Name: leave_policies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_policies_id_seq OWNER TO postgres;

--
-- Name: leave_policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_policies_id_seq OWNED BY public.leave_policies.id;


--
-- Name: leave_schemes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_schemes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    employee_type_id integer,
    employee_subtype_id integer,
    condition_of_service_id integer,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_schemes OWNER TO postgres;

--
-- Name: leave_schemes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_schemes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_schemes_id_seq OWNER TO postgres;

--
-- Name: leave_schemes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_schemes_id_seq OWNED BY public.leave_schemes.id;


--
-- Name: leave_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_transactions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    absence_type_id integer,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days numeric(6,2) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    reason text,
    document_path character varying(500),
    approved_by integer,
    approved_at timestamp without time zone,
    captured_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT leave_transactions_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text, ('ESCALATED'::character varying)::text])))
);


ALTER TABLE public.leave_transactions OWNER TO postgres;

--
-- Name: leave_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_transactions_id_seq OWNER TO postgres;

--
-- Name: leave_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_transactions_id_seq OWNED BY public.leave_transactions.id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    leave_scheme_id integer,
    accrual_days numeric(6,2) DEFAULT 0,
    accrual_frequency character varying(20) DEFAULT 'MONTHLY'::character varying,
    max_accumulation numeric(8,2),
    carry_over_days numeric(6,2),
    cycle_start character varying(20) DEFAULT 'CALENDAR'::character varying,
    requires_document boolean DEFAULT false,
    paid boolean DEFAULT true,
    display_on_payslip boolean DEFAULT false,
    negative_balance_allowed boolean DEFAULT false,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT leave_types_accrual_frequency_check CHECK (((accrual_frequency)::text = ANY (ARRAY[('MONTHLY'::character varying)::text, ('ANNUAL'::character varying)::text, ('ONCE_OFF'::character varying)::text]))),
    CONSTRAINT leave_types_cycle_start_check CHECK (((cycle_start)::text = ANY (ARRAY[('FIXED'::character varying)::text, ('JOINING_DATE'::character varying)::text, ('CALENDAR'::character varying)::text])))
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_id_seq OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- Name: life_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.life_events (
    id integer NOT NULL,
    employee_id integer,
    event_type character varying(50) NOT NULL,
    event_date date NOT NULL,
    processed boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.life_events OWNER TO postgres;

--
-- Name: life_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.life_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.life_events_id_seq OWNER TO postgres;

--
-- Name: life_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.life_events_id_seq OWNED BY public.life_events.id;


--
-- Name: medical_aid_scheme_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_aid_scheme_history (
    id integer NOT NULL,
    scheme_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date NOT NULL,
    vendor_id integer,
    contribution_plan character varying(200),
    max_employer_contribution numeric(18,2) DEFAULT 0,
    employer_contribution_percentage numeric(5,2) DEFAULT 0,
    main_member_contribution numeric(18,2) DEFAULT 0,
    adult_dependant_contribution numeric(18,2) DEFAULT 0,
    child_dependant_contribution numeric(18,2) DEFAULT 0,
    min_monthly_income numeric(18,2) DEFAULT 0,
    max_monthly_income numeric(18,2) DEFAULT 99999999,
    max_child_dependants_only boolean DEFAULT false,
    student_dependent boolean DEFAULT false,
    disabled_dependent boolean DEFAULT false,
    max_dependants integer DEFAULT 0,
    change_type character varying(20) DEFAULT 'CREATE'::character varying NOT NULL,
    captured_at timestamp without time zone DEFAULT now(),
    captured_by integer
);


ALTER TABLE public.medical_aid_scheme_history OWNER TO postgres;

--
-- Name: medical_aid_scheme_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_aid_scheme_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_aid_scheme_history_id_seq OWNER TO postgres;

--
-- Name: medical_aid_scheme_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_aid_scheme_history_id_seq OWNED BY public.medical_aid_scheme_history.id;


--
-- Name: medical_aid_schemes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_aid_schemes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    scheme_type character varying(50),
    main_member_contribution numeric(18,2) DEFAULT 0,
    adult_dependant_contribution numeric(18,2) DEFAULT 0,
    child_dependant_contribution numeric(18,2) DEFAULT 0,
    employer_contribution numeric(18,2) DEFAULT 0,
    max_dependants integer,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    vendor_id integer,
    contribution_plan character varying(200),
    max_employer_contribution numeric(18,2) DEFAULT 0,
    employer_contribution_percentage numeric(5,2) DEFAULT 0,
    min_monthly_income numeric(18,2) DEFAULT 0,
    max_monthly_income numeric(18,2) DEFAULT 99999999,
    max_child_dependants_only boolean DEFAULT false,
    student_dependent boolean DEFAULT false,
    disabled_dependent boolean DEFAULT false
);


ALTER TABLE public.medical_aid_schemes OWNER TO postgres;

--
-- Name: medical_aid_schemes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_aid_schemes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_aid_schemes_id_seq OWNER TO postgres;

--
-- Name: medical_aid_schemes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_aid_schemes_id_seq OWNED BY public.medical_aid_schemes.id;


--
-- Name: medical_tax_credits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_tax_credits (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    main_member numeric(18,2) NOT NULL,
    first_dependant numeric(18,2) NOT NULL,
    additional_dependant numeric(18,2) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date
);


ALTER TABLE public.medical_tax_credits OWNER TO postgres;

--
-- Name: medical_tax_credits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_tax_credits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_tax_credits_id_seq OWNER TO postgres;

--
-- Name: medical_tax_credits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_tax_credits_id_seq OWNED BY public.medical_tax_credits.id;


--
-- Name: mscoa_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mscoa_items (
    id integer NOT NULL,
    item_code character varying(20) NOT NULL,
    description character varying(200) NOT NULL,
    category character varying(50) NOT NULL,
    parent_code character varying(20),
    item_type character varying(30) DEFAULT 'DETAIL'::character varying NOT NULL,
    balance_sheet boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.mscoa_items OWNER TO postgres;

--
-- Name: mscoa_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mscoa_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mscoa_items_id_seq OWNER TO postgres;

--
-- Name: mscoa_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mscoa_items_id_seq OWNED BY public.mscoa_items.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer DEFAULT 1,
    title character varying(200) NOT NULL,
    message text,
    type character varying(30) DEFAULT 'INFO'::character varying,
    category character varying(50),
    reference_type character varying(50),
    reference_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    notification_type character varying(20) DEFAULT 'SYSTEM'::character varying,
    action_url character varying(500),
    priority character varying(10) DEFAULT 'MEDIUM'::character varying
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: ofo_major_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_major_groups (
    id integer NOT NULL,
    code character varying(10),
    name character varying(200) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_major_groups OWNER TO postgres;

--
-- Name: ofo_minor_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_minor_groups (
    id integer NOT NULL,
    sub_major_group_id integer,
    code character varying(10),
    name character varying(200) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_minor_groups OWNER TO postgres;

--
-- Name: ofo_occupations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_occupations (
    id integer NOT NULL,
    unit_group_id integer,
    code character varying(10),
    name character varying(500) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_occupations OWNER TO postgres;

--
-- Name: ofo_specialists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_specialists (
    id integer NOT NULL,
    occupation_id integer,
    code character varying(10),
    name character varying(500) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_specialists OWNER TO postgres;

--
-- Name: ofo_sub_major_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_sub_major_groups (
    id integer NOT NULL,
    major_group_id integer,
    code character varying(10),
    name character varying(200) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_sub_major_groups OWNER TO postgres;

--
-- Name: ofo_unit_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ofo_unit_groups (
    id integer NOT NULL,
    minor_group_id integer,
    code character varying(10),
    name character varying(200) NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.ofo_unit_groups OWNER TO postgres;

--
-- Name: onboarding_checklists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_checklists (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    template_name character varying(100) DEFAULT 'Standard Onboarding'::character varying,
    status character varying(20) DEFAULT 'IN_PROGRESS'::character varying,
    start_date date DEFAULT CURRENT_DATE,
    completion_date date,
    assigned_to integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.onboarding_checklists OWNER TO postgres;

--
-- Name: onboarding_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboarding_checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_checklists_id_seq OWNER TO postgres;

--
-- Name: onboarding_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboarding_checklists_id_seq OWNED BY public.onboarding_checklists.id;


--
-- Name: onboarding_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_items (
    id integer NOT NULL,
    checklist_id integer NOT NULL,
    item_name character varying(200) NOT NULL,
    category character varying(50),
    is_completed boolean DEFAULT false,
    completed_by integer,
    completed_at timestamp without time zone,
    due_date date,
    notes text,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.onboarding_items OWNER TO postgres;

--
-- Name: onboarding_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onboarding_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onboarding_items_id_seq OWNER TO postgres;

--
-- Name: onboarding_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onboarding_items_id_seq OWNED BY public.onboarding_items.id;


--
-- Name: overtime_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.overtime_transactions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    overtime_date date NOT NULL,
    hours numeric(6,2) NOT NULL,
    rate_multiplier numeric(4,2) DEFAULT 1.5,
    amount numeric(18,2),
    status character varying(20) DEFAULT 'PENDING'::character varying,
    reason text,
    approved_by integer,
    approved_at timestamp without time zone,
    period_id integer,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT overtime_transactions_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('PAID'::character varying)::text])))
);


ALTER TABLE public.overtime_transactions OWNER TO postgres;

--
-- Name: overtime_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.overtime_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.overtime_transactions_id_seq OWNER TO postgres;

--
-- Name: overtime_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.overtime_transactions_id_seq OWNED BY public.overtime_transactions.id;


--
-- Name: pay_point_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pay_point_departments (
    id integer NOT NULL,
    pay_point_id integer NOT NULL,
    department_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pay_point_departments OWNER TO postgres;

--
-- Name: pay_point_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pay_point_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_point_departments_id_seq OWNER TO postgres;

--
-- Name: pay_point_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pay_point_departments_id_seq OWNED BY public.pay_point_departments.id;


--
-- Name: pay_points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pay_points (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    address character varying(500),
    location character varying(500),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pay_points OWNER TO postgres;

--
-- Name: pay_points_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pay_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_points_id_seq OWNER TO postgres;

--
-- Name: pay_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pay_points_id_seq OWNED BY public.pay_points.id;


--
-- Name: payment_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_batches (
    id integer NOT NULL,
    run_id integer,
    batch_type character varying(30) NOT NULL,
    vendor_name character varying(255),
    salary_head_id integer,
    total_amount numeric(15,2) DEFAULT 0,
    employee_count integer DEFAULT 0,
    status character varying(30) DEFAULT 'PENDING_REVIEW'::character varying,
    payment_method character varying(30) DEFAULT 'MANUAL_EFT'::character varying,
    eft_file_generated boolean DEFAULT false,
    h2h_reference character varying(100),
    h2h_submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    authorized_by integer,
    authorized_at timestamp without time zone
);


ALTER TABLE public.payment_batches OWNER TO postgres;

--
-- Name: payment_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_batches_id_seq OWNER TO postgres;

--
-- Name: payment_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_batches_id_seq OWNED BY public.payment_batches.id;


--
-- Name: payroll_constants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_constants (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value character varying(500) NOT NULL,
    description text,
    effective_date date NOT NULL,
    expiry_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payroll_constants OWNER TO postgres;

--
-- Name: payroll_constants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_constants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_constants_id_seq OWNER TO postgres;

--
-- Name: payroll_constants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_constants_id_seq OWNED BY public.payroll_constants.id;


--
-- Name: payroll_cycles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_cycles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    cycle_type character varying(20) NOT NULL,
    periods_per_year integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    start_date date,
    description text,
    active_payroll_year character varying(20),
    CONSTRAINT payroll_cycles_cycle_type_check CHECK (((cycle_type)::text = ANY (ARRAY[('MONTHLY'::character varying)::text, ('BI_WEEKLY'::character varying)::text, ('WEEKLY'::character varying)::text, ('FORTNIGHTLY'::character varying)::text])))
);


ALTER TABLE public.payroll_cycles OWNER TO postgres;

--
-- Name: payroll_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_cycles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_cycles_id_seq OWNER TO postgres;

--
-- Name: payroll_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_cycles_id_seq OWNED BY public.payroll_cycles.id;


--
-- Name: payroll_gl_journals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_gl_journals (
    id integer NOT NULL,
    payroll_run_id integer NOT NULL,
    journal_date date NOT NULL,
    scoa_item_id character varying(20),
    scoa_fund_id character varying(20),
    scoa_function_id character varying(20),
    scoa_project_id character varying(20),
    debit_amount numeric(14,2) DEFAULT 0,
    credit_amount numeric(14,2) DEFAULT 0,
    description character varying(200),
    reference character varying(50),
    posted_by integer,
    posted_at timestamp without time zone DEFAULT now(),
    scoa_region_id character varying(20),
    scoa_costing_id character varying(20),
    scoa_msc_id character varying(20)
);


ALTER TABLE public.payroll_gl_journals OWNER TO postgres;

--
-- Name: payroll_gl_journals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_gl_journals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_gl_journals_id_seq OWNER TO postgres;

--
-- Name: payroll_gl_journals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_gl_journals_id_seq OWNED BY public.payroll_gl_journals.id;


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_periods (
    id integer NOT NULL,
    cycle_id integer NOT NULL,
    period_number integer NOT NULL,
    tax_year integer NOT NULL,
    tax_period integer NOT NULL,
    financial_year character varying(20),
    financial_period integer,
    start_date date NOT NULL,
    end_date date NOT NULL,
    payment_date date,
    processing_month character varying(50),
    cycle_mode_id integer NOT NULL DEFAULT 1,
    status character varying(20) DEFAULT 'OPEN'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payroll_periods_status_check CHECK (((status)::text = ANY (ARRAY[('OPEN'::character varying)::text, ('TRIAL'::character varying)::text, ('LOCKED'::character varying)::text, ('APPROVED'::character varying)::text, ('FINALISED'::character varying)::text, ('CLOSED'::character varying)::text])))
);


ALTER TABLE public.payroll_periods OWNER TO postgres;

--
-- Name: payroll_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_periods_id_seq OWNER TO postgres;

--
-- Name: payroll_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_periods_id_seq OWNED BY public.payroll_periods.id;


--
-- Name: payroll_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_results (
    id integer NOT NULL,
    run_id integer NOT NULL,
    period_id integer NOT NULL,
    cycle_id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer,
    department_id integer,
    division_id integer,
    transaction_type character varying(30) NOT NULL,
    irp5_code character varying(20),
    amount numeric(18,2) DEFAULT 0 NOT NULL,
    calculation_detail text,
    tax_period integer,
    tax_year integer,
    head_code character varying(50),
    scoa_item_id character varying(50),
    scoa_fund_id character varying(50),
    scoa_function_id character varying(50),
    scoa_project_id character varying(50),
    scoa_region_id character varying(50),
    scoa_costing_id character varying(50),
    contra_scoa_item_id character varying(50),
    contra_scoa_fund_id character varying(50),
    contra_scoa_function_id character varying(50),
    contra_scoa_project_id character varying(50),
    contra_scoa_region_id character varying(50),
    contra_scoa_costing_id character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    scoa_msc_id character varying(50),
    contra_scoa_msc_id character varying(50),
    debit_scoa_id character varying(100),
    credit_scoa_id character varying(100),
    contra_division_id integer,
    debit_plan_project_item_id character varying(50),
    credit_plan_project_item_id character varying(50)
);


ALTER TABLE public.payroll_results OWNER TO postgres;

--
-- Name: payroll_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_results_id_seq OWNER TO postgres;

--
-- Name: payroll_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_results_id_seq OWNED BY public.payroll_results.id;


--
-- Name: payroll_run_errors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_run_errors (
    id integer NOT NULL,
    run_id integer NOT NULL,
    employee_id integer,
    error_type character varying(100) NOT NULL,
    error_message text NOT NULL,
    severity character varying(20) DEFAULT 'ERROR'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payroll_run_errors_severity_check CHECK (((severity)::text = ANY (ARRAY[('WARNING'::character varying)::text, ('ERROR'::character varying)::text, ('CRITICAL'::character varying)::text])))
);


ALTER TABLE public.payroll_run_errors OWNER TO postgres;

--
-- Name: payroll_run_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_run_errors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_run_errors_id_seq OWNER TO postgres;

--
-- Name: payroll_run_errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_run_errors_id_seq OWNED BY public.payroll_run_errors.id;


--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_runs (
    id integer NOT NULL,
    period_id integer NOT NULL,
    cycle_id integer NOT NULL,
    run_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    run_date timestamp without time zone DEFAULT now(),
    payment_date date,
    employee_count integer DEFAULT 0,
    total_earnings numeric(18,2) DEFAULT 0,
    total_deductions numeric(18,2) DEFAULT 0,
    total_company_contributions numeric(18,2) DEFAULT 0,
    total_nett numeric(18,2) DEFAULT 0,
    total_paye numeric(18,2) DEFAULT 0,
    total_uif numeric(18,2) DEFAULT 0,
    total_sdl numeric(18,2) DEFAULT 0,
    errors_count integer DEFAULT 0,
    run_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    locked_at timestamp without time zone,
    locked_by integer,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    eti_amount numeric(15,2) DEFAULT 0,
    CONSTRAINT payroll_runs_run_type_check CHECK (((run_type)::text = ANY (ARRAY[('TRIAL'::character varying)::text, ('FINAL'::character varying)::text, ('ADHOC_TRIAL'::character varying)::text, ('ADHOC_FINAL'::character varying)::text]))),
    CONSTRAINT payroll_runs_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('PROCESSING'::character varying)::text, ('COMPLETED'::character varying)::text, ('FAILED'::character varying)::text, ('LOCKED'::character varying)::text, ('APPROVED'::character varying)::text, ('VOIDED'::character varying)::text, ('REVERSED'::character varying)::text])))
);


ALTER TABLE public.payroll_runs OWNER TO postgres;

--
-- Name: payroll_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_runs_id_seq OWNER TO postgres;

--
-- Name: payroll_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_runs_id_seq OWNED BY public.payroll_runs.id;


--
-- Name: performance_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_goals (
    id integer NOT NULL,
    goal_name character varying(200) NOT NULL,
    description text,
    financial_year character varying(10),
    department_id integer,
    weight numeric(5,2),
    target_value character varying(100),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    parent_goal_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_goals OWNER TO postgres;

--
-- Name: performance_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_goals_id_seq OWNER TO postgres;

--
-- Name: performance_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_goals_id_seq OWNED BY public.performance_goals.id;


--
-- Name: performance_indicators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_indicators (
    id integer NOT NULL,
    period_id integer NOT NULL,
    employee_id integer NOT NULL,
    kpa character varying(200) NOT NULL,
    kpi character varying(500) NOT NULL,
    unit_of_measure character varying(100),
    baseline character varying(200),
    annual_target character varying(200),
    q1_target character varying(200),
    q2_target character varying(200),
    q3_target character varying(200),
    q4_target character varying(200),
    q1_actual character varying(200),
    q2_actual character varying(200),
    q3_actual character varying(200),
    q4_actual character varying(200),
    weighting numeric(5,2) DEFAULT 0,
    score numeric(5,2),
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_indicators OWNER TO postgres;

--
-- Name: performance_indicators_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_indicators_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_indicators_id_seq OWNER TO postgres;

--
-- Name: performance_indicators_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_indicators_id_seq OWNED BY public.performance_indicators.id;


--
-- Name: performance_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_periods (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    financial_year character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_periods OWNER TO postgres;

--
-- Name: performance_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_periods_id_seq OWNER TO postgres;

--
-- Name: performance_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_periods_id_seq OWNED BY public.performance_periods.id;


--
-- Name: performance_review_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_review_items (
    id integer NOT NULL,
    review_id integer,
    indicator_id integer,
    weight numeric(5,2),
    target character varying(200),
    actual character varying(200),
    score numeric(4,2),
    comments text
);


ALTER TABLE public.performance_review_items OWNER TO postgres;

--
-- Name: performance_review_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_review_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_review_items_id_seq OWNER TO postgres;

--
-- Name: performance_review_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_review_items_id_seq OWNED BY public.performance_review_items.id;


--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_reviews (
    id integer NOT NULL,
    employee_id integer,
    period_id integer,
    reviewer_id integer,
    overall_score numeric(4,2),
    rating character varying(20),
    status character varying(20) DEFAULT 'DRAFT'::character varying,
    comments text,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.performance_reviews OWNER TO postgres;

--
-- Name: performance_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.performance_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.performance_reviews_id_seq OWNER TO postgres;

--
-- Name: performance_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.performance_reviews_id_seq OWNED BY public.performance_reviews.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    role_id integer,
    module character varying(50) NOT NULL,
    action character varying(30) NOT NULL,
    field_restrictions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO postgres;

--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: pip_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pip_milestones (
    id integer NOT NULL,
    pip_id integer NOT NULL,
    description text NOT NULL,
    target_date date,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    progress_notes text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pip_milestones OWNER TO postgres;

--
-- Name: pip_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pip_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pip_milestones_id_seq OWNER TO postgres;

--
-- Name: pip_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pip_milestones_id_seq OWNED BY public.pip_milestones.id;


--
-- Name: pip_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pip_plans (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    initiated_by integer,
    reason text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    review_date date,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    outcome character varying(30),
    outcome_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pip_plans OWNER TO postgres;

--
-- Name: pip_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pip_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pip_plans_id_seq OWNER TO postgres;

--
-- Name: pip_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pip_plans_id_seq OWNED BY public.pip_plans.id;


--
-- Name: position_competencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_competencies (
    id integer NOT NULL,
    position_id integer,
    competency_id integer,
    required_level integer DEFAULT 3
);


ALTER TABLE public.position_competencies OWNER TO postgres;

--
-- Name: position_competencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.position_competencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.position_competencies_id_seq OWNER TO postgres;

--
-- Name: position_competencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.position_competencies_id_seq OWNED BY public.position_competencies.id;


--
-- Name: position_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_history (
    id integer NOT NULL,
    position_id integer NOT NULL,
    field_name character varying(50) NOT NULL,
    old_value text,
    new_value text,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT now(),
    change_reason text
);


ALTER TABLE public.position_history OWNER TO postgres;

--
-- Name: position_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.position_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.position_history_id_seq OWNER TO postgres;

--
-- Name: position_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.position_history_id_seq OWNED BY public.position_history.id;


--
-- Name: position_history_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.position_history_snapshots (
    id integer NOT NULL,
    position_id integer NOT NULL,
    position_code character varying(50),
    title character varying(200),
    department_id integer,
    division_id integer,
    job_profile_id integer,
    parent_position_id integer,
    task_grade_id integer,
    employee_type_id integer,
    employee_subtype_id integer,
    condition_of_service_id integer,
    status character varying(20),
    is_hod boolean,
    funded boolean,
    capacity numeric(5,2),
    scoa_item_id character varying(50),
    scoa_fund_id character varying(50),
    scoa_function_id character varying(50),
    scoa_function_meta jsonb,
    scoa_project_id character varying(50),
    scoa_region_id character varying(50),
    scoa_costing_id character varying(50),
    start_date date,
    end_date date,
    enabled boolean,
    unique_identifier character varying(100),
    hierarchy_code character varying(100),
    advert_ref character varying(100),
    circular_number character varying(50),
    non_employee boolean,
    performance_assessment boolean,
    lock_fields boolean,
    salary_transaction_group_id integer,
    manager_type integer,
    occupational_level_id integer,
    incumbent_employee_id integer,
    incumbent_name character varying(200),
    incumbent_code character varying(50),
    grade_name character varying(100),
    job_profile_title character varying(200),
    captured_at timestamp without time zone DEFAULT now(),
    captured_by integer,
    change_type character varying(20)
);


ALTER TABLE public.position_history_snapshots OWNER TO postgres;

--
-- Name: position_history_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.position_history_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.position_history_snapshots_id_seq OWNER TO postgres;

--
-- Name: position_history_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.position_history_snapshots_id_seq OWNED BY public.position_history_snapshots.id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    position_code character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    department_id integer NOT NULL,
    division_id integer,
    job_profile_id integer,
    parent_position_id integer,
    task_grade_id integer,
    employee_type_id integer,
    employee_subtype_id integer,
    condition_of_service_id integer,
    status character varying(20) DEFAULT 'VACANT'::character varying,
    is_hod boolean DEFAULT false,
    funded boolean DEFAULT true,
    capacity numeric(5,2) DEFAULT 1.00,
    scoa_item_id character varying(50),
    scoa_fund_id character varying(50),
    scoa_function_id character varying(50),
    scoa_project_id character varying(50),
    scoa_region_id character varying(50),
    scoa_costing_id character varying(50),
    start_date date,
    end_date date DEFAULT '9999-12-31'::date,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    occupational_level_id integer,
    unique_identifier character varying(100),
    hierarchy_code character varying(100),
    advert_ref character varying(100),
    circular_number character varying(50),
    non_employee boolean DEFAULT false,
    performance_assessment boolean DEFAULT false,
    lock_fields boolean DEFAULT false,
    salary_transaction_group_id integer,
    manager_type integer DEFAULT 0,
    upper_limit_value_type character varying(10) DEFAULT NULL::character varying,
    CONSTRAINT positions_status_check CHECK (((status)::text = ANY (ARRAY[('VACANT'::character varying)::text, ('FILLED'::character varying)::text, ('FROZEN'::character varying)::text, ('ABOLISHED'::character varying)::text])))
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.positions_id_seq OWNER TO postgres;

--
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- Name: provinces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.provinces (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10),
    country_id integer,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.provinces OWNER TO postgres;

--
-- Name: provinces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.provinces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provinces_id_seq OWNER TO postgres;

--
-- Name: provinces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.provinces_id_seq OWNED BY public.provinces.id;


--
-- Name: recruitment_applicants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_applicants (
    id integer NOT NULL,
    vacancy_id integer,
    first_name character varying(100) NOT NULL,
    surname character varying(100) NOT NULL,
    id_number character varying(13),
    email character varying(200),
    phone character varying(20),
    qualifications text,
    experience_years integer,
    status character varying(30) DEFAULT 'APPLIED'::character varying,
    interview_date timestamp without time zone,
    interview_score numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.recruitment_applicants OWNER TO postgres;

--
-- Name: recruitment_applicants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_applicants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_applicants_id_seq OWNER TO postgres;

--
-- Name: recruitment_applicants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_applicants_id_seq OWNED BY public.recruitment_applicants.id;


--
-- Name: recruitment_vacancies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_vacancies (
    id integer NOT NULL,
    position_id integer,
    requisition_number character varying(30),
    title character varying(200) NOT NULL,
    department_id integer,
    closing_date date,
    status character varying(30) DEFAULT 'DRAFT'::character varying,
    salary_range_min numeric(15,2),
    salary_range_max numeric(15,2),
    requirements text,
    duties text,
    created_by integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.recruitment_vacancies OWNER TO postgres;

--
-- Name: recruitment_vacancies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_vacancies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_vacancies_id_seq OWNER TO postgres;

--
-- Name: recruitment_vacancies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_vacancies_id_seq OWNED BY public.recruitment_vacancies.id;


--
-- Name: retirement_fund_salary_heads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.retirement_fund_salary_heads (
    id integer NOT NULL,
    retirement_fund_type_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retirement_fund_salary_heads OWNER TO postgres;

--
-- Name: retirement_fund_salary_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.retirement_fund_salary_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retirement_fund_salary_heads_id_seq OWNER TO postgres;

--
-- Name: retirement_fund_salary_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.retirement_fund_salary_heads_id_seq OWNED BY public.retirement_fund_salary_heads.id;


--
-- Name: retirement_fund_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.retirement_fund_types (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    fund_type character varying(20) NOT NULL,
    fund_administrator character varying(200),
    employee_contribution_rate numeric(8,4),
    employer_contribution_rate numeric(8,4),
    fund_category_factor numeric(8,4),
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    vendor_id integer,
    plan_name character varying(200),
    clearance_no character varying(100),
    fund_sub_type character varying(50),
    employer_contribution_type character varying(20) DEFAULT 'PERCENTAGE'::character varying,
    employer_contribution_value numeric(18,4) DEFAULT 0,
    employer_max_value numeric(18,2) DEFAULT 0,
    employee_contribution_value numeric(18,4) DEFAULT 0,
    employee_max_value numeric(18,2) DEFAULT 0,
    employee_pro_rata boolean DEFAULT false,
    CONSTRAINT retirement_fund_types_fund_type_check CHECK (((fund_type)::text = ANY (ARRAY[('PENSION'::character varying)::text, ('PROVIDENT'::character varying)::text, ('RETIREMENT_ANNUITY'::character varying)::text])))
);


ALTER TABLE public.retirement_fund_types OWNER TO postgres;

--
-- Name: retirement_fund_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.retirement_fund_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retirement_fund_types_id_seq OWNER TO postgres;

--
-- Name: retirement_fund_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.retirement_fund_types_id_seq OWNED BY public.retirement_fund_types.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]'::jsonb,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: const_salary_calculation_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.const_salary_calculation_methods (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.const_salary_calculation_methods OWNER TO postgres;

--
-- Name: const_salary_calculation_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.const_salary_calculation_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.const_salary_calculation_methods_id_seq OWNER TO postgres;

--
-- Name: const_salary_calculation_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.const_salary_calculation_methods_id_seq OWNED BY public.const_salary_calculation_methods.id;


--
-- Name: salary_head_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_head_history (
    id integer NOT NULL,
    salary_head_id integer,
    change_type character varying(20) NOT NULL,
    snapshot jsonb NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.salary_head_history OWNER TO postgres;

--
-- Name: salary_head_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_head_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_head_history_id_seq OWNER TO postgres;

--
-- Name: salary_head_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_head_history_id_seq OWNED BY public.salary_head_history.id;


--
-- Name: salary_heads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_heads (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(256) NOT NULL,
    transaction_type character varying(30) NOT NULL,
    calculation_method character varying(30) DEFAULT 'USER_INPUT'::character varying,
    formula text,
    irp5_code character varying(20),
    sars_code character varying(20),
    scoa_debit_item character varying(50),
    scoa_credit_item character varying(50),
    taxable boolean DEFAULT true,
    affects_uif boolean DEFAULT false,
    affects_sdl boolean DEFAULT false,
    show_on_payslip boolean DEFAULT true,
    priority integer DEFAULT 0,
    vendor_id integer,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    employer_contribution numeric(5,2) DEFAULT 0,
    employee_contribution numeric(5,2) DEFAULT 0,
    condition_of_service_id integer,
    employee_type_filter character varying(100),
    employee_subtype_filter character varying(100),
    pro_rated boolean DEFAULT false,
    round_calculation character varying(20),
    round_digits integer DEFAULT 2,
    scoa_debit_fund character varying(30),
    scoa_debit_function character varying(30),
    scoa_debit_project character varying(30),
    scoa_debit_region character varying(30),
    scoa_debit_costing character varying(30),
    scoa_debit_msc character varying(30),
    scoa_credit_fund character varying(30),
    scoa_credit_function character varying(30),
    scoa_credit_project character varying(30),
    scoa_credit_region character varying(30),
    scoa_credit_costing character varying(30),
    scoa_credit_msc character varying(30),
    description character varying(500),
    retirement_funding_income boolean DEFAULT false,
    group_on_payslip_by_irp5 boolean DEFAULT false,
    is_system boolean DEFAULT false,
    CONSTRAINT salary_heads_calculation_method_check CHECK (((calculation_method)::text = ANY (ARRAY[('SYSTEM_CALCULATE'::character varying)::text, ('USER_INPUT'::character varying)::text, ('FIXED'::character varying)::text, ('PERCENTAGE_OF_BASIC'::character varying)::text]))),
    CONSTRAINT salary_heads_transaction_type_check CHECK (((transaction_type)::text = ANY (ARRAY[('EARNING'::character varying)::text, ('DEDUCTION'::character varying)::text, ('COMPANY_CONTRIBUTION'::character varying)::text, ('FRINGE_BENEFIT'::character varying)::text])))
);


ALTER TABLE public.salary_heads OWNER TO postgres;

CREATE TABLE public.payroll_gl_items (
    id integer NOT NULL,
    salary_head_id integer NOT NULL,
    fin_year character varying(20),
    start_date date DEFAULT '1900-01-01'::date,
    end_date date DEFAULT '9999-12-31'::date,
    journal_entry_only boolean DEFAULT false,
    scoa_project_id character varying(50),
    suspense_scoa_item_id character varying(50),
    suspense_scoa_item_credit_id character varying(50),
    scoa_item_id_permanent_staff character varying(255),
    scoa_item_id_permanent_staff_meta jsonb,
    earning_not_applicable_post_retirement boolean DEFAULT false,
    scoa_item_id_post_retirement character varying(255),
    scoa_item_id_post_retirement_meta jsonb,
    override_project boolean DEFAULT false,
    plan_project_item_id character varying(255),
    scoa_item_id character varying(255),
    scoa_item_id_meta jsonb,
    vendor_id integer,
    vendor_scoa_project_id character varying(50),
    vendor_scoa_id character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);

ALTER TABLE public.payroll_gl_items OWNER TO postgres;
CREATE SEQUENCE public.payroll_gl_items_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.payroll_gl_items_id_seq OWNED BY public.payroll_gl_items.id;
ALTER TABLE ONLY public.payroll_gl_items ALTER COLUMN id SET DEFAULT nextval('public.payroll_gl_items_id_seq'::regclass);
ALTER TABLE ONLY public.payroll_gl_items ADD CONSTRAINT payroll_gl_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payroll_gl_items ADD CONSTRAINT uq_payroll_gl_items_salary_head UNIQUE (salary_head_id);
ALTER TABLE ONLY public.payroll_gl_items ADD CONSTRAINT payroll_gl_items_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);

CREATE TABLE public.payroll_gl_history (
    id integer NOT NULL,
    gl_item_id integer,
    salary_head_id integer NOT NULL,
    action character varying(20) NOT NULL DEFAULT 'UPDATE'::character varying,
    fin_year character varying(20),
    start_date date,
    end_date date,
    journal_entry_only boolean,
    scoa_project_id character varying(50),
    suspense_scoa_item_id character varying(50),
    suspense_scoa_item_credit_id character varying(50),
    scoa_item_id_permanent_staff character varying(255),
    scoa_item_id_permanent_staff_meta jsonb,
    earning_not_applicable_post_retirement boolean,
    scoa_item_id_post_retirement character varying(255),
    scoa_item_id_post_retirement_meta jsonb,
    override_project boolean,
    plan_project_item_id character varying(255),
    scoa_item_id character varying(255),
    scoa_item_id_meta jsonb,
    vendor_id integer,
    vendor_scoa_project_id character varying(50),
    vendor_scoa_id character varying(50),
    changed_at timestamp without time zone DEFAULT now(),
    changed_by integer
);

ALTER TABLE public.payroll_gl_history OWNER TO postgres;
CREATE SEQUENCE public.payroll_gl_history_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.payroll_gl_history_id_seq OWNED BY public.payroll_gl_history.id;
ALTER TABLE ONLY public.payroll_gl_history ALTER COLUMN id SET DEFAULT nextval('public.payroll_gl_history_id_seq'::regclass);
ALTER TABLE ONLY public.payroll_gl_history ADD CONSTRAINT payroll_gl_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payroll_gl_history ADD CONSTRAINT payroll_gl_history_gl_item_id_fkey FOREIGN KEY (gl_item_id) REFERENCES public.payroll_gl_items(id);

--
-- Name: salary_heads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_heads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_heads_id_seq OWNER TO postgres;

--
-- Name: salary_heads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_heads_id_seq OWNED BY public.salary_heads.id;


--
-- Name: salary_increases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_increases (
    id integer NOT NULL,
    bargaining_council_id integer,
    task_grade_id integer,
    increase_percentage numeric(8,4) NOT NULL,
    effective_date date NOT NULL,
    approved boolean DEFAULT false,
    approved_by integer,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    old_salary numeric(15,2),
    new_salary numeric(15,2),
    old_notch integer,
    new_notch integer,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    increase_type character varying(20),
    increase_value numeric(15,4),
    employee_id integer
);


ALTER TABLE public.salary_increases OWNER TO postgres;

--
-- Name: salary_increases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_increases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_increases_id_seq OWNER TO postgres;

--
-- Name: salary_increases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_increases_id_seq OWNED BY public.salary_increases.id;


--
-- Name: salary_transaction_group_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_transaction_group_items (
    id integer NOT NULL,
    group_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    included_in_package boolean DEFAULT true
);


ALTER TABLE public.salary_transaction_group_items OWNER TO postgres;

--
-- Name: salary_transaction_group_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_transaction_group_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_transaction_group_items_id_seq OWNER TO postgres;

--
-- Name: salary_transaction_group_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_transaction_group_items_id_seq OWNED BY public.salary_transaction_group_items.id;


--
-- Name: salary_transaction_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_transaction_groups (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


ALTER TABLE public.salary_transaction_groups OWNER TO postgres;

--
-- Name: salary_transaction_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_transaction_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_transaction_groups_id_seq OWNER TO postgres;

--
-- Name: salary_transaction_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_transaction_groups_id_seq OWNED BY public.salary_transaction_groups.id;


--
-- Name: const_salary_transaction_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.const_salary_transaction_types (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.const_salary_transaction_types OWNER TO postgres;

--
-- Name: const_salary_transaction_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.const_salary_transaction_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.const_salary_transaction_types_id_seq OWNER TO postgres;

--
-- Name: const_salary_transaction_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.const_salary_transaction_types_id_seq OWNED BY public.const_salary_transaction_types.id;


--
-- Name: salary_upper_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_upper_limits (
    id integer NOT NULL,
    employee_type_id integer,
    employee_subtype_id integer,
    job_profile_id integer,
    municipal_grading character varying(10) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date NOT NULL,
    minimum_value numeric(15,2) DEFAULT 0 NOT NULL,
    midpoint_value numeric(15,2) DEFAULT 0 NOT NULL,
    maximum_value numeric(15,2) DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);


ALTER TABLE public.salary_upper_limits OWNER TO postgres;

--
-- Name: salary_upper_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_upper_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_upper_limits_id_seq OWNER TO postgres;

--
-- Name: salary_upper_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_upper_limits_id_seq OWNED BY public.salary_upper_limits.id;


--
-- Name: scoa_costings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_costings (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_costings OWNER TO postgres;

--
-- Name: scoa_costings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_costings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_costings_id_seq OWNER TO postgres;

--
-- Name: scoa_costings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_costings_id_seq OWNED BY public.scoa_costings.id;


--
-- Name: scoa_functions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_functions (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_functions OWNER TO postgres;

--
-- Name: scoa_functions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_functions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_functions_id_seq OWNER TO postgres;

--
-- Name: scoa_functions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_functions_id_seq OWNED BY public.scoa_functions.id;


--
-- Name: scoa_funds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_funds (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_funds OWNER TO postgres;

--
-- Name: scoa_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_funds_id_seq OWNER TO postgres;

--
-- Name: scoa_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_funds_id_seq OWNED BY public.scoa_funds.id;


--
-- Name: scoa_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_items (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    segment_type character varying(20) DEFAULT 'EXPENDITURE'::character varying NOT NULL,
    vat_applicable boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_items OWNER TO postgres;

--
-- Name: scoa_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_items_id_seq OWNER TO postgres;

--
-- Name: scoa_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_items_id_seq OWNED BY public.scoa_items.id;


--
-- Name: scoa_msc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_msc (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_msc OWNER TO postgres;

--
-- Name: scoa_msc_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_msc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_msc_id_seq OWNER TO postgres;

--
-- Name: scoa_msc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_msc_id_seq OWNED BY public.scoa_msc.id;


--
-- Name: scoa_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_projects (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_projects OWNER TO postgres;

--
-- Name: scoa_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_projects_id_seq OWNER TO postgres;

--
-- Name: scoa_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_projects_id_seq OWNED BY public.scoa_projects.id;


--
-- Name: scoa_regions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scoa_regions (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    description character varying(500) NOT NULL,
    parent_code character varying(30),
    level integer DEFAULT 1 NOT NULL,
    posting_level boolean DEFAULT false,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0
);


ALTER TABLE public.scoa_regions OWNER TO postgres;

--
-- Name: scoa_regions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoa_regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoa_regions_id_seq OWNER TO postgres;

--
-- Name: scoa_regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoa_regions_id_seq OWNED BY public.scoa_regions.id;


--
-- Name: sdl_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sdl_settings (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    rate numeric(8,4) NOT NULL,
    threshold numeric(18,2) DEFAULT 500000 NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date
);


ALTER TABLE public.sdl_settings OWNER TO postgres;

--
-- Name: sdl_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sdl_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sdl_settings_id_seq OWNER TO postgres;

--
-- Name: sdl_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sdl_settings_id_seq OWNED BY public.sdl_settings.id;


--
-- Name: shift_rosters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_rosters (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    shift_id integer,
    roster_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    status character varying(20) DEFAULT 'SCHEDULED'::character varying,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shift_rosters OWNER TO postgres;

--
-- Name: shift_rosters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_rosters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_rosters_id_seq OWNER TO postgres;

--
-- Name: shift_rosters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_rosters_id_seq OWNED BY public.shift_rosters.id;


--
-- Name: shift_rotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_rotations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(500),
    rotation_days integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.shift_rotations OWNER TO postgres;

--
-- Name: shift_rotations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_rotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_rotations_id_seq OWNER TO postgres;

--
-- Name: shift_rotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_rotations_id_seq OWNED BY public.shift_rotations.id;


--
-- Name: suburbs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suburbs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10),
    town_id integer,
    postal_code character varying(10),
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.suburbs OWNER TO postgres;

--
-- Name: suburbs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suburbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suburbs_id_seq OWNER TO postgres;

--
-- Name: suburbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suburbs_id_seq OWNED BY public.suburbs.id;


--
-- Name: succession_pools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.succession_pools (
    id integer NOT NULL,
    position_id integer,
    employee_id integer,
    readiness character varying(30) DEFAULT '1_2_YEARS'::character varying,
    development_notes text,
    last_assessed date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.succession_pools OWNER TO postgres;

--
-- Name: succession_pools_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.succession_pools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.succession_pools_id_seq OWNER TO postgres;

--
-- Name: succession_pools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.succession_pools_id_seq OWNED BY public.succession_pools.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value text,
    category character varying(50),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: task_grade_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_grade_history (
    id integer NOT NULL,
    task_grade_id integer,
    change_type character varying(20) NOT NULL,
    snapshot jsonb NOT NULL,
    changed_at timestamp without time zone DEFAULT now(),
    changed_by integer
);


ALTER TABLE public.task_grade_history OWNER TO postgres;

--
-- Name: task_grade_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_grade_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_grade_history_id_seq OWNER TO postgres;

--
-- Name: task_grade_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_grade_history_id_seq OWNED BY public.task_grade_history.id;


--
-- Name: task_grade_notch_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_grade_notch_history (
    id integer NOT NULL,
    notch_id integer,
    task_grade_id integer,
    change_type character varying(20) NOT NULL,
    snapshot jsonb NOT NULL,
    changed_at timestamp without time zone DEFAULT now(),
    changed_by integer
);


ALTER TABLE public.task_grade_notch_history OWNER TO postgres;

--
-- Name: task_grade_notch_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_grade_notch_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_grade_notch_history_id_seq OWNER TO postgres;

--
-- Name: task_grade_notch_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_grade_notch_history_id_seq OWNED BY public.task_grade_notch_history.id;


--
-- Name: task_grade_notches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_grade_notches (
    id integer NOT NULL,
    task_grade_id integer NOT NULL,
    notch_number integer NOT NULL,
    min_salary numeric(18,2) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    max_salary numeric(18,2) NOT NULL
);


ALTER TABLE public.task_grade_notches OWNER TO postgres;

--
-- Name: task_grade_notches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_grade_notches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_grade_notches_id_seq OWNER TO postgres;

--
-- Name: task_grade_notches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_grade_notches_id_seq OWNED BY public.task_grade_notches.id;


--
-- Name: task_grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_grades (
    id integer NOT NULL,
    grade_code character varying(20) NOT NULL,
    grade_name character varying(100) NOT NULL,
    min_salary numeric(18,2),
    max_salary numeric(18,2),
    notch_count integer DEFAULT 0,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer,
    is_legacy boolean DEFAULT false,
    to_phase_out boolean DEFAULT false,
    yearly_notch_level_increase numeric(10,2) DEFAULT 0,
    use_employment_date boolean DEFAULT true,
    use_specific_notch_increase_date boolean DEFAULT false,
    exclude_from_yearly_increase boolean DEFAULT false,
    task_skill_level_id integer,
    notch_increase_month integer
);


ALTER TABLE public.task_grades OWNER TO postgres;

--
-- Name: task_grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_grades_id_seq OWNER TO postgres;

--
-- Name: task_grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_grades_id_seq OWNED BY public.task_grades.id;


--
-- Name: task_skill_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.const_task_skill_levels (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    description character varying(100) NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.const_task_skill_levels OWNER TO postgres;

--
-- Name: const_task_skill_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.const_task_skill_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.const_task_skill_levels_id_seq OWNER TO postgres;

--
-- Name: const_task_skill_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.const_task_skill_levels_id_seq OWNED BY public.const_task_skill_levels.id;


--
-- Name: tax_brackets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_brackets (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    bracket_number integer NOT NULL,
    min_income numeric(18,2) NOT NULL,
    max_income numeric(18,2),
    base_tax numeric(18,2) DEFAULT 0 NOT NULL,
    rate numeric(8,4) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date
);


ALTER TABLE public.tax_brackets OWNER TO postgres;

--
-- Name: tax_brackets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tax_brackets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_brackets_id_seq OWNER TO postgres;

--
-- Name: tax_brackets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_brackets_id_seq OWNED BY public.tax_brackets.id;


--
-- Name: tax_rebates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_rebates (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    rebate_type character varying(20) NOT NULL,
    amount numeric(18,2) NOT NULL,
    age_threshold integer,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    CONSTRAINT tax_rebates_rebate_type_check CHECK (((rebate_type)::text = ANY (ARRAY[('PRIMARY'::character varying)::text, ('SECONDARY'::character varying)::text, ('TERTIARY'::character varying)::text])))
);


ALTER TABLE public.tax_rebates OWNER TO postgres;

--
-- Name: tax_rebates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tax_rebates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_rebates_id_seq OWNER TO postgres;

--
-- Name: tax_rebates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_rebates_id_seq OWNED BY public.tax_rebates.id;


--
-- Name: tax_thresholds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tax_thresholds (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    threshold_type character varying(50) NOT NULL,
    age_group character varying(20),
    amount numeric(18,2) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date
);


ALTER TABLE public.tax_thresholds OWNER TO postgres;

--
-- Name: tax_thresholds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tax_thresholds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tax_thresholds_id_seq OWNER TO postgres;

--
-- Name: tax_thresholds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tax_thresholds_id_seq OWNED BY public.tax_thresholds.id;


--
-- Name: third_party_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.third_party_payments (
    id integer NOT NULL,
    run_id integer,
    period_id integer,
    vendor_name character varying(200) NOT NULL,
    vendor_reference character varying(100),
    salary_head_id integer,
    total_amount numeric(18,2) NOT NULL,
    employee_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    payment_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.third_party_payments OWNER TO postgres;

--
-- Name: third_party_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.third_party_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.third_party_payments_id_seq OWNER TO postgres;

--
-- Name: third_party_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.third_party_payments_id_seq OWNED BY public.third_party_payments.id;


--
-- Name: towns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.towns (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10),
    province_id integer,
    postal_code character varying(10),
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.towns OWNER TO postgres;

--
-- Name: towns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.towns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.towns_id_seq OWNER TO postgres;

--
-- Name: towns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.towns_id_seq OWNED BY public.towns.id;


--
-- Name: trade_classification_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.const_trade_classification_activities (
    id integer NOT NULL,
    group_id integer NOT NULL,
    code character varying(10) NOT NULL,
    description text NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.const_trade_classification_activities OWNER TO postgres;

--
-- Name: const_trade_classification_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.const_trade_classification_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.const_trade_classification_activities_id_seq OWNER TO postgres;

--
-- Name: const_trade_classification_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.const_trade_classification_activities_id_seq OWNED BY public.const_trade_classification_activities.id;


--
-- Name: const_trade_classification_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.const_trade_classification_groups (
    id integer NOT NULL,
    code character varying(10) NOT NULL,
    description text NOT NULL,
    enabled boolean DEFAULT true
);


ALTER TABLE public.const_trade_classification_groups OWNER TO postgres;

--
-- Name: const_trade_classification_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.const_trade_classification_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.const_trade_classification_groups_id_seq OWNER TO postgres;

--
-- Name: const_trade_classification_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.const_trade_classification_groups_id_seq OWNED BY public.const_trade_classification_groups.id;


--
-- Name: trade_unions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trade_unions (
    id integer NOT NULL,
    representative character varying(200) NOT NULL,
    vendor_id integer,
    contribution_type character varying(10) DEFAULT '%'::character varying NOT NULL,
    contribution_value numeric(18,4) DEFAULT 0 NOT NULL,
    maximum_value numeric(18,2) DEFAULT 0,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT trade_unions_contribution_type_check CHECK (((contribution_type)::text = ANY ((ARRAY['%'::character varying, 'Fixed'::character varying])::text[])))
);


ALTER TABLE public.trade_unions OWNER TO postgres;

--
-- Name: trade_unions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trade_unions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trade_unions_id_seq OWNER TO postgres;

--
-- Name: trade_unions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trade_unions_id_seq OWNED BY public.trade_unions.id;


--
-- Name: employee_unions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_unions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    trade_union_id integer NOT NULL,
    join_date date NOT NULL,
    termination_date date DEFAULT '9999-12-31'::date,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.employee_unions OWNER TO postgres;

CREATE SEQUENCE public.employee_unions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.employee_unions_id_seq OWNER TO postgres;

ALTER SEQUENCE public.employee_unions_id_seq OWNED BY public.employee_unions.id;

ALTER TABLE ONLY public.employee_unions ALTER COLUMN id SET DEFAULT nextval('public.employee_unions_id_seq'::regclass);

ALTER TABLE ONLY public.employee_unions
    ADD CONSTRAINT employee_unions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employee_unions
    ADD CONSTRAINT employee_unions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE ONLY public.employee_unions
    ADD CONSTRAINT employee_unions_trade_union_id_fkey FOREIGN KEY (trade_union_id) REFERENCES public.trade_unions(id);

CREATE INDEX idx_employee_unions_employee_id ON public.employee_unions USING btree (employee_id);

CREATE INDEX idx_employee_unions_trade_union_id ON public.employee_unions USING btree (trade_union_id);


--
-- Name: salary_head_formulas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_head_formulas (
    id integer NOT NULL,
    salary_head_id integer NOT NULL,
    rule_name character varying(200) NOT NULL,
    formula text NOT NULL,
    condition_of_service_id integer,
    employee_type_id integer,
    employee_subtype_id integer,
    priority integer DEFAULT 0,
    round_method character varying(20) DEFAULT 'ROUND'::character varying,
    round_digits integer DEFAULT 2,
    pro_rata boolean DEFAULT false,
    enabled boolean DEFAULT true,
    start_date date,
    end_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by integer
);

ALTER TABLE public.salary_head_formulas OWNER TO postgres;

CREATE SEQUENCE public.salary_head_formulas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.salary_head_formulas_id_seq OWNER TO postgres;
ALTER SEQUENCE public.salary_head_formulas_id_seq OWNED BY public.salary_head_formulas.id;
ALTER TABLE ONLY public.salary_head_formulas ALTER COLUMN id SET DEFAULT nextval('public.salary_head_formulas_id_seq'::regclass);

ALTER TABLE ONLY public.salary_head_formulas
    ADD CONSTRAINT salary_head_formulas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.salary_head_formulas
    ADD CONSTRAINT salary_head_formulas_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id) ON DELETE CASCADE;

CREATE INDEX idx_shf_salary_head ON public.salary_head_formulas USING btree (salary_head_id);
CREATE INDEX idx_shf_cos ON public.salary_head_formulas USING btree (condition_of_service_id);


--
-- Name: titles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.titles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    abbreviation character varying(20) NOT NULL,
    enabled boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.titles OWNER TO postgres;

--
-- Name: titles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.titles_id_seq
    AS integer
    START WITH 16
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.titles_id_seq OWNER TO postgres;

--
-- Name: titles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.titles_id_seq OWNED BY public.titles.id;


--
-- Name: training_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_courses (
    id integer NOT NULL,
    course_code character varying(30),
    title character varying(200) NOT NULL,
    provider character varying(200),
    duration_days integer,
    cost numeric(12,2),
    category character varying(50),
    nqf_level integer,
    credits integer,
    seta character varying(50) DEFAULT 'LGSETA'::character varying,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.training_courses OWNER TO postgres;

--
-- Name: training_courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_courses_id_seq OWNER TO postgres;

--
-- Name: training_courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_courses_id_seq OWNED BY public.training_courses.id;


--
-- Name: training_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_records (
    id integer NOT NULL,
    employee_id integer,
    course_id integer,
    start_date date,
    end_date date,
    status character varying(30) DEFAULT 'ENROLLED'::character varying,
    result character varying(30),
    score numeric(5,2),
    cost_actual numeric(12,2),
    certificate_number character varying(100),
    wsp_year integer,
    created_at timestamp without time zone DEFAULT now(),
    nqf_level integer,
    saqa_id character varying(20),
    cpd_points numeric(6,2)
);


ALTER TABLE public.training_records OWNER TO postgres;

--
-- Name: training_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_records_id_seq OWNER TO postgres;

--
-- Name: training_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_records_id_seq OWNED BY public.training_records.id;


--
-- Name: uif_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uif_settings (
    id integer NOT NULL,
    tax_year integer NOT NULL,
    employee_rate numeric(8,4) NOT NULL,
    employer_rate numeric(8,4) NOT NULL,
    ceiling numeric(18,2) NOT NULL,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date
);


ALTER TABLE public.uif_settings OWNER TO postgres;

--
-- Name: uif_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uif_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uif_settings_id_seq OWNER TO postgres;

--
-- Name: uif_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uif_settings_id_seq OWNED BY public.uif_settings.id;


--
-- Name: upper_limit_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.upper_limit_history (
    id integer NOT NULL,
    upper_limit_id integer NOT NULL,
    change_type character varying(10) NOT NULL,
    snapshot jsonb NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.upper_limit_history OWNER TO postgres;

--
-- Name: upper_limit_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.upper_limit_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upper_limit_history_id_seq OWNER TO postgres;

--
-- Name: upper_limit_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.upper_limit_history_id_seq OWNED BY public.upper_limit_history.id;


--
-- Name: upper_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.upper_limits (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    salary_head_id integer,
    limit_type character varying(20),
    limit_value numeric(18,2) NOT NULL,
    employee_type_id integer,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT upper_limits_limit_type_check CHECK (((limit_type)::text = ANY (ARRAY[('AMOUNT'::character varying)::text, ('PERCENTAGE'::character varying)::text])))
);


ALTER TABLE public.upper_limits OWNER TO postgres;

--
-- Name: upper_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.upper_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.upper_limits_id_seq OWNER TO postgres;

--
-- Name: upper_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.upper_limits_id_seq OWNED BY public.upper_limits.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer,
    role_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(200) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    surname character varying(100) NOT NULL,
    role_id integer,
    employee_id integer,
    department_id integer,
    division_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: work_areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_areas (
    id integer NOT NULL,
    code character varying(20),
    name character varying(200) NOT NULL,
    department_id integer,
    enabled boolean DEFAULT true,
    employment_code_id integer
);


ALTER TABLE public.work_areas OWNER TO postgres;

--
-- Name: work_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_areas_id_seq OWNER TO postgres;

--
-- Name: work_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_areas_id_seq OWNED BY public.work_areas.id;


--
-- Name: work_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_shifts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    short_description character varying(200),
    shift_start_time time without time zone NOT NULL,
    shift_end_time time without time zone NOT NULL,
    total_hours numeric(4,2),
    has_break boolean DEFAULT false,
    break_duration_minutes integer DEFAULT 0,
    enabled boolean DEFAULT true,
    start_date date NOT NULL,
    end_date date DEFAULT '9999-12-31'::date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.work_shifts OWNER TO postgres;

--
-- Name: work_shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_shifts_id_seq OWNER TO postgres;

--
-- Name: work_shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_shifts_id_seq OWNED BY public.work_shifts.id;


--
-- Name: workflow_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_definitions (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    entity_type character varying(100) NOT NULL,
    steps jsonb NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    module character varying(50)
);


ALTER TABLE public.workflow_definitions OWNER TO postgres;

--
-- Name: workflow_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_definitions_id_seq OWNER TO postgres;

--
-- Name: workflow_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_definitions_id_seq OWNED BY public.workflow_definitions.id;


--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_instances (
    id integer NOT NULL,
    definition_id integer NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer NOT NULL,
    current_step integer DEFAULT 1,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    initiated_by integer,
    initiated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    comments text,
    CONSTRAINT workflow_instances_status_check CHECK (((status)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('IN_PROGRESS'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


ALTER TABLE public.workflow_instances OWNER TO postgres;

--
-- Name: workflow_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_instances_id_seq OWNER TO postgres;

--
-- Name: workflow_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_instances_id_seq OWNED BY public.workflow_instances.id;


--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workflow_steps (
    id integer NOT NULL,
    instance_id integer,
    step_number integer,
    assigned_to integer,
    assigned_role character varying(50),
    action character varying(30),
    status character varying(20) DEFAULT 'PENDING'::character varying,
    actioned_by integer,
    actioned_at timestamp without time zone,
    comments text,
    sla_deadline timestamp without time zone,
    escalated boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.workflow_steps OWNER TO postgres;

--
-- Name: workflow_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workflow_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workflow_steps_id_seq OWNER TO postgres;

--
-- Name: workflow_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workflow_steps_id_seq OWNED BY public.workflow_steps.id;


--
-- Name: wage_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wage_transactions (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    salary_head_id integer NOT NULL,
    period_id integer NOT NULL,
    cycle_id integer NOT NULL,
    hours numeric(8,2) DEFAULT 0,
    days numeric(6,2) DEFAULT 0,
    rate numeric(12,4) DEFAULT 0,
    amount numeric(14,2) DEFAULT 0 NOT NULL,
    reference_no character varying(100),
    notes text,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    approved_by integer,
    approved_at timestamp without time zone,
    processed_at timestamp without time zone,
    created_by integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT wage_transactions_status_check CHECK (((status)::text = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'PROCESSED'::text])))
);


ALTER TABLE public.wage_transactions OWNER TO postgres;

--
-- Name: wage_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wage_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wage_transactions_id_seq OWNER TO postgres;

ALTER SEQUENCE public.wage_transactions_id_seq OWNED BY public.wage_transactions.id;

ALTER TABLE ONLY public.wage_transactions ALTER COLUMN id SET DEFAULT nextval('public.wage_transactions_id_seq'::regclass);

ALTER TABLE ONLY public.wage_transactions ADD CONSTRAINT wage_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.wage_transactions ADD CONSTRAINT wage_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE ONLY public.wage_transactions ADD CONSTRAINT wage_transactions_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);

ALTER TABLE ONLY public.wage_transactions ADD CONSTRAINT wage_transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);

ALTER TABLE ONLY public.wage_transactions ADD CONSTRAINT wage_transactions_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.payroll_cycles(id);

CREATE INDEX idx_wt_employee ON public.wage_transactions USING btree (employee_id);

CREATE INDEX idx_wt_period ON public.wage_transactions USING btree (period_id);

CREATE INDEX idx_wt_status ON public.wage_transactions USING btree (status);

CREATE INDEX idx_wt_cycle ON public.wage_transactions USING btree (cycle_id);


--
-- Name: absence_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absence_types ALTER COLUMN id SET DEFAULT nextval('public.absence_types_id_seq'::regclass);


--
-- Name: applicant_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_scores ALTER COLUMN id SET DEFAULT nextval('public.applicant_scores_id_seq'::regclass);


--
-- Name: approval_workflows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_workflows ALTER COLUMN id SET DEFAULT nextval('public.approval_workflows_id_seq'::regclass);


--
-- Name: arrears id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arrears ALTER COLUMN id SET DEFAULT nextval('public.arrears_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: bargaining_councils id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bargaining_councils ALTER COLUMN id SET DEFAULT nextval('public.bargaining_councils_id_seq'::regclass);


--
-- Name: benefit_rate_tables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_rate_tables ALTER COLUMN id SET DEFAULT nextval('public.benefit_rate_tables_id_seq'::regclass);


--
-- Name: claim_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_rates ALTER COLUMN id SET DEFAULT nextval('public.claim_rates_id_seq'::regclass);


--
-- Name: claims id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims ALTER COLUMN id SET DEFAULT nextval('public.claims_id_seq'::regclass);


--
-- Name: coe_projections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coe_projections ALTER COLUMN id SET DEFAULT nextval('public.coe_projections_id_seq'::regclass);


--
-- Name: competencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencies ALTER COLUMN id SET DEFAULT nextval('public.competencies_id_seq'::regclass);


--
-- Name: competency_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competency_levels ALTER COLUMN id SET DEFAULT nextval('public.competency_levels_id_seq'::regclass);


--
-- Name: conditions_of_service id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conditions_of_service ALTER COLUMN id SET DEFAULT nextval('public.conditions_of_service_id_seq'::regclass);


--
-- Name: cons_vendors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cons_vendors ALTER COLUMN id SET DEFAULT nextval('public.cons_vendors_id_seq'::regclass);


--
-- Name: councillor_upper_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.councillor_upper_limits ALTER COLUMN id SET DEFAULT nextval('public.councillor_upper_limits_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: delegations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations ALTER COLUMN id SET DEFAULT nextval('public.delegations_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: disciplinary_cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinary_cases ALTER COLUMN id SET DEFAULT nextval('public.disciplinary_cases_id_seq'::regclass);


--
-- Name: divisions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.divisions ALTER COLUMN id SET DEFAULT nextval('public.divisions_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: ee_occupational_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_occupational_levels ALTER COLUMN id SET DEFAULT nextval('public.ee_occupational_levels_id_seq'::regclass);


--
-- Name: ee_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_plans ALTER COLUMN id SET DEFAULT nextval('public.ee_plans_id_seq'::regclass);


--
-- Name: ee_targets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_targets ALTER COLUMN id SET DEFAULT nextval('public.ee_targets_id_seq'::regclass);


--
-- Name: eft_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_batches ALTER COLUMN id SET DEFAULT nextval('public.eft_batches_id_seq'::regclass);


--
-- Name: eft_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_records ALTER COLUMN id SET DEFAULT nextval('public.eft_records_id_seq'::regclass);


--
-- Name: employee_attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_attendance ALTER COLUMN id SET DEFAULT nextval('public.employee_attendance_id_seq'::regclass);


--
-- Name: employee_competencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_competencies ALTER COLUMN id SET DEFAULT nextval('public.employee_competencies_id_seq'::regclass);


--
-- Name: employee_dependants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_dependants ALTER COLUMN id SET DEFAULT nextval('public.employee_dependants_id_seq'::regclass);


--
-- Name: employee_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents ALTER COLUMN id SET DEFAULT nextval('public.employee_documents_id_seq'::regclass);


--
-- Name: employee_emergency_contacts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_emergency_contacts ALTER COLUMN id SET DEFAULT nextval('public.employee_emergency_contacts_id_seq'::regclass);


--
-- Name: employee_group_life id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_group_life ALTER COLUMN id SET DEFAULT nextval('public.employee_group_life_id_seq'::regclass);


--
-- Name: employee_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history ALTER COLUMN id SET DEFAULT nextval('public.employee_history_id_seq'::regclass);


--
-- Name: employee_leave_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances ALTER COLUMN id SET DEFAULT nextval('public.employee_leave_balances_id_seq'::regclass);


--
-- Name: employee_medical_aid id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid ALTER COLUMN id SET DEFAULT nextval('public.employee_medical_aid_id_seq'::regclass);


--
-- Name: employee_medical_aid_dependants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_dependants ALTER COLUMN id SET DEFAULT nextval('public.employee_medical_aid_dependants_id_seq'::regclass);


--
-- Name: employee_medical_aid_extra_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_extra_transactions ALTER COLUMN id SET DEFAULT nextval('public.employee_medical_aid_extra_transactions_id_seq'::regclass);


--
-- Name: employee_qualifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_qualifications ALTER COLUMN id SET DEFAULT nextval('public.employee_qualifications_id_seq'::regclass);


--
-- Name: employee_retirement_funds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_retirement_funds ALTER COLUMN id SET DEFAULT nextval('public.employee_retirement_funds_id_seq'::regclass);


--
-- Name: employee_salary_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary_transactions ALTER COLUMN id SET DEFAULT nextval('public.employee_salary_transactions_id_seq'::regclass);


--
-- Name: employee_subtypes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_subtypes ALTER COLUMN id SET DEFAULT nextval('public.employee_subtypes_id_seq'::regclass);


--
-- Name: employee_terminations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_terminations ALTER COLUMN id SET DEFAULT nextval('public.employee_terminations_id_seq'::regclass);


--
-- Name: employee_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_types ALTER COLUMN id SET DEFAULT nextval('public.employee_types_id_seq'::regclass);


--
-- Name: ethnic_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ethnic_groups ALTER COLUMN id SET DEFAULT nextval('public.ethnic_groups_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: employment_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_categories ALTER COLUMN id SET DEFAULT nextval('public.employment_categories_id_seq'::regclass);


--
-- Name: employment_change_reason_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reason_history ALTER COLUMN id SET DEFAULT nextval('public.employment_change_reason_history_id_seq'::regclass);


--
-- Name: employment_change_reasons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reasons ALTER COLUMN id SET DEFAULT nextval('public.employment_change_reasons_id_seq'::regclass);


--
-- Name: employment_change_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_types ALTER COLUMN id SET DEFAULT nextval('public.employment_change_types_id_seq'::regclass);


--
-- Name: employment_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_codes ALTER COLUMN id SET DEFAULT nextval('public.employment_codes_id_seq'::regclass);


--
-- Name: feedback_360 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360 ALTER COLUMN id SET DEFAULT nextval('public.feedback_360_id_seq'::regclass);


--
-- Name: feedback_360_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360_responses ALTER COLUMN id SET DEFAULT nextval('public.feedback_360_responses_id_seq'::regclass);


--
-- Name: flexi_time_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flexi_time_balances ALTER COLUMN id SET DEFAULT nextval('public.flexi_time_balances_id_seq'::regclass);


--
-- Name: genders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genders ALTER COLUMN id SET DEFAULT nextval('public.genders_id_seq'::regclass);


--
-- Name: grievances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grievances ALTER COLUMN id SET DEFAULT nextval('public.grievances_id_seq'::regclass);


--
-- Name: group_life_benefits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_life_benefits ALTER COLUMN id SET DEFAULT nextval('public.group_life_benefits_id_seq'::regclass);


--
-- Name: holidays id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays ALTER COLUMN id SET DEFAULT nextval('public.holidays_id_seq'::regclass);


--
-- Name: instalments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instalments ALTER COLUMN id SET DEFAULT nextval('public.instalments_id_seq'::regclass);


--
-- Name: interview_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_slots ALTER COLUMN id SET DEFAULT nextval('public.interview_slots_id_seq'::regclass);


--
-- Name: irp5_codes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.irp5_codes ALTER COLUMN id SET DEFAULT nextval('public.irp5_codes_id_seq'::regclass);


--
-- Name: job_families id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_families ALTER COLUMN id SET DEFAULT nextval('public.job_families_id_seq'::regclass);


--
-- Name: job_profile_duties id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profile_duties ALTER COLUMN id SET DEFAULT nextval('public.job_profile_duties_id_seq'::regclass);


--
-- Name: job_profile_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profile_history ALTER COLUMN id SET DEFAULT nextval('public.job_profile_history_id_seq'::regclass);


--
-- Name: job_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles ALTER COLUMN id SET DEFAULT nextval('public.job_profiles_id_seq'::regclass);


--
-- Name: leave_policies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_policies ALTER COLUMN id SET DEFAULT nextval('public.leave_policies_id_seq'::regclass);


--
-- Name: leave_schemes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes ALTER COLUMN id SET DEFAULT nextval('public.leave_schemes_id_seq'::regclass);


--
-- Name: leave_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_transactions ALTER COLUMN id SET DEFAULT nextval('public.leave_transactions_id_seq'::regclass);


--
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- Name: life_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_events ALTER COLUMN id SET DEFAULT nextval('public.life_events_id_seq'::regclass);


--
-- Name: medical_aid_scheme_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_scheme_history ALTER COLUMN id SET DEFAULT nextval('public.medical_aid_scheme_history_id_seq'::regclass);


--
-- Name: medical_aid_schemes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_schemes ALTER COLUMN id SET DEFAULT nextval('public.medical_aid_schemes_id_seq'::regclass);


--
-- Name: medical_tax_credits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_tax_credits ALTER COLUMN id SET DEFAULT nextval('public.medical_tax_credits_id_seq'::regclass);


--
-- Name: mscoa_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mscoa_items ALTER COLUMN id SET DEFAULT nextval('public.mscoa_items_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: onboarding_checklists id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklists ALTER COLUMN id SET DEFAULT nextval('public.onboarding_checklists_id_seq'::regclass);


--
-- Name: onboarding_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_items ALTER COLUMN id SET DEFAULT nextval('public.onboarding_items_id_seq'::regclass);


--
-- Name: overtime_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_transactions ALTER COLUMN id SET DEFAULT nextval('public.overtime_transactions_id_seq'::regclass);


--
-- Name: pay_point_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_point_departments ALTER COLUMN id SET DEFAULT nextval('public.pay_point_departments_id_seq'::regclass);


--
-- Name: pay_points id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_points ALTER COLUMN id SET DEFAULT nextval('public.pay_points_id_seq'::regclass);


--
-- Name: payment_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_batches ALTER COLUMN id SET DEFAULT nextval('public.payment_batches_id_seq'::regclass);


--
-- Name: payroll_constants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_constants ALTER COLUMN id SET DEFAULT nextval('public.payroll_constants_id_seq'::regclass);


--
-- Name: payroll_cycles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_cycles ALTER COLUMN id SET DEFAULT nextval('public.payroll_cycles_id_seq'::regclass);


--
-- Name: payroll_gl_journals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_gl_journals ALTER COLUMN id SET DEFAULT nextval('public.payroll_gl_journals_id_seq'::regclass);


--
-- Name: payroll_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods ALTER COLUMN id SET DEFAULT nextval('public.payroll_periods_id_seq'::regclass);


--
-- Name: payroll_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results ALTER COLUMN id SET DEFAULT nextval('public.payroll_results_id_seq'::regclass);


--
-- Name: payroll_run_errors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_run_errors ALTER COLUMN id SET DEFAULT nextval('public.payroll_run_errors_id_seq'::regclass);


--
-- Name: payroll_runs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_runs ALTER COLUMN id SET DEFAULT nextval('public.payroll_runs_id_seq'::regclass);


--
-- Name: performance_goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals ALTER COLUMN id SET DEFAULT nextval('public.performance_goals_id_seq'::regclass);


--
-- Name: performance_indicators id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_indicators ALTER COLUMN id SET DEFAULT nextval('public.performance_indicators_id_seq'::regclass);


--
-- Name: performance_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_periods ALTER COLUMN id SET DEFAULT nextval('public.performance_periods_id_seq'::regclass);


--
-- Name: performance_review_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_items ALTER COLUMN id SET DEFAULT nextval('public.performance_review_items_id_seq'::regclass);


--
-- Name: performance_reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews ALTER COLUMN id SET DEFAULT nextval('public.performance_reviews_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: pip_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_milestones ALTER COLUMN id SET DEFAULT nextval('public.pip_milestones_id_seq'::regclass);


--
-- Name: pip_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_plans ALTER COLUMN id SET DEFAULT nextval('public.pip_plans_id_seq'::regclass);


--
-- Name: position_competencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_competencies ALTER COLUMN id SET DEFAULT nextval('public.position_competencies_id_seq'::regclass);


--
-- Name: position_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history ALTER COLUMN id SET DEFAULT nextval('public.position_history_id_seq'::regclass);


--
-- Name: position_history_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history_snapshots ALTER COLUMN id SET DEFAULT nextval('public.position_history_snapshots_id_seq'::regclass);


--
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- Name: provinces id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces ALTER COLUMN id SET DEFAULT nextval('public.provinces_id_seq'::regclass);


--
-- Name: recruitment_applicants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_applicants ALTER COLUMN id SET DEFAULT nextval('public.recruitment_applicants_id_seq'::regclass);


--
-- Name: recruitment_vacancies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_vacancies ALTER COLUMN id SET DEFAULT nextval('public.recruitment_vacancies_id_seq'::regclass);


--
-- Name: retirement_fund_salary_heads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_salary_heads ALTER COLUMN id SET DEFAULT nextval('public.retirement_fund_salary_heads_id_seq'::regclass);


--
-- Name: retirement_fund_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_types ALTER COLUMN id SET DEFAULT nextval('public.retirement_fund_types_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: const_salary_calculation_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_calculation_methods ALTER COLUMN id SET DEFAULT nextval('public.const_salary_calculation_methods_id_seq'::regclass);


--
-- Name: salary_head_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_head_history ALTER COLUMN id SET DEFAULT nextval('public.salary_head_history_id_seq'::regclass);


--
-- Name: salary_heads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_heads ALTER COLUMN id SET DEFAULT nextval('public.salary_heads_id_seq'::regclass);


--
-- Name: salary_increases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_increases ALTER COLUMN id SET DEFAULT nextval('public.salary_increases_id_seq'::regclass);


--
-- Name: salary_transaction_group_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_group_items ALTER COLUMN id SET DEFAULT nextval('public.salary_transaction_group_items_id_seq'::regclass);


--
-- Name: salary_transaction_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_groups ALTER COLUMN id SET DEFAULT nextval('public.salary_transaction_groups_id_seq'::regclass);


--
-- Name: const_salary_transaction_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_transaction_types ALTER COLUMN id SET DEFAULT nextval('public.const_salary_transaction_types_id_seq'::regclass);


--
-- Name: salary_upper_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_upper_limits ALTER COLUMN id SET DEFAULT nextval('public.salary_upper_limits_id_seq'::regclass);


--
-- Name: scoa_costings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_costings ALTER COLUMN id SET DEFAULT nextval('public.scoa_costings_id_seq'::regclass);


--
-- Name: scoa_functions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_functions ALTER COLUMN id SET DEFAULT nextval('public.scoa_functions_id_seq'::regclass);


--
-- Name: scoa_funds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_funds ALTER COLUMN id SET DEFAULT nextval('public.scoa_funds_id_seq'::regclass);


--
-- Name: scoa_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_items ALTER COLUMN id SET DEFAULT nextval('public.scoa_items_id_seq'::regclass);


--
-- Name: scoa_msc id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_msc ALTER COLUMN id SET DEFAULT nextval('public.scoa_msc_id_seq'::regclass);


--
-- Name: scoa_projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_projects ALTER COLUMN id SET DEFAULT nextval('public.scoa_projects_id_seq'::regclass);


--
-- Name: scoa_regions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_regions ALTER COLUMN id SET DEFAULT nextval('public.scoa_regions_id_seq'::regclass);


--
-- Name: sdl_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sdl_settings ALTER COLUMN id SET DEFAULT nextval('public.sdl_settings_id_seq'::regclass);


--
-- Name: shift_rosters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rosters ALTER COLUMN id SET DEFAULT nextval('public.shift_rosters_id_seq'::regclass);


--
-- Name: shift_rotations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rotations ALTER COLUMN id SET DEFAULT nextval('public.shift_rotations_id_seq'::regclass);


--
-- Name: suburbs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suburbs ALTER COLUMN id SET DEFAULT nextval('public.suburbs_id_seq'::regclass);


--
-- Name: succession_pools id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.succession_pools ALTER COLUMN id SET DEFAULT nextval('public.succession_pools_id_seq'::regclass);


--
-- Name: task_grade_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_history ALTER COLUMN id SET DEFAULT nextval('public.task_grade_history_id_seq'::regclass);


--
-- Name: task_grade_notch_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notch_history ALTER COLUMN id SET DEFAULT nextval('public.task_grade_notch_history_id_seq'::regclass);


--
-- Name: task_grade_notches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notches ALTER COLUMN id SET DEFAULT nextval('public.task_grade_notches_id_seq'::regclass);


--
-- Name: task_grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grades ALTER COLUMN id SET DEFAULT nextval('public.task_grades_id_seq'::regclass);


--
-- Name: task_skill_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_task_skill_levels ALTER COLUMN id SET DEFAULT nextval('public.const_task_skill_levels_id_seq'::regclass);


--
-- Name: tax_brackets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_brackets ALTER COLUMN id SET DEFAULT nextval('public.tax_brackets_id_seq'::regclass);


--
-- Name: tax_rebates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rebates ALTER COLUMN id SET DEFAULT nextval('public.tax_rebates_id_seq'::regclass);


--
-- Name: tax_thresholds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_thresholds ALTER COLUMN id SET DEFAULT nextval('public.tax_thresholds_id_seq'::regclass);


--
-- Name: third_party_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_party_payments ALTER COLUMN id SET DEFAULT nextval('public.third_party_payments_id_seq'::regclass);


--
-- Name: towns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.towns ALTER COLUMN id SET DEFAULT nextval('public.towns_id_seq'::regclass);


--
-- Name: trade_classification_activities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_trade_classification_activities ALTER COLUMN id SET DEFAULT nextval('public.const_trade_classification_activities_id_seq'::regclass);


--
-- Name: trade_classification_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_trade_classification_groups ALTER COLUMN id SET DEFAULT nextval('public.const_trade_classification_groups_id_seq'::regclass);


--
-- Name: trade_unions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_unions ALTER COLUMN id SET DEFAULT nextval('public.trade_unions_id_seq'::regclass);


--
-- Name: titles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.titles ALTER COLUMN id SET DEFAULT nextval('public.titles_id_seq'::regclass);


--
-- Name: training_courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_courses ALTER COLUMN id SET DEFAULT nextval('public.training_courses_id_seq'::regclass);


--
-- Name: training_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_records ALTER COLUMN id SET DEFAULT nextval('public.training_records_id_seq'::regclass);


--
-- Name: uif_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uif_settings ALTER COLUMN id SET DEFAULT nextval('public.uif_settings_id_seq'::regclass);


--
-- Name: upper_limit_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limit_history ALTER COLUMN id SET DEFAULT nextval('public.upper_limit_history_id_seq'::regclass);


--
-- Name: upper_limits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limits ALTER COLUMN id SET DEFAULT nextval('public.upper_limits_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: work_areas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_areas ALTER COLUMN id SET DEFAULT nextval('public.work_areas_id_seq'::regclass);


--
-- Name: work_shifts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_shifts ALTER COLUMN id SET DEFAULT nextval('public.work_shifts_id_seq'::regclass);


--
-- Name: workflow_definitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_definitions ALTER COLUMN id SET DEFAULT nextval('public.workflow_definitions_id_seq'::regclass);


--
-- Name: workflow_instances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances ALTER COLUMN id SET DEFAULT nextval('public.workflow_instances_id_seq'::regclass);


--
-- Name: workflow_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps ALTER COLUMN id SET DEFAULT nextval('public.workflow_steps_id_seq'::regclass);


--
-- Name: absence_types absence_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absence_types
    ADD CONSTRAINT absence_types_code_key UNIQUE (code);


--
-- Name: absence_types absence_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absence_types
    ADD CONSTRAINT absence_types_pkey PRIMARY KEY (id);


--
-- Name: applicant_scores applicant_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_scores
    ADD CONSTRAINT applicant_scores_pkey PRIMARY KEY (id);


--
-- Name: approval_workflows approval_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_workflows
    ADD CONSTRAINT approval_workflows_pkey PRIMARY KEY (id);


--
-- Name: arrears arrears_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: bargaining_councils bargaining_councils_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bargaining_councils
    ADD CONSTRAINT bargaining_councils_code_key UNIQUE (code);


--
-- Name: bargaining_councils bargaining_councils_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bargaining_councils
    ADD CONSTRAINT bargaining_councils_pkey PRIMARY KEY (id);


--
-- Name: benefit_rate_tables benefit_rate_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.benefit_rate_tables
    ADD CONSTRAINT benefit_rate_tables_pkey PRIMARY KEY (id);


--
-- Name: claim_rates claim_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_rates
    ADD CONSTRAINT claim_rates_pkey PRIMARY KEY (id);


--
-- Name: claims claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_pkey PRIMARY KEY (id);


--
-- Name: coe_projections coe_projections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coe_projections
    ADD CONSTRAINT coe_projections_pkey PRIMARY KEY (id);


--
-- Name: competencies competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competencies
    ADD CONSTRAINT competencies_pkey PRIMARY KEY (id);


--
-- Name: competency_levels competency_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competency_levels
    ADD CONSTRAINT competency_levels_pkey PRIMARY KEY (id);


--
-- Name: conditions_of_service conditions_of_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conditions_of_service
    ADD CONSTRAINT conditions_of_service_code_key UNIQUE (code);


--
-- Name: conditions_of_service conditions_of_service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conditions_of_service
    ADD CONSTRAINT conditions_of_service_pkey PRIMARY KEY (id);


--
-- Name: cons_vendors cons_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cons_vendors
    ADD CONSTRAINT cons_vendors_pkey PRIMARY KEY (id);


--
-- Name: councillor_upper_limits councillor_upper_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.councillor_upper_limits
    ADD CONSTRAINT councillor_upper_limits_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: delegations delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delegations
    ADD CONSTRAINT delegations_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: disciplinary_cases disciplinary_cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinary_cases
    ADD CONSTRAINT disciplinary_cases_case_number_key UNIQUE (case_number);


--
-- Name: disciplinary_cases disciplinary_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinary_cases
    ADD CONSTRAINT disciplinary_cases_pkey PRIMARY KEY (id);


--
-- Name: divisions divisions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_code_key UNIQUE (code);


--
-- Name: divisions divisions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: ee_occupational_levels ee_occupational_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_occupational_levels
    ADD CONSTRAINT ee_occupational_levels_pkey PRIMARY KEY (id);


--
-- Name: ee_plans ee_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_plans
    ADD CONSTRAINT ee_plans_pkey PRIMARY KEY (id);


--
-- Name: ee_targets ee_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_targets
    ADD CONSTRAINT ee_targets_pkey PRIMARY KEY (id);


--
-- Name: eft_batches eft_batches_batch_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_batches
    ADD CONSTRAINT eft_batches_batch_number_key UNIQUE (batch_number);


--
-- Name: eft_batches eft_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_batches
    ADD CONSTRAINT eft_batches_pkey PRIMARY KEY (id);


--
-- Name: eft_records eft_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_records
    ADD CONSTRAINT eft_records_pkey PRIMARY KEY (id);


--
-- Name: employee_attendance employee_attendance_employee_id_attendance_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_attendance
    ADD CONSTRAINT employee_attendance_employee_id_attendance_date_key UNIQUE (employee_id, attendance_date);


--
-- Name: employee_attendance employee_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_attendance
    ADD CONSTRAINT employee_attendance_pkey PRIMARY KEY (id);


--
-- Name: employee_competencies employee_competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_competencies
    ADD CONSTRAINT employee_competencies_pkey PRIMARY KEY (id);


--
-- Name: employee_dependants employee_dependants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_dependants
    ADD CONSTRAINT employee_dependants_pkey PRIMARY KEY (id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (id);


--
-- Name: employee_emergency_contacts employee_emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_emergency_contacts
    ADD CONSTRAINT employee_emergency_contacts_pkey PRIMARY KEY (id);


--
-- Name: employee_group_life employee_group_life_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_group_life
    ADD CONSTRAINT employee_group_life_pkey PRIMARY KEY (id);


--
-- Name: employee_history employee_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_pkey PRIMARY KEY (id);


--
-- Name: employee_leave_balances employee_leave_balances_employee_id_leave_type_id_as_at_dat_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_leave_type_id_as_at_dat_key UNIQUE (employee_id, leave_type_id, as_at_date);


--
-- Name: employee_leave_balances employee_leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_pkey PRIMARY KEY (id);


--
-- Name: employee_medical_aid_dependants employee_medical_aid_dependants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_dependants
    ADD CONSTRAINT employee_medical_aid_dependants_pkey PRIMARY KEY (id);


--
-- Name: employee_medical_aid_extra_transactions employee_medical_aid_extra_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_extra_transactions
    ADD CONSTRAINT employee_medical_aid_extra_transactions_pkey PRIMARY KEY (id);


--
-- Name: employee_medical_aid employee_medical_aid_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid
    ADD CONSTRAINT employee_medical_aid_pkey PRIMARY KEY (id);


--
-- Name: employee_qualifications employee_qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_qualifications
    ADD CONSTRAINT employee_qualifications_pkey PRIMARY KEY (id);


--
-- Name: employee_retirement_funds employee_retirement_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_retirement_funds
    ADD CONSTRAINT employee_retirement_funds_pkey PRIMARY KEY (id);


--
-- Name: employee_salary_transactions employee_salary_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary_transactions
    ADD CONSTRAINT employee_salary_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_est_id_fkey FOREIGN KEY (employee_salary_transaction_id) REFERENCES public.employee_salary_transactions(id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);

ALTER TABLE ONLY public.employee_payslip_transactions
    ADD CONSTRAINT employee_payslip_transactions_processed_on_period_id_fkey FOREIGN KEY (processed_on_period_id) REFERENCES public.payroll_periods(id);

CREATE INDEX idx_employee_payslip_transactions_employee_id ON public.employee_payslip_transactions USING btree (employee_id);
CREATE INDEX idx_employee_payslip_transactions_period_id ON public.employee_payslip_transactions USING btree (period_id);


--
-- Name: employee_subtypes employee_subtypes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_subtypes
    ADD CONSTRAINT employee_subtypes_code_key UNIQUE (code);


--
-- Name: employee_subtypes employee_subtypes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_subtypes
    ADD CONSTRAINT employee_subtypes_pkey PRIMARY KEY (id);


--
-- Name: employee_terminations employee_terminations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_terminations
    ADD CONSTRAINT employee_terminations_pkey PRIMARY KEY (id);


--
-- Name: employee_types employee_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_types
    ADD CONSTRAINT employee_types_code_key UNIQUE (code);


--
-- Name: employee_types employee_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_types
    ADD CONSTRAINT employee_types_pkey PRIMARY KEY (id);


--
-- Name: ethnic_groups ethnic_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ethnic_groups
    ADD CONSTRAINT ethnic_groups_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employment_categories employment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_categories
    ADD CONSTRAINT employment_categories_pkey PRIMARY KEY (id);


--
-- Name: employment_change_reason_history employment_change_reason_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reason_history
    ADD CONSTRAINT employment_change_reason_history_pkey PRIMARY KEY (id);


--
-- Name: employment_change_reasons employment_change_reasons_employment_change_type_id_reason__key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reasons
    ADD CONSTRAINT employment_change_reasons_employment_change_type_id_reason__key UNIQUE (employment_change_type_id, reason_description);


--
-- Name: employment_change_reasons employment_change_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reasons
    ADD CONSTRAINT employment_change_reasons_pkey PRIMARY KEY (id);


--
-- Name: employment_change_types employment_change_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_types
    ADD CONSTRAINT employment_change_types_code_key UNIQUE (code);


--
-- Name: employment_change_types employment_change_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_types
    ADD CONSTRAINT employment_change_types_pkey PRIMARY KEY (id);


--
-- Name: employment_codes employment_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_codes
    ADD CONSTRAINT employment_codes_pkey PRIMARY KEY (id);


--
-- Name: feedback_360 feedback_360_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360
    ADD CONSTRAINT feedback_360_pkey PRIMARY KEY (id);


--
-- Name: feedback_360_responses feedback_360_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360_responses
    ADD CONSTRAINT feedback_360_responses_pkey PRIMARY KEY (id);


--
-- Name: flexi_time_balances flexi_time_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flexi_time_balances
    ADD CONSTRAINT flexi_time_balances_pkey PRIMARY KEY (id);


--
-- Name: grievances grievances_grievance_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grievances
    ADD CONSTRAINT grievances_grievance_number_key UNIQUE (grievance_number);


--
-- Name: genders genders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genders
    ADD CONSTRAINT genders_pkey PRIMARY KEY (id);


--
-- Name: grievances grievances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grievances
    ADD CONSTRAINT grievances_pkey PRIMARY KEY (id);


--
-- Name: group_life_benefits group_life_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_life_benefits
    ADD CONSTRAINT group_life_benefits_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_name_holiday_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_name_holiday_date_key UNIQUE (name, holiday_date);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: instalments instalments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instalments
    ADD CONSTRAINT instalments_pkey PRIMARY KEY (id);


--
-- Name: interview_slots interview_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_slots
    ADD CONSTRAINT interview_slots_pkey PRIMARY KEY (id);


--
-- Name: irp5_codes irp5_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.irp5_codes
    ADD CONSTRAINT irp5_codes_code_key UNIQUE (code);


--
-- Name: irp5_codes irp5_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.irp5_codes
    ADD CONSTRAINT irp5_codes_pkey PRIMARY KEY (id);


--
-- Name: job_families job_families_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_families
    ADD CONSTRAINT job_families_pkey PRIMARY KEY (id);


--
-- Name: job_profile_duties job_profile_duties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profile_duties
    ADD CONSTRAINT job_profile_duties_pkey PRIMARY KEY (id);


--
-- Name: job_profile_history job_profile_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profile_history
    ADD CONSTRAINT job_profile_history_pkey PRIMARY KEY (id);


--
-- Name: job_profiles job_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_pkey PRIMARY KEY (id);


--
-- Name: leave_policies leave_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_policies
    ADD CONSTRAINT leave_policies_pkey PRIMARY KEY (id);


--
-- Name: leave_schemes leave_schemes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes
    ADD CONSTRAINT leave_schemes_code_key UNIQUE (code);


--
-- Name: leave_schemes leave_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes
    ADD CONSTRAINT leave_schemes_pkey PRIMARY KEY (id);


--
-- Name: leave_transactions leave_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_transactions
    ADD CONSTRAINT leave_transactions_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_code_key UNIQUE (code);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: life_events life_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_events
    ADD CONSTRAINT life_events_pkey PRIMARY KEY (id);


--
-- Name: medical_aid_scheme_history medical_aid_scheme_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_scheme_history
    ADD CONSTRAINT medical_aid_scheme_history_pkey PRIMARY KEY (id);


--
-- Name: medical_aid_schemes medical_aid_schemes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_schemes
    ADD CONSTRAINT medical_aid_schemes_code_key UNIQUE (code);


--
-- Name: medical_aid_schemes medical_aid_schemes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_schemes
    ADD CONSTRAINT medical_aid_schemes_pkey PRIMARY KEY (id);


--
-- Name: medical_tax_credits medical_tax_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_tax_credits
    ADD CONSTRAINT medical_tax_credits_pkey PRIMARY KEY (id);


--
-- Name: medical_tax_credits medical_tax_credits_tax_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_tax_credits
    ADD CONSTRAINT medical_tax_credits_tax_year_key UNIQUE (tax_year);


--
-- Name: mscoa_items mscoa_items_item_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mscoa_items
    ADD CONSTRAINT mscoa_items_item_code_key UNIQUE (item_code);


--
-- Name: mscoa_items mscoa_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mscoa_items
    ADD CONSTRAINT mscoa_items_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ofo_major_groups ofo_major_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_major_groups
    ADD CONSTRAINT ofo_major_groups_pkey PRIMARY KEY (id);


--
-- Name: ofo_minor_groups ofo_minor_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_minor_groups
    ADD CONSTRAINT ofo_minor_groups_pkey PRIMARY KEY (id);


--
-- Name: ofo_occupations ofo_occupations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_occupations
    ADD CONSTRAINT ofo_occupations_pkey PRIMARY KEY (id);


--
-- Name: ofo_specialists ofo_specialists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_specialists
    ADD CONSTRAINT ofo_specialists_pkey PRIMARY KEY (id);


--
-- Name: ofo_sub_major_groups ofo_sub_major_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_sub_major_groups
    ADD CONSTRAINT ofo_sub_major_groups_pkey PRIMARY KEY (id);


--
-- Name: ofo_unit_groups ofo_unit_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_unit_groups
    ADD CONSTRAINT ofo_unit_groups_pkey PRIMARY KEY (id);


--
-- Name: onboarding_checklists onboarding_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklists
    ADD CONSTRAINT onboarding_checklists_pkey PRIMARY KEY (id);


--
-- Name: onboarding_items onboarding_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_items
    ADD CONSTRAINT onboarding_items_pkey PRIMARY KEY (id);


--
-- Name: overtime_transactions overtime_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_transactions
    ADD CONSTRAINT overtime_transactions_pkey PRIMARY KEY (id);


--
-- Name: pay_point_departments pay_point_departments_pay_point_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_point_departments
    ADD CONSTRAINT pay_point_departments_pay_point_id_department_id_key UNIQUE (pay_point_id, department_id);


--
-- Name: pay_point_departments pay_point_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_point_departments
    ADD CONSTRAINT pay_point_departments_pkey PRIMARY KEY (id);


--
-- Name: pay_points pay_points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_points
    ADD CONSTRAINT pay_points_pkey PRIMARY KEY (id);


--
-- Name: payment_batches payment_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_pkey PRIMARY KEY (id);


--
-- Name: payroll_constants payroll_constants_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_constants
    ADD CONSTRAINT payroll_constants_key_key UNIQUE (key);


--
-- Name: payroll_constants payroll_constants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_constants
    ADD CONSTRAINT payroll_constants_pkey PRIMARY KEY (id);


--
-- Name: payroll_cycles payroll_cycles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_cycles
    ADD CONSTRAINT payroll_cycles_code_key UNIQUE (code);


--
-- Name: payroll_cycles payroll_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_cycles
    ADD CONSTRAINT payroll_cycles_pkey PRIMARY KEY (id);


--
-- Name: payroll_gl_journals payroll_gl_journals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_gl_journals
    ADD CONSTRAINT payroll_gl_journals_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payroll_results payroll_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_pkey PRIMARY KEY (id);


--
-- Name: payroll_run_errors payroll_run_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_run_errors
    ADD CONSTRAINT payroll_run_errors_pkey PRIMARY KEY (id);


--
-- Name: payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: performance_goals performance_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_pkey PRIMARY KEY (id);


--
-- Name: performance_indicators performance_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_indicators
    ADD CONSTRAINT performance_indicators_pkey PRIMARY KEY (id);


--
-- Name: performance_periods performance_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_periods
    ADD CONSTRAINT performance_periods_pkey PRIMARY KEY (id);


--
-- Name: performance_review_items performance_review_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_items
    ADD CONSTRAINT performance_review_items_pkey PRIMARY KEY (id);


--
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pip_milestones pip_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_milestones
    ADD CONSTRAINT pip_milestones_pkey PRIMARY KEY (id);


--
-- Name: pip_plans pip_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_plans
    ADD CONSTRAINT pip_plans_pkey PRIMARY KEY (id);


--
-- Name: position_competencies position_competencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_competencies
    ADD CONSTRAINT position_competencies_pkey PRIMARY KEY (id);


--
-- Name: position_history position_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history
    ADD CONSTRAINT position_history_pkey PRIMARY KEY (id);


--
-- Name: position_history_snapshots position_history_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history_snapshots
    ADD CONSTRAINT position_history_snapshots_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: positions positions_position_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_position_code_key UNIQUE (position_code);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: recruitment_applicants recruitment_applicants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_applicants
    ADD CONSTRAINT recruitment_applicants_pkey PRIMARY KEY (id);


--
-- Name: recruitment_vacancies recruitment_vacancies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_vacancies
    ADD CONSTRAINT recruitment_vacancies_pkey PRIMARY KEY (id);


--
-- Name: recruitment_vacancies recruitment_vacancies_requisition_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_vacancies
    ADD CONSTRAINT recruitment_vacancies_requisition_number_key UNIQUE (requisition_number);


--
-- Name: retirement_fund_salary_heads retirement_fund_salary_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_salary_heads
    ADD CONSTRAINT retirement_fund_salary_heads_pkey PRIMARY KEY (id);


--
-- Name: retirement_fund_salary_heads retirement_fund_salary_heads_retirement_fund_type_id_salary_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_salary_heads
    ADD CONSTRAINT retirement_fund_salary_heads_retirement_fund_type_id_salary_key UNIQUE (retirement_fund_type_id, salary_head_id);


--
-- Name: retirement_fund_types retirement_fund_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_types
    ADD CONSTRAINT retirement_fund_types_code_key UNIQUE (code);


--
-- Name: retirement_fund_types retirement_fund_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_types
    ADD CONSTRAINT retirement_fund_types_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: const_salary_calculation_methods const_salary_calculation_methods_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_calculation_methods
    ADD CONSTRAINT const_salary_calculation_methods_code_key UNIQUE (code);


--
-- Name: const_salary_calculation_methods const_salary_calculation_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_calculation_methods
    ADD CONSTRAINT const_salary_calculation_methods_pkey PRIMARY KEY (id);


--
-- Name: salary_head_history salary_head_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_head_history
    ADD CONSTRAINT salary_head_history_pkey PRIMARY KEY (id);


--
-- Name: salary_heads salary_heads_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_heads
    ADD CONSTRAINT salary_heads_code_key UNIQUE (code);


--
-- Name: salary_heads salary_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_heads
    ADD CONSTRAINT salary_heads_pkey PRIMARY KEY (id);


--
-- Name: salary_increases salary_increases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_increases
    ADD CONSTRAINT salary_increases_pkey PRIMARY KEY (id);


--
-- Name: salary_transaction_group_items salary_transaction_group_items_group_id_salary_head_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_group_items
    ADD CONSTRAINT salary_transaction_group_items_group_id_salary_head_id_key UNIQUE (group_id, salary_head_id);


--
-- Name: salary_transaction_group_items salary_transaction_group_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_group_items
    ADD CONSTRAINT salary_transaction_group_items_pkey PRIMARY KEY (id);


--
-- Name: salary_transaction_groups salary_transaction_groups_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_groups
    ADD CONSTRAINT salary_transaction_groups_code_key UNIQUE (code);


--
-- Name: salary_transaction_groups salary_transaction_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_groups
    ADD CONSTRAINT salary_transaction_groups_pkey PRIMARY KEY (id);


--
-- Name: const_salary_transaction_types const_salary_transaction_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_transaction_types
    ADD CONSTRAINT const_salary_transaction_types_code_key UNIQUE (code);


--
-- Name: const_salary_transaction_types const_salary_transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_salary_transaction_types
    ADD CONSTRAINT const_salary_transaction_types_pkey PRIMARY KEY (id);


--
-- Name: salary_upper_limits salary_upper_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_upper_limits
    ADD CONSTRAINT salary_upper_limits_pkey PRIMARY KEY (id);


--
-- Name: scoa_costings scoa_costings_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_costings
    ADD CONSTRAINT scoa_costings_code_key UNIQUE (code);


--
-- Name: scoa_costings scoa_costings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_costings
    ADD CONSTRAINT scoa_costings_pkey PRIMARY KEY (id);


--
-- Name: scoa_functions scoa_functions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_functions
    ADD CONSTRAINT scoa_functions_code_key UNIQUE (code);


--
-- Name: scoa_functions scoa_functions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_functions
    ADD CONSTRAINT scoa_functions_pkey PRIMARY KEY (id);


--
-- Name: scoa_funds scoa_funds_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_funds
    ADD CONSTRAINT scoa_funds_code_key UNIQUE (code);


--
-- Name: scoa_funds scoa_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_funds
    ADD CONSTRAINT scoa_funds_pkey PRIMARY KEY (id);


--
-- Name: scoa_items scoa_items_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_items
    ADD CONSTRAINT scoa_items_code_key UNIQUE (code);


--
-- Name: scoa_items scoa_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_items
    ADD CONSTRAINT scoa_items_pkey PRIMARY KEY (id);


--
-- Name: scoa_msc scoa_msc_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_msc
    ADD CONSTRAINT scoa_msc_code_key UNIQUE (code);


--
-- Name: scoa_msc scoa_msc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_msc
    ADD CONSTRAINT scoa_msc_pkey PRIMARY KEY (id);


--
-- Name: scoa_projects scoa_projects_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_projects
    ADD CONSTRAINT scoa_projects_code_key UNIQUE (code);


--
-- Name: scoa_projects scoa_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_projects
    ADD CONSTRAINT scoa_projects_pkey PRIMARY KEY (id);


--
-- Name: scoa_regions scoa_regions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_regions
    ADD CONSTRAINT scoa_regions_code_key UNIQUE (code);


--
-- Name: scoa_regions scoa_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoa_regions
    ADD CONSTRAINT scoa_regions_pkey PRIMARY KEY (id);


--
-- Name: sdl_settings sdl_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sdl_settings
    ADD CONSTRAINT sdl_settings_pkey PRIMARY KEY (id);


--
-- Name: sdl_settings sdl_settings_tax_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sdl_settings
    ADD CONSTRAINT sdl_settings_tax_year_key UNIQUE (tax_year);


--
-- Name: shift_rosters shift_rosters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rosters
    ADD CONSTRAINT shift_rosters_pkey PRIMARY KEY (id);


--
-- Name: shift_rotations shift_rotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rotations
    ADD CONSTRAINT shift_rotations_pkey PRIMARY KEY (id);


--
-- Name: suburbs suburbs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suburbs
    ADD CONSTRAINT suburbs_pkey PRIMARY KEY (id);


--
-- Name: succession_pools succession_pools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.succession_pools
    ADD CONSTRAINT succession_pools_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: task_grade_history task_grade_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_history
    ADD CONSTRAINT task_grade_history_pkey PRIMARY KEY (id);


--
-- Name: task_grade_notch_history task_grade_notch_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notch_history
    ADD CONSTRAINT task_grade_notch_history_pkey PRIMARY KEY (id);


--
-- Name: task_grade_notches task_grade_notches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notches
    ADD CONSTRAINT task_grade_notches_pkey PRIMARY KEY (id);


--
-- Name: task_grade_notches task_grade_notches_task_grade_id_notch_number_start_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notches
    ADD CONSTRAINT task_grade_notches_task_grade_id_notch_number_start_date_key UNIQUE (task_grade_id, notch_number, start_date);


--
-- Name: task_grades task_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grades
    ADD CONSTRAINT task_grades_pkey PRIMARY KEY (id);


--
-- Name: task_skill_levels const_task_skill_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_task_skill_levels
    ADD CONSTRAINT const_task_skill_levels_pkey PRIMARY KEY (id);


--
-- Name: tax_brackets tax_brackets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_brackets
    ADD CONSTRAINT tax_brackets_pkey PRIMARY KEY (id);


--
-- Name: tax_brackets tax_brackets_tax_year_bracket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_brackets
    ADD CONSTRAINT tax_brackets_tax_year_bracket_number_key UNIQUE (tax_year, bracket_number);


--
-- Name: tax_rebates tax_rebates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rebates
    ADD CONSTRAINT tax_rebates_pkey PRIMARY KEY (id);


--
-- Name: tax_rebates tax_rebates_tax_year_rebate_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_rebates
    ADD CONSTRAINT tax_rebates_tax_year_rebate_type_key UNIQUE (tax_year, rebate_type);


--
-- Name: tax_thresholds tax_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tax_thresholds
    ADD CONSTRAINT tax_thresholds_pkey PRIMARY KEY (id);


--
-- Name: third_party_payments third_party_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_party_payments
    ADD CONSTRAINT third_party_payments_pkey PRIMARY KEY (id);


--
-- Name: towns towns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.towns
    ADD CONSTRAINT towns_pkey PRIMARY KEY (id);


--
-- Name: trade_classification_activities trade_classification_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_trade_classification_activities
    ADD CONSTRAINT const_trade_classification_activities_pkey PRIMARY KEY (id);


--
-- Name: trade_classification_groups trade_classification_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_trade_classification_groups
    ADD CONSTRAINT const_trade_classification_groups_pkey PRIMARY KEY (id);


--
-- Name: trade_unions trade_unions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_unions
    ADD CONSTRAINT trade_unions_pkey PRIMARY KEY (id);


--
-- Name: titles titles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.titles
    ADD CONSTRAINT titles_pkey PRIMARY KEY (id);


--
-- Name: training_courses training_courses_course_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_courses
    ADD CONSTRAINT training_courses_course_code_key UNIQUE (course_code);


--
-- Name: training_courses training_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_courses
    ADD CONSTRAINT training_courses_pkey PRIMARY KEY (id);


--
-- Name: training_records training_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_records
    ADD CONSTRAINT training_records_pkey PRIMARY KEY (id);


--
-- Name: uif_settings uif_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uif_settings
    ADD CONSTRAINT uif_settings_pkey PRIMARY KEY (id);


--
-- Name: uif_settings uif_settings_tax_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uif_settings
    ADD CONSTRAINT uif_settings_tax_year_key UNIQUE (tax_year);


--
-- Name: upper_limit_history upper_limit_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limit_history
    ADD CONSTRAINT upper_limit_history_pkey PRIMARY KEY (id);


--
-- Name: upper_limits upper_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limits
    ADD CONSTRAINT upper_limits_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: work_areas work_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_pkey PRIMARY KEY (id);


--
-- Name: work_shifts work_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_shifts
    ADD CONSTRAINT work_shifts_pkey PRIMARY KEY (id);


--
-- Name: workflow_definitions workflow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_pkey PRIMARY KEY (id);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflow_steps workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_log_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_user ON public.audit_log USING btree (user_id);


--
-- Name: idx_documents_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_entity ON public.documents USING btree (entity_type, entity_id);


--
-- Name: idx_employees_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_code ON public.employees USING btree (employee_code);


--
-- Name: idx_employees_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_department ON public.employees USING btree (employee_type_id);


--
-- Name: idx_employees_id_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_id_number ON public.employees USING btree (id_number);


--
-- Name: idx_employees_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_position ON public.employees USING btree (position_id);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_jp_duties_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jp_duties_profile ON public.job_profile_duties USING btree (job_profile_id);


--
-- Name: idx_leave_transactions_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_transactions_employee ON public.leave_transactions USING btree (employee_id);


--
-- Name: idx_leave_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_transactions_status ON public.leave_transactions USING btree (status);


--
-- Name: idx_overtime_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_employee ON public.overtime_transactions USING btree (employee_id);


--
-- Name: idx_overtime_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_status ON public.overtime_transactions USING btree (status);


--
-- Name: idx_payment_batches_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_batches_run_id ON public.payment_batches USING btree (run_id);


--
-- Name: idx_payroll_results_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_employee ON public.payroll_results USING btree (employee_id);


--
-- Name: idx_payroll_results_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_period ON public.payroll_results USING btree (period_id);


--
-- Name: idx_payroll_results_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_run ON public.payroll_results USING btree (run_id);


--
-- Name: idx_payroll_results_run_emp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_run_emp ON public.payroll_results USING btree (run_id, employee_id);


--
-- Name: idx_payroll_results_run_head; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_run_head ON public.payroll_results USING btree (run_id, salary_head_id);


--
-- Name: idx_payroll_results_run_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_results_run_id ON public.payroll_results USING btree (run_id);


--
-- Name: idx_positions_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_department ON public.positions USING btree (department_id);


--
-- Name: idx_positions_division; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_division ON public.positions USING btree (division_id);


--
-- Name: idx_positions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_positions_status ON public.positions USING btree (status);


--
-- Name: idx_salary_head_history_head_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_salary_head_history_head_id ON public.salary_head_history USING btree (salary_head_id);


--
-- Name: idx_upper_limit_history_ul_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_upper_limit_history_ul_id ON public.upper_limit_history USING btree (upper_limit_id);


--
-- Name: pay_points_code_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pay_points_code_unique ON public.pay_points USING btree (lower((code)::text));


--
-- Name: absence_types absence_types_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absence_types
    ADD CONSTRAINT absence_types_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: applicant_scores applicant_scores_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_scores
    ADD CONSTRAINT applicant_scores_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.recruitment_applicants(id);


--
-- Name: arrears arrears_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: arrears arrears_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--
-- Name: arrears arrears_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arrears
    ADD CONSTRAINT arrears_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: claims claims_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: claims claims_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claims
    ADD CONSTRAINT claims_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);


--
-- Name: competency_levels competency_levels_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.competency_levels
    ADD CONSTRAINT competency_levels_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id);


--
-- Name: disciplinary_cases disciplinary_cases_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disciplinary_cases
    ADD CONSTRAINT disciplinary_cases_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: divisions divisions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: divisions divisions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT divisions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.divisions(id);


--
-- Name: ee_targets ee_targets_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ee_targets
    ADD CONSTRAINT ee_targets_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.ee_plans(id) ON DELETE CASCADE;


--
-- Name: eft_batches eft_batches_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_batches
    ADD CONSTRAINT eft_batches_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--
-- Name: eft_records eft_records_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_records
    ADD CONSTRAINT eft_records_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.eft_batches(id);


--
-- Name: eft_records eft_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eft_records
    ADD CONSTRAINT eft_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_attendance employee_attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_attendance
    ADD CONSTRAINT employee_attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_attendance employee_attendance_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_attendance
    ADD CONSTRAINT employee_attendance_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.work_shifts(id);


--
-- Name: employee_competencies employee_competencies_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_competencies
    ADD CONSTRAINT employee_competencies_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id);


--
-- Name: employee_competencies employee_competencies_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_competencies
    ADD CONSTRAINT employee_competencies_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_dependants employee_dependants_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_dependants
    ADD CONSTRAINT employee_dependants_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_documents employee_documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_documents employee_documents_parent_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_parent_document_id_fkey FOREIGN KEY (parent_document_id) REFERENCES public.employee_documents(id);


--
-- Name: employee_emergency_contacts employee_emergency_contacts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_emergency_contacts
    ADD CONSTRAINT employee_emergency_contacts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_group_life employee_group_life_benefit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_group_life
    ADD CONSTRAINT employee_group_life_benefit_id_fkey FOREIGN KEY (benefit_id) REFERENCES public.group_life_benefits(id);


--
-- Name: employee_group_life employee_group_life_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_group_life
    ADD CONSTRAINT employee_group_life_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_history employee_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_leave_balances employee_leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_leave_balances employee_leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: employee_medical_aid_dependants employee_medical_aid_dependants_employee_medical_aid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_dependants
    ADD CONSTRAINT employee_medical_aid_dependants_employee_medical_aid_id_fkey FOREIGN KEY (employee_medical_aid_id) REFERENCES public.employee_medical_aid(id);


--
-- Name: employee_medical_aid employee_medical_aid_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid
    ADD CONSTRAINT employee_medical_aid_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_medical_aid_extra_transactions employee_medical_aid_extra_transac_employee_medical_aid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid_extra_transactions
    ADD CONSTRAINT employee_medical_aid_extra_transac_employee_medical_aid_id_fkey FOREIGN KEY (employee_medical_aid_id) REFERENCES public.employee_medical_aid(id) ON DELETE CASCADE;


--
-- Name: employee_medical_aid employee_medical_aid_scheme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_medical_aid
    ADD CONSTRAINT employee_medical_aid_scheme_id_fkey FOREIGN KEY (scheme_id) REFERENCES public.medical_aid_schemes(id);


--
-- Name: employee_qualifications employee_qualifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_qualifications
    ADD CONSTRAINT employee_qualifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_retirement_funds employee_retirement_funds_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_retirement_funds
    ADD CONSTRAINT employee_retirement_funds_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_retirement_funds employee_retirement_funds_fund_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_retirement_funds
    ADD CONSTRAINT employee_retirement_funds_fund_type_id_fkey FOREIGN KEY (fund_type_id) REFERENCES public.retirement_fund_types(id);


--
-- Name: employee_salary_transactions employee_salary_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary_transactions
    ADD CONSTRAINT employee_salary_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_salary_transactions employee_salary_transactions_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary_transactions
    ADD CONSTRAINT employee_salary_transactions_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: employee_subtypes employee_subtypes_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_subtypes
    ADD CONSTRAINT employee_subtypes_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: employee_terminations employee_terminations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_terminations
    ADD CONSTRAINT employee_terminations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employees employees_condition_of_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_condition_of_service_id_fkey FOREIGN KEY (condition_of_service_id) REFERENCES public.conditions_of_service(id);


--
-- Name: employees employees_employee_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES public.employee_subtypes(id);


--
-- Name: employees employees_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: employees employees_payroll_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_payroll_cycle_id_fkey FOREIGN KEY (payroll_cycle_id) REFERENCES public.payroll_cycles(id);


--
-- Name: employees employees_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: employees employees_task_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_task_grade_id_fkey FOREIGN KEY (task_grade_id) REFERENCES public.task_grades(id);


--
-- Name: employment_change_reasons employment_change_reasons_employment_change_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employment_change_reasons
    ADD CONSTRAINT employment_change_reasons_employment_change_type_id_fkey FOREIGN KEY (employment_change_type_id) REFERENCES public.employment_change_types(id);


--
-- Name: feedback_360 feedback_360_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360
    ADD CONSTRAINT feedback_360_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: feedback_360_responses feedback_360_responses_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360_responses
    ADD CONSTRAINT feedback_360_responses_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback_360(id);


--
-- Name: feedback_360_responses feedback_360_responses_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_360_responses
    ADD CONSTRAINT feedback_360_responses_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.employees(id);


--
-- Name: flexi_time_balances flexi_time_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flexi_time_balances
    ADD CONSTRAINT flexi_time_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: grievances grievances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grievances
    ADD CONSTRAINT grievances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: instalments instalments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instalments
    ADD CONSTRAINT instalments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: instalments instalments_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instalments
    ADD CONSTRAINT instalments_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: interview_slots interview_slots_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_slots
    ADD CONSTRAINT interview_slots_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.recruitment_applicants(id);


--
-- Name: interview_slots interview_slots_vacancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_slots
    ADD CONSTRAINT interview_slots_vacancy_id_fkey FOREIGN KEY (vacancy_id) REFERENCES public.recruitment_vacancies(id);


--
-- Name: job_profile_duties job_profile_duties_job_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profile_duties
    ADD CONSTRAINT job_profile_duties_job_profile_id_fkey FOREIGN KEY (job_profile_id) REFERENCES public.job_profiles(id);


--
-- Name: job_profiles job_profiles_condition_of_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_condition_of_service_id_fkey FOREIGN KEY (condition_of_service_id) REFERENCES public.conditions_of_service(id);


--
-- Name: job_profiles job_profiles_employee_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES public.employee_subtypes(id);


--
-- Name: job_profiles job_profiles_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: job_profiles job_profiles_reports_to_job_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_reports_to_job_profile_id_fkey FOREIGN KEY (reports_to_job_profile_id) REFERENCES public.job_profiles(id);


--
-- Name: job_profiles job_profiles_salary_transaction_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_salary_transaction_group_id_fkey FOREIGN KEY (salary_transaction_group_id) REFERENCES public.salary_transaction_groups(id);


--
-- Name: job_profiles job_profiles_task_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_task_grade_id_fkey FOREIGN KEY (task_grade_id) REFERENCES public.task_grades(id);


--
-- Name: job_profiles job_profiles_upper_limit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_profiles
    ADD CONSTRAINT job_profiles_upper_limit_id_fkey FOREIGN KEY (upper_limit_id) REFERENCES public.salary_upper_limits(id);


--
-- Name: leave_policies leave_policies_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_policies
    ADD CONSTRAINT leave_policies_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_schemes leave_schemes_condition_of_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes
    ADD CONSTRAINT leave_schemes_condition_of_service_id_fkey FOREIGN KEY (condition_of_service_id) REFERENCES public.conditions_of_service(id);


--
-- Name: leave_schemes leave_schemes_employee_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes
    ADD CONSTRAINT leave_schemes_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES public.employee_subtypes(id);


--
-- Name: leave_schemes leave_schemes_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_schemes
    ADD CONSTRAINT leave_schemes_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: leave_transactions leave_transactions_absence_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_transactions
    ADD CONSTRAINT leave_transactions_absence_type_id_fkey FOREIGN KEY (absence_type_id) REFERENCES public.absence_types(id);


--
-- Name: leave_transactions leave_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_transactions
    ADD CONSTRAINT leave_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: leave_transactions leave_transactions_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_transactions
    ADD CONSTRAINT leave_transactions_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_types leave_types_leave_scheme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_leave_scheme_id_fkey FOREIGN KEY (leave_scheme_id) REFERENCES public.leave_schemes(id);


--
-- Name: life_events life_events_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.life_events
    ADD CONSTRAINT life_events_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: medical_aid_scheme_history medical_aid_scheme_history_scheme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_aid_scheme_history
    ADD CONSTRAINT medical_aid_scheme_history_scheme_id_fkey FOREIGN KEY (scheme_id) REFERENCES public.medical_aid_schemes(id) ON DELETE CASCADE;


--
-- Name: medical_aid_schemes medical_aid_schemes_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: ofo_minor_groups ofo_minor_groups_sub_major_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_minor_groups
    ADD CONSTRAINT ofo_minor_groups_sub_major_group_id_fkey FOREIGN KEY (sub_major_group_id) REFERENCES public.ofo_sub_major_groups(id);


--
-- Name: ofo_occupations ofo_occupations_unit_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_occupations
    ADD CONSTRAINT ofo_occupations_unit_group_id_fkey FOREIGN KEY (unit_group_id) REFERENCES public.ofo_unit_groups(id);


--
-- Name: ofo_specialists ofo_specialists_occupation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_specialists
    ADD CONSTRAINT ofo_specialists_occupation_id_fkey FOREIGN KEY (occupation_id) REFERENCES public.ofo_occupations(id);


--
-- Name: ofo_sub_major_groups ofo_sub_major_groups_major_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_sub_major_groups
    ADD CONSTRAINT ofo_sub_major_groups_major_group_id_fkey FOREIGN KEY (major_group_id) REFERENCES public.ofo_major_groups(id);


--
-- Name: ofo_unit_groups ofo_unit_groups_minor_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ofo_unit_groups
    ADD CONSTRAINT ofo_unit_groups_minor_group_id_fkey FOREIGN KEY (minor_group_id) REFERENCES public.ofo_minor_groups(id);


--
-- Name: onboarding_checklists onboarding_checklists_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_checklists
    ADD CONSTRAINT onboarding_checklists_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: onboarding_items onboarding_items_checklist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_items
    ADD CONSTRAINT onboarding_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.onboarding_checklists(id);


--
-- Name: overtime_transactions overtime_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_transactions
    ADD CONSTRAINT overtime_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: overtime_transactions overtime_transactions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_transactions
    ADD CONSTRAINT overtime_transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);


--
-- Name: overtime_transactions overtime_transactions_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_transactions
    ADD CONSTRAINT overtime_transactions_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: pay_point_departments pay_point_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_point_departments
    ADD CONSTRAINT pay_point_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: pay_point_departments pay_point_departments_pay_point_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_point_departments
    ADD CONSTRAINT pay_point_departments_pay_point_id_fkey FOREIGN KEY (pay_point_id) REFERENCES public.pay_points(id) ON DELETE CASCADE;


--
-- Name: payment_batches payment_batches_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_batches
    ADD CONSTRAINT payment_batches_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--


--
-- Name: payroll_gl_journals payroll_gl_journals_payroll_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_gl_journals
    ADD CONSTRAINT payroll_gl_journals_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES public.payroll_runs(id);


--
-- Name: payroll_periods payroll_periods_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.payroll_cycles(id);


--
-- Name: payroll_results payroll_results_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.payroll_cycles(id);


--
-- Name: payroll_results payroll_results_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: payroll_results payroll_results_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id);


--
-- Name: payroll_results payroll_results_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: payroll_results payroll_results_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);


--
-- Name: payroll_results payroll_results_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--
-- Name: payroll_results payroll_results_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_results
    ADD CONSTRAINT payroll_results_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: payroll_run_errors payroll_run_errors_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_run_errors
    ADD CONSTRAINT payroll_run_errors_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: payroll_run_errors payroll_run_errors_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_run_errors
    ADD CONSTRAINT payroll_run_errors_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--
-- Name: payroll_runs payroll_runs_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.payroll_cycles(id);


--
-- Name: payroll_runs payroll_runs_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);


--
-- Name: performance_goals performance_goals_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: performance_goals performance_goals_parent_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_parent_goal_id_fkey FOREIGN KEY (parent_goal_id) REFERENCES public.performance_goals(id);


--
-- Name: performance_indicators performance_indicators_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_indicators
    ADD CONSTRAINT performance_indicators_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: performance_indicators performance_indicators_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_indicators
    ADD CONSTRAINT performance_indicators_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.performance_periods(id);


--
-- Name: performance_review_items performance_review_items_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_review_items
    ADD CONSTRAINT performance_review_items_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.performance_reviews(id);


--
-- Name: performance_reviews performance_reviews_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: permissions permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: pip_milestones pip_milestones_pip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_milestones
    ADD CONSTRAINT pip_milestones_pip_id_fkey FOREIGN KEY (pip_id) REFERENCES public.pip_plans(id);


--
-- Name: pip_plans pip_plans_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_plans
    ADD CONSTRAINT pip_plans_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: pip_plans pip_plans_initiated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pip_plans
    ADD CONSTRAINT pip_plans_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.employees(id);


--
-- Name: position_competencies position_competencies_competency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_competencies
    ADD CONSTRAINT position_competencies_competency_id_fkey FOREIGN KEY (competency_id) REFERENCES public.competencies(id);


--
-- Name: position_competencies position_competencies_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_competencies
    ADD CONSTRAINT position_competencies_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: position_history position_history_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history
    ADD CONSTRAINT position_history_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: position_history_snapshots position_history_snapshots_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.position_history_snapshots
    ADD CONSTRAINT position_history_snapshots_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: positions positions_condition_of_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_condition_of_service_id_fkey FOREIGN KEY (condition_of_service_id) REFERENCES public.conditions_of_service(id);


--
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: positions positions_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id);


--
-- Name: positions positions_employee_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES public.employee_subtypes(id);


--
-- Name: positions positions_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: positions positions_job_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_job_profile_id_fkey FOREIGN KEY (job_profile_id) REFERENCES public.job_profiles(id);


--
-- Name: positions positions_parent_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_parent_position_id_fkey FOREIGN KEY (parent_position_id) REFERENCES public.positions(id);


--
-- Name: positions positions_task_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_task_grade_id_fkey FOREIGN KEY (task_grade_id) REFERENCES public.task_grades(id);


--
-- Name: provinces provinces_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: recruitment_applicants recruitment_applicants_vacancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_applicants
    ADD CONSTRAINT recruitment_applicants_vacancy_id_fkey FOREIGN KEY (vacancy_id) REFERENCES public.recruitment_vacancies(id) ON DELETE CASCADE;


--
-- Name: recruitment_vacancies recruitment_vacancies_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_vacancies
    ADD CONSTRAINT recruitment_vacancies_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: recruitment_vacancies recruitment_vacancies_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_vacancies
    ADD CONSTRAINT recruitment_vacancies_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: retirement_fund_salary_heads retirement_fund_salary_heads_retirement_fund_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_salary_heads
    ADD CONSTRAINT retirement_fund_salary_heads_retirement_fund_type_id_fkey FOREIGN KEY (retirement_fund_type_id) REFERENCES public.retirement_fund_types(id) ON DELETE CASCADE;


--
-- Name: retirement_fund_salary_heads retirement_fund_salary_heads_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retirement_fund_salary_heads
    ADD CONSTRAINT retirement_fund_salary_heads_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id) ON DELETE CASCADE;


--
-- Name: retirement_fund_types retirement_fund_types_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: salary_increases salary_increases_bargaining_council_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_increases
    ADD CONSTRAINT salary_increases_bargaining_council_id_fkey FOREIGN KEY (bargaining_council_id) REFERENCES public.bargaining_councils(id);


--
-- Name: salary_increases salary_increases_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_increases
    ADD CONSTRAINT salary_increases_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: salary_increases salary_increases_task_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_increases
    ADD CONSTRAINT salary_increases_task_grade_id_fkey FOREIGN KEY (task_grade_id) REFERENCES public.task_grades(id);


--
-- Name: salary_transaction_group_items salary_transaction_group_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_group_items
    ADD CONSTRAINT salary_transaction_group_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.salary_transaction_groups(id) ON DELETE CASCADE;


--
-- Name: salary_transaction_group_items salary_transaction_group_items_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_transaction_group_items
    ADD CONSTRAINT salary_transaction_group_items_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id) ON DELETE CASCADE;


--
-- Name: salary_upper_limits salary_upper_limits_employee_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_upper_limits
    ADD CONSTRAINT salary_upper_limits_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES public.employee_subtypes(id);


--
-- Name: salary_upper_limits salary_upper_limits_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_upper_limits
    ADD CONSTRAINT salary_upper_limits_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: salary_upper_limits salary_upper_limits_job_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_upper_limits
    ADD CONSTRAINT salary_upper_limits_job_profile_id_fkey FOREIGN KEY (job_profile_id) REFERENCES public.job_profiles(id);


--
-- Name: shift_rosters shift_rosters_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rosters
    ADD CONSTRAINT shift_rosters_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: shift_rosters shift_rosters_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_rosters
    ADD CONSTRAINT shift_rosters_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.work_shifts(id);


--
-- Name: suburbs suburbs_town_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suburbs
    ADD CONSTRAINT suburbs_town_id_fkey FOREIGN KEY (town_id) REFERENCES public.towns(id);


--
-- Name: succession_pools succession_pools_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.succession_pools
    ADD CONSTRAINT succession_pools_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: succession_pools succession_pools_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.succession_pools
    ADD CONSTRAINT succession_pools_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id);


--
-- Name: task_grade_notches task_grade_notches_task_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grade_notches
    ADD CONSTRAINT task_grade_notches_task_grade_id_fkey FOREIGN KEY (task_grade_id) REFERENCES public.task_grades(id);


--
-- Name: task_grades task_grades_task_skill_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_grades
    ADD CONSTRAINT task_grades_task_skill_level_id_fkey FOREIGN KEY (task_skill_level_id) REFERENCES public.const_task_skill_levels(id);


--
-- Name: third_party_payments third_party_payments_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_party_payments
    ADD CONSTRAINT third_party_payments_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(id);


--
-- Name: third_party_payments third_party_payments_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_party_payments
    ADD CONSTRAINT third_party_payments_run_id_fkey FOREIGN KEY (run_id) REFERENCES public.payroll_runs(id);


--
-- Name: third_party_payments third_party_payments_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.third_party_payments
    ADD CONSTRAINT third_party_payments_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: towns towns_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.towns
    ADD CONSTRAINT towns_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: trade_classification_activities trade_classification_activities_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.const_trade_classification_activities
    ADD CONSTRAINT const_trade_classification_activities_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.const_trade_classification_groups(id);


--
-- Name: trade_unions trade_unions_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: training_records training_records_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_records
    ADD CONSTRAINT training_records_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.training_courses(id);


--
-- Name: training_records training_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_records
    ADD CONSTRAINT training_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: upper_limit_history upper_limit_history_upper_limit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limit_history
    ADD CONSTRAINT upper_limit_history_upper_limit_id_fkey FOREIGN KEY (upper_limit_id) REFERENCES public.salary_upper_limits(id);


--
-- Name: upper_limits upper_limits_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limits
    ADD CONSTRAINT upper_limits_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: upper_limits upper_limits_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.upper_limits
    ADD CONSTRAINT upper_limits_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id);


--
-- Name: users users_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: work_areas work_areas_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: work_areas work_areas_employment_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_areas
    ADD CONSTRAINT work_areas_employment_code_id_fkey FOREIGN KEY (employment_code_id) REFERENCES public.employment_codes(id);


--
-- Name: workflow_instances workflow_instances_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_definition_id_fkey FOREIGN KEY (definition_id) REFERENCES public.workflow_definitions(id);


--
-- Name: claim_configurations claim_configurations_employee_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_configurations
    ADD CONSTRAINT claim_configurations_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES public.employee_types(id);


--
-- Name: claim_configurations claim_configurations_sars_prescribed_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_configurations
    ADD CONSTRAINT claim_configurations_sars_prescribed_rate_id_fkey FOREIGN KEY (sars_prescribed_rate_id) REFERENCES public.sars_prescribed_rates(id);


--
-- Name: claim_configurations claim_configurations_salary_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_configurations
    ADD CONSTRAINT claim_configurations_salary_head_id_fkey FOREIGN KEY (salary_head_id) REFERENCES public.salary_heads(id);


--
-- Constant tables (system-wide reference data, const_ prefix)
--

CREATE TABLE public.const_sez_codes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    CONSTRAINT const_sez_codes_pkey PRIMARY KEY (id)
);

ALTER TABLE public.const_sez_codes OWNER TO postgres;

CREATE TABLE public.const_sic_subclasses (
    id integer NOT NULL,
    description character varying(500) NOT NULL,
    enabled boolean DEFAULT true,
    class_id integer,
    CONSTRAINT const_sic_subclasses_pkey PRIMARY KEY (id)
);

ALTER TABLE public.const_sic_subclasses OWNER TO postgres;

INSERT INTO public.const_sez_codes (id, code) VALUES (1, 'ZAR');

INSERT INTO public.const_sic_subclasses (id, description, enabled, class_id) VALUES
  (84111, 'General public administration at National Government level', true, 8411),
  (84112, 'General public administration at Provincial Government level', true, 8411),
  (84113, 'General public administration at Local Government level', true, 8411),
  (84121, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at National Government level', true, 8412),
  (84122, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at Provincial Government level', true, 8412),
  (84123, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at Local Government level', true, 8412),
  (84131, 'Regulation of and contribution to more efficient operation of businesses at National Government level', true, 8413),
  (84132, 'Regulation of and contribution to more efficient operation of businesses at Provincial Government level', true, 8413),
  (84133, 'Regulation of and contribution to more efficient operation of businesses at Local Government level', true, 8413),
  (84140, 'Extra budgetary account n.e.c.', true, 8414),
  (84210, 'Foreign affairs', true, 8421),
  (84220, 'Defence activities', true, 8422),
  (84231, 'Public order and safety activities at National Government level', true, 8423),
  (84232, 'Public order and safety activities at Provincial Government level', true, 8423),
  (84233, 'Public order and safety activities at Local Government level', true, 8423),
  (84300, 'Compulsory social security activities', true, 8430);

--
-- PostgreSQL database dump complete
--

\unrestrict HaLjZzuHV18W09DdlnrgINMmHwXFUKaGpZCLArKnmuBHA53vKwrzG91JebCKQsw

