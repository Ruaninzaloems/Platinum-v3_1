export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
  meta?: any;
  summary?: any;
  flagged_employees?: any[];
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
  meta?: { total: number; [key: string]: any };
  [key: string]: any;
}

export interface Employee {
  id: number;
  employee_code: string;
  id_number: string;
  title: string;
  initials: string;
  first_name: string;
  second_name: string;
  surname: string;
  known_as: string;
  date_of_birth: string;
  gender: string;
  language: string;
  marital_status: string;
  dependants: number;
  email_address: string;
  cell_number: string;
  joining_date: string;
  position_id: number;
  task_grade_id: number;
  current_notch: number;
  annual_salary: number;
  income_tax_number: string;
  nationality: string;
  employee_type_id: number;
  condition_of_service_id: number;
  status: string;
  race: string;
  disability_status: string;
  payment_type: string;
  photo_url: string;
  enabled: boolean;
  department_name?: string;
  position_title?: string;
  employee_type_name?: string;
  employee_subtype_name?: string;
  salary_type?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  parent_id: number | null;
  enabled: boolean;
}

export interface Position {
  id: number;
  position_code: string;
  position_title: string;
  department_id: number;
  task_grade_id: number;
  status: string;
  funded: boolean;
  enabled: boolean;
}

export interface TaskGrade {
  id: number;
  grade_code: string;
  grade_name: string;
  min_salary: number;
  max_salary: number;
  notch_count: number;
  enabled: boolean;
  start_date: string;
  end_date: string;
}

export interface TaskGradeNotch {
  id: number;
  task_grade_id: number;
  notch_number: number;
  min_salary: number;
  max_salary: number;
  start_date: string;
  end_date: string;
}

export interface EmployeeType {
  id: number;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface EmployeeSubtype {
  id: number;
  employee_type_id: number;
  code: string;
  name: string;
  enabled: boolean;
  exclude_uif: boolean;
  exclude_sdl: boolean;
  enable_bonus: boolean;
  start_date: string;
  end_date: string;
}

export interface ConditionOfService {
  id: number;
  code: string;
  name: string;
  leave_scheme_id: number;
  payroll_cycle_id: number;
  enabled: boolean;
  start_date: string;
  end_date: string;
}

export interface SalaryHead {
  id: number;
  code: string;
  name: string;
  transaction_type: string;
  calculation_type: string;
  percentage_of_basic: number;
  fixed_amount: number;
  enabled: boolean;
}

export interface PayrollRun {
  id: number;
  run_number: string;
  payroll_period_id: number;
  run_type: string;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  created_at: string;
}

export interface PayrollCycle {
  id: number;
  code: string;
  name: string;
  frequency: string;
  periods_per_year: number;
}

export interface PayrollPeriod {
  id: number;
  payroll_cycle_id: number;
  period_number: number;
  financial_year: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface LeaveTransaction {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  status: string;
  reason: string;
  employee_name?: string;
  leave_type_name?: string;
}

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  default_days: number;
  carry_over_allowed: boolean;
  max_carry_over: number;
  enabled: boolean;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  opening_balance: number;
  accrued: number;
  taken: number;
  current_balance: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_employees: number;
  new_hires_30d: number;
  total_positions: number;
  filled_positions: number;
  total_annual_salary: number;
  avg_salary: number;
}

export interface JobProfile {
  id: number;
  job_title: string;
  ofo_code: string;
  occupation: string;
  job_family_id: number;
  job_purpose: string;
  job_responsibility: string;
  reports_to_job_profile_id: number;
  reports_to_description: string;
  who_reports_to_position: string;
  who_are_peers: string;
  qualifications_required: string;
  experience_required: string;
  knowledge: string;
  skills: string;
  liaison_internal: string;
  internal_communication_purpose: string;
  liaison_external: string;
  external_communication_purpose: string;
  own_decision_making: string;
  superior_decision_making: string;
  can_draft_policies: boolean;
  can_escalate: boolean;
  can_approve: boolean;
  description: string;
  contractual_agreements: boolean;
  expenditure: boolean;
  preceding_questions: string;
  problem_solving: string;
  financial: string;
  planning: string;
  short_term: string;
  med_term: string;
  long_term: string;
  amount: number;
  task_grade_id: number;
  employee_type_id: number;
  employee_subtype_id: number;
  condition_of_service_id: number;
  salary_transaction_group_id: number;
  allow_overtime: boolean;
  performance_assessment: boolean;
  start_date: string;
  end_date: string;
  job_description_code: string;
  ofo_major_group_id: number;
  ofo_sub_major_group_id: number;
  ofo_minor_group_id: number;
  ofo_unit_group_id: number;
  ofo_occupation_id: number;
  specialist_id: number;
  employment_category_id: number;
  employment_code_id: number;
  work_area_id: number;
  core_function: boolean;
  no_of_positions: number;
  office_bound: boolean;
  shift_id: number;
  department_id: number;
  division_id: number;
  recommended_contractor_rate: number;
  scoa_costing_percentage: number;
  parent_id: number;
  status: number;
  upper_limit_id: number;
  is_active: boolean;
  enabled: boolean;
}

export interface SalaryTransactionGroup {
  id: number;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  item_count?: number;
}

export interface UpperLimit {
  id: number;
  code: string;
  employee_type_id: number;
  employee_subtype_id: number;
  job_profile_id: number;
  municipal_grading: string;
  start_date: string;
  end_date: string;
  minimum_value: number;
  midpoint_value: number;
  maximum_value: number;
  enabled: boolean;
  employee_type_name?: string;
  employee_subtype_name?: string;
  job_profile_name?: string;
}

export interface Municipality {
  id: number;
  name: string;
  code: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  sars_ref: string;
  uif_ref: string;
  sdl_ref: string;
  irp5_source: string;
  financial_year_start: string;
}
