const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/app');
const { testConnection } = require('./config/database');
const { setupSwagger } = require('./swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const employeeRoutes = require('./routes/employee.routes');
const departmentRoutes = require('./routes/department.routes');
const positionRoutes = require('./routes/position.routes');
const payrollRoutes = require('./routes/payroll.routes');
const leaveRoutes = require('./routes/leave.routes');
const benefitsRoutes = require('./routes/benefits.routes');
const timeRoutes = require('./routes/time.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const documentRoutes = require('./routes/document.routes');
const disciplinaryRoutes = require('./routes/disciplinary.routes');
const skillsRoutes = require('./routes/skills.routes');
const recruitmentRoutes = require('./routes/recruitment.routes');
const essRoutes = require('./routes/ess.routes');
const settingsRoutes = require('./routes/settings.routes');
const tradeUnionRoutes = require('./routes/trade-unions.routes');
const payPointRoutes = require('./routes/pay-points.routes');
const employmentChangeRoutes = require('./routes/employment-changes.routes');
const salaryTransactionRoutes = require('./routes/salary-transactions.routes');
const salaryStructureRoutes = require('./routes/salary-structure.routes');
const conversionRoutes = require('./routes/conversion.routes');
const glIntegrationRoutes = require('./routes/gl-integration.routes');
const overtimeRoutes = require('./routes/overtime.routes');
const installmentsRoutes = require('./routes/installments.routes');
const approvalsRoutes = require('./routes/approvals.routes');
const bankLookupRoutes = require('./routes/bank-lookup.routes');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));
app.use(cors(config.cors));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});
app.use('/api/', limiter);

app.disable('etag');
app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

setupSwagger(app);

app.use(express.static(path.join(__dirname, '..', '..', 'public', 'dist', 'browser'), {
  etag: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));
app.get('/_legacy', (req, res) => res.redirect('/'));
app.get('/_legacy/{*splat}', (req, res) => res.redirect('/'));

app.use(express.static(path.join(__dirname, '..', '..', 'public'), {
  etag: false,
}));
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));

app.use(`${config.apiPrefix}/health`, healthRoutes);
app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${config.apiPrefix}/employees`, employeeRoutes);
app.use(`${config.apiPrefix}/departments`, departmentRoutes);
app.use(`${config.apiPrefix}/positions`, positionRoutes);
app.use(`${config.apiPrefix}/payroll`, payrollRoutes);
app.use(`${config.apiPrefix}/leave`, leaveRoutes);
app.use(`${config.apiPrefix}/benefits`, benefitsRoutes);
app.use(`${config.apiPrefix}/time`, timeRoutes);
app.use(`${config.apiPrefix}/reports`, reportRoutes);
app.use(`${config.apiPrefix}/notifications`, notificationRoutes);
app.use(`${config.apiPrefix}/documents`, documentRoutes);
app.use(`${config.apiPrefix}/disciplinary`, disciplinaryRoutes);
app.use(`${config.apiPrefix}/skills`, skillsRoutes);
app.use(`${config.apiPrefix}/recruitment`, recruitmentRoutes);
app.use(`${config.apiPrefix}/ess`, essRoutes);
app.use(`${config.apiPrefix}/settings`, settingsRoutes);
app.use(`${config.apiPrefix}/trade-unions`, tradeUnionRoutes);
app.use(`${config.apiPrefix}/pay-points`, payPointRoutes);
app.use(`${config.apiPrefix}/employment-changes`, employmentChangeRoutes);
app.use(`${config.apiPrefix}/salary-transactions`, salaryTransactionRoutes);
app.use(`${config.apiPrefix}/salary-structure`, salaryStructureRoutes);
app.use(`${config.apiPrefix}/conversion`, conversionRoutes);
app.use(`${config.apiPrefix}/gl`, glIntegrationRoutes);
app.use(`${config.apiPrefix}/overtime`, overtimeRoutes);
app.use(`${config.apiPrefix}/installments`, installmentsRoutes);
app.use(`${config.apiPrefix}/approvals`, approvalsRoutes);
app.use(`${config.apiPrefix}/bank-lookups`, bankLookupRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'mSCOA HR & Payroll Management System',
    version: '1.0.0',
    apiDocs: '/api-docs',
  });
});

app.get('/{*splat}', (req, res) => {
  const angularIndex = path.join(__dirname, '..', '..', 'public', 'dist', 'browser', 'index.html');
  res.sendFile(angularIndex);
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

const startServer = async () => {
  await testConnection();

  const { query: dbQuery } = require('./config/database');
  try {
    await dbQuery(`ALTER TABLE claims ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100)`);
  } catch (e) {
    if (!e.message.includes('already exists')) console.log('Migration note (claims.reference_no):', e.message);
  }
  try {
    await dbQuery(`ALTER TABLE salary_heads ADD COLUMN IF NOT EXISTS is_overtime BOOLEAN NOT NULL DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE salary_heads ADD COLUMN IF NOT EXISTS overtime_multiplier_rate NUMERIC(4,2)`);
    await dbQuery(`UPDATE salary_heads SET is_overtime = FALSE WHERE is_overtime = TRUE AND (overtime_multiplier_rate IS NULL OR overtime_multiplier_rate <= 0)`);
    const chkExists = await dbQuery(`SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_overtime_multiplier_required' AND table_name = 'salary_heads'`);
    if (!chkExists.rows.length) {
      await dbQuery(`ALTER TABLE salary_heads ADD CONSTRAINT chk_overtime_multiplier_required CHECK (is_overtime = FALSE OR (overtime_multiplier_rate IS NOT NULL AND overtime_multiplier_rate > 0))`);
    }
  } catch (e) {
    if (!e.message.includes('already exists')) console.error('Migration ERROR (salary_heads.overtime):', e.message);
  }
  try {
    await dbQuery(`CREATE TABLE IF NOT EXISTS sars_prescribed_rates (
      id SERIAL PRIMARY KEY,
      tax_year INTEGER NOT NULL,
      description VARCHAR(200) NOT NULL,
      subtype_index VARCHAR(100) NOT NULL,
      irp5_code VARCHAR(50),
      rate NUMERIC(10,2) NOT NULL,
      effective_date DATE NOT NULL,
      end_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`CREATE TABLE IF NOT EXISTS claim_configurations (
      id SERIAL PRIMARY KEY,
      claim_type VARCHAR(50) NOT NULL,
      claim_subtype VARCHAR(100) NOT NULL,
      claim_group VARCHAR(100),
      employee_type_id INTEGER,
      client_policy VARCHAR(200),
      sars_prescribed_rate_id INTEGER REFERENCES sars_prescribed_rates(id),
      salary_head_id INTEGER,
      effective_date DATE NOT NULL,
      end_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER,
      updated_by INTEGER
    )`);
  } catch (e) {
    console.log('Migration note (claim tables):', e.message);
  }
  try {
    await dbQuery(`CREATE TABLE IF NOT EXISTS scoa_structure_sync (
      scoa_id INTEGER PRIMARY KEY,
      scoa_code VARCHAR(200),
      scoa_desc TEXT,
      scoa_short_desc VARCHAR(200),
      synced_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_scoa_structure_sync_code ON scoa_structure_sync(scoa_code)`);
    await dbQuery(`ALTER TABLE scoa_structure_sync ADD COLUMN IF NOT EXISTS scoa_parent_id INTEGER`);
    await dbQuery(`ALTER TABLE scoa_structure_sync ADD COLUMN IF NOT EXISTS level_id INTEGER`);
    await dbQuery(`ALTER TABLE scoa_structure_sync ADD COLUMN IF NOT EXISTS posting_level BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE scoa_structure_sync ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_scoa_structure_sync_parent ON scoa_structure_sync(scoa_parent_id)`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS development_plans (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      period_id INTEGER REFERENCES performance_periods(id),
      indicator_id INTEGER REFERENCES performance_indicators(id),
      plan_type VARCHAR(50) DEFAULT 'TRAINING',
      title VARCHAR(300) NOT NULL,
      description TEXT,
      provider VARCHAR(200),
      start_date DATE,
      end_date DATE,
      cost NUMERIC(12,2),
      status VARCHAR(20) DEFAULT 'PLANNED',
      progress INTEGER DEFAULT 0,
      completion_notes TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    try { await dbQuery(`ALTER TABLE development_plans ADD COLUMN IF NOT EXISTS completion_notes TEXT`); } catch(e) {}
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_dev_plans_employee ON development_plans(employee_id)`);
  } catch (e) {
    console.log('Migration note (scoa_structure_sync):', e.message);
  }

  try {
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS start_time TIME`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS end_time TIME`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100)`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS notes TEXT`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS cycle_id INTEGER`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS payroll_run_id INTEGER`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS override_project BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD COLUMN IF NOT EXISTS plan_project_item_id BIGINT`);
    await dbQuery(`ALTER TABLE overtime_transactions DROP CONSTRAINT IF EXISTS overtime_transactions_status_check`);
    await dbQuery(`ALTER TABLE overtime_transactions ADD CONSTRAINT overtime_transactions_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','RETURNED','PROCESSED'))`);
    await dbQuery(`CREATE TABLE IF NOT EXISTS overtime_transaction_history (
      id SERIAL PRIMARY KEY,
      overtime_transaction_id INTEGER NOT NULL REFERENCES overtime_transactions(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      performed_by INTEGER REFERENCES users(id),
      performed_at TIMESTAMP DEFAULT NOW(),
      comments TEXT,
      step_number INTEGER,
      status_after VARCHAR(20)
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_ot_history_tx ON overtime_transaction_history(overtime_transaction_id)`);
  } catch (e) {
    if (!e.message.includes('already exists')) console.log('Migration note (overtime):', e.message);
  }

  // === LEAVE MODULE PHASE 1 — Configuration foundation ===
  try {
    const renames = [
      ['leave_types', 'leave_types_legacy'],
      ['leave_schemes', 'leave_schemes_legacy'],
      ['leave_policies', 'leave_policies_legacy'],
      ['leave_transactions', 'leave_transactions_legacy'],
      ['employee_leave_balances', 'employee_leave_balances_legacy'],
      ['absence_types', 'absence_types_legacy'],
    ];
    for (const [oldName, newName] of renames) {
      const exists = await dbQuery(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
        [oldName]
      );
      if (exists.rows.length) {
        await dbQuery(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
      }
    }

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_classification (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      display_order INTEGER DEFAULT 0,
      enabled BOOLEAN DEFAULT TRUE,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`ALTER TABLE leave_classification ADD COLUMN IF NOT EXISTS created_by INTEGER`);
    await dbQuery(`ALTER TABLE leave_classification ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
    await dbQuery(`ALTER TABLE leave_classification ADD COLUMN IF NOT EXISTS updated_by INTEGER`);
    await dbQuery(`ALTER TABLE leave_classification ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    const seedClass = [
      ['ANNUAL', 'Annual', 1], ['SICK', 'Sick', 2], ['MATERNITY', 'Maternity', 3],
      ['PATERNITY', 'Paternity', 4], ['FAMILY_RESPONSIBILITY', 'Family Responsibility', 5],
      ['STUDY', 'Study', 6], ['UNPAID', 'Unpaid', 7], ['SPECIAL', 'Special', 8], ['OTHER', 'Other', 9],
    ];
    for (const [code, name, ord] of seedClass) {
      await dbQuery(
        `INSERT INTO leave_classification (code, name, display_order) VALUES ($1,$2,$3)
         ON CONFLICT (code) DO NOTHING`, [code, name, ord]);
    }

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_setup (
      id INTEGER PRIMARY KEY DEFAULT 1,
      enable_leave BOOLEAN DEFAULT FALSE,
      leave_start_date DATE,
      approval_levels INTEGER DEFAULT 1 CHECK (approval_levels BETWEEN 1 AND 4),
      reminder_enabled BOOLEAN DEFAULT FALSE,
      reminder_days_before INTEGER DEFAULT 0,
      reminder_frequency VARCHAR(20),
      prior_year_processing VARCHAR(50),
      adjustment_approver_1_id INTEGER REFERENCES employees(id),
      adjustment_approver_2_id INTEGER REFERENCES employees(id),
      adjustment_approver_3_id INTEGER REFERENCES employees(id),
      adjustment_approver_4_id INTEGER REFERENCES employees(id),
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT leave_setup_singleton CHECK (id = 1)
    )`);
    await dbQuery(`INSERT INTO leave_setup (id, enable_leave) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_type (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      classification_id INTEGER REFERENCES leave_classification(id),
      base_type VARCHAR(20) NOT NULL CHECK (base_type IN ('CALENDAR_DAYS','WORKING_DAYS','HOURS')),
      include_public_holidays BOOLEAN DEFAULT FALSE,
      paid BOOLEAN DEFAULT TRUE,
      gender_restriction VARCHAR(10),
      requires_document BOOLEAN DEFAULT FALSE,
      document_required_after_days INTEGER,
      carry_forward_allowed BOOLEAN DEFAULT FALSE,
      carry_forward_max_days NUMERIC(10,2),
      forfeit_excess BOOLEAN DEFAULT TRUE,
      pro_rata_on_join BOOLEAN DEFAULT TRUE,
      pro_rata_on_terminate BOOLEAN DEFAULT TRUE,
      max_accumulation NUMERIC(10,2),
      max_negative_balance NUMERIC(10,2) DEFAULT 0,
      payroll_linked_accrual BOOLEAN DEFAULT FALSE,
      enabled BOOLEAN DEFAULT TRUE,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_type_rule (
      id SERIAL PRIMARY KEY,
      leave_type_id INTEGER NOT NULL REFERENCES leave_type(id) ON DELETE CASCADE,
      deduction_priority INTEGER NOT NULL,
      rule_name VARCHAR(100),
      service_months_from INTEGER DEFAULT 0,
      service_months_to INTEGER,
      entitlement_days NUMERIC(10,2) NOT NULL DEFAULT 0,
      accrual_frequency VARCHAR(20) DEFAULT 'MONTHLY' CHECK (accrual_frequency IN ('MONTHLY','ANNUAL','ONCE_OFF','PAYROLL')),
      cycle_months INTEGER,
      max_accumulation NUMERIC(10,2),
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(leave_type_id, deduction_priority)
    )`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_scheme (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      employee_type_id INTEGER,
      employee_subtype_id INTEGER,
      condition_of_service_id INTEGER,
      start_date DATE,
      end_date DATE,
      enabled BOOLEAN DEFAULT TRUE,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_scheme_leave_type (
      id SERIAL PRIMARY KEY,
      leave_scheme_id INTEGER NOT NULL REFERENCES leave_scheme(id) ON DELETE CASCADE,
      leave_type_id INTEGER NOT NULL REFERENCES leave_type(id),
      display_order INTEGER DEFAULT 0,
      deleted_at TIMESTAMP,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`CREATE UNIQUE INDEX IF NOT EXISTS uq_leave_scheme_leave_type_active
      ON leave_scheme_leave_type (leave_scheme_id, leave_type_id) WHERE deleted_at IS NULL`);

    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_scheme_id INTEGER REFERENCES leave_scheme(id)`);
    await dbQuery(`ALTER TABLE leave_type ADD COLUMN IF NOT EXISTS start_date DATE`);
    await dbQuery(`ALTER TABLE leave_type ADD COLUMN IF NOT EXISTS end_date DATE`);
    await dbQuery(`ALTER TABLE leave_type ADD COLUMN IF NOT EXISTS calendar_color VARCHAR(20)`);
    await dbQuery(`ALTER TABLE leave_type ADD COLUMN IF NOT EXISTS calendar_abbreviation VARCHAR(10)`);
    await dbQuery(`ALTER TABLE leave_type ALTER COLUMN code DROP NOT NULL`);
  } catch (e) {
    console.error('Migration ERROR (leave module phase 1):', e.message);
  }

  // === LEAVE MODULE PHASE 2 — Transactions (Requests & Adjustments) ===
  try {
    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_transactions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_type(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days NUMERIC(8,2) NOT NULL DEFAULT 0,
      reason TEXT,
      document_path TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','APPROVED','REJECTED','RETURNED','CANCELLED')),
      reference_no VARCHAR(50),
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_transactions_employee ON leave_transactions(employee_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_transactions_leave_type ON leave_transactions(leave_type_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_transactions_status ON leave_transactions(status)`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_transaction_history (
      id SERIAL PRIMARY KEY,
      leave_transaction_id INTEGER NOT NULL REFERENCES leave_transactions(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      performed_by INTEGER REFERENCES users(id),
      performed_at TIMESTAMP DEFAULT NOW(),
      comments TEXT,
      step_number INTEGER,
      status_after VARCHAR(20)
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_tx_history ON leave_transaction_history(leave_transaction_id)`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_adjustments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_type(id),
      adjustment_type VARCHAR(30) NOT NULL
        CHECK (adjustment_type IN ('OPENING_BALANCE','ADJUSTED','ENCASHED')),
      adjustment_days NUMERIC(8,2) NOT NULL,
      effective_date DATE NOT NULL,
      reason TEXT,
      document_path TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','APPROVED','REJECTED','RETURNED','CANCELLED')),
      reference_no VARCHAR(50),
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_adjustments_employee ON leave_adjustments(employee_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_adjustments_leave_type ON leave_adjustments(leave_type_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_adjustments_status ON leave_adjustments(status)`);

    await dbQuery(`CREATE TABLE IF NOT EXISTS leave_adjustment_history (
      id SERIAL PRIMARY KEY,
      leave_adjustment_id INTEGER NOT NULL REFERENCES leave_adjustments(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      performed_by INTEGER REFERENCES users(id),
      performed_at TIMESTAMP DEFAULT NOW(),
      comments TEXT,
      step_number INTEGER,
      status_after VARCHAR(20)
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_leave_adj_history ON leave_adjustment_history(leave_adjustment_id)`);
  } catch (e) {
    console.error('Migration ERROR (leave module phase 2 - transactions):', e.message);
  }

  try {
    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_id INTEGER`);
    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_branch_code_id INTEGER`);
    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_type_id INTEGER`);
    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS account_holder_relationship VARCHAR(20)`);
  } catch (e) {
    console.error('Migration ERROR (employee banking details):', e.message);
  }

  try {
    await dbQuery(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(50)`);
  } catch (e) {
    console.error('Migration ERROR (employee emergency contact relationship):', e.message);
  }

  try {
    await dbQuery(`ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check`);
    await dbQuery(`ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check CHECK (action IN (
      'CREATE','UPDATE','DELETE','VIEW','APPROVE','REJECT','LOGIN','LOGOUT','ESS_CONTACT_UPDATE'
    ))`);
  } catch (e) {
    console.error('Migration ERROR (audit_log action check expansion):', e.message);
  }

  try {
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS comment TEXT`);
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS manual_input BOOLEAN DEFAULT FALSE`);
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS exception_type VARCHAR(50) CHECK (exception_type IN ('COMPLIANT','LATE_ARRIVAL','EARLY_DEPARTURE','SHORT_TIME','MISSING_CLOCKING','ABNORMAL_HOURS'))`);
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS period_start_date DATE`);
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS period_end_date DATE`);
    await dbQuery(`ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS input_mode VARCHAR(20) DEFAULT 'DAILY' CHECK (input_mode IN ('DAILY','PERIOD'))`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_emp_attendance_employee_date ON employee_attendance(employee_id, attendance_date)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_emp_attendance_exception ON employee_attendance(exception_type)`);
  } catch (e) {
    if (!e.message.includes('already exists') && !e.message.includes('multiple primary keys') && !e.message.includes('column') && !e.message.includes('constraint')) console.error('Migration ERROR (employee_attendance columns):', e.message);
  }

  try {
    const workingDays = ['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-08','2026-06-09','2026-06-10','2026-06-11','2026-06-12'];
    function mkRow(date, type) {
      if (type === 'COMPLIANT')        return [`${date} 08:00:00`, `${date} 17:00:00`, 9.0,  'COMPLIANT'];
      if (type === 'LATE_ARRIVAL')     return [`${date} 09:20:00`, `${date} 17:00:00`, 7.67, 'LATE_ARRIVAL'];
      if (type === 'EARLY_DEPARTURE')  return [`${date} 08:00:00`, `${date} 15:30:00`, 7.5,  'EARLY_DEPARTURE'];
      if (type === 'SHORT_TIME')       return [`${date} 08:00:00`, `${date} 12:00:00`, 4.0,  'SHORT_TIME'];
      if (type === 'MISSING_CLOCKING') return [null,                null,               0.0,  'MISSING_CLOCKING'];
      if (type === 'ABNORMAL_HOURS')   return [`${date} 06:00:00`, `${date} 22:00:00`, 16.0, 'ABNORMAL_HOURS'];
    }
    const C = 'COMPLIANT', L = 'LATE_ARRIVAL', E = 'EARLY_DEPARTURE', S = 'SHORT_TIME', M = 'MISSING_CLOCKING', A = 'ABNORMAL_HOURS';
    const demoEmps = [
      { code: 'EMP0014', first: 'Sipho',       last: 'Ndlovu',     gender: 'Male',   patterns: [C,C,C,C,C,C,C,C,C,C] },
      { code: 'EMP0015', first: 'Fatima',      last: 'Hartley',    gender: 'Female', patterns: [L,L,L,L,L,L,L,L,L,L] },
      { code: 'EMP0016', first: 'Brandon',     last: 'Swart',      gender: 'Male',   patterns: [E,E,E,E,E,E,E,E,E,E] },
      { code: 'EMP0017', first: 'Lerato',      last: 'Molefe',     gender: 'Female', patterns: [S,S,S,S,S,S,S,S,S,S] },
      { code: 'EMP0018', first: 'Pieter',      last: 'Venter',     gender: 'Male',   patterns: [M,M,M,M,M,C,C,C,C,C] },
      { code: 'EMP0019', first: 'Nomsa',       last: 'Dube',       gender: 'Female', patterns: [C,C,C,C,C,C,C,C,C,C] },
      { code: 'EMP0020', first: 'Wayne',       last: 'Kotze',      gender: 'Male',   patterns: [L,L,L,C,C,C,C,C,C,C] },
      { code: 'EMP0021', first: 'Ayanda',      last: 'Zulu',       gender: 'Female', patterns: [E,E,E,C,C,C,C,C,C,C] },
      { code: 'EMP0022', first: 'Elmarie',     last: 'Fourie',     gender: 'Female', patterns: [A,A,C,C,C,C,C,C,C,C] },
      { code: 'EMP0023', first: 'Sibusiso',    last: 'Khumalo',    gender: 'Male',   patterns: [L,L,L,L,C,C,C,C,C,C] },
      { code: 'EMP0024', first: 'Charlize',    last: 'Meyer',      gender: 'Female', patterns: [S,S,S,C,C,C,C,C,C,C] },
      { code: 'EMP0025', first: 'Lungelo',     last: 'Shabalala',  gender: 'Male',   patterns: [M,M,M,M,C,C,C,C,C,C] },
      { code: 'EMP0026', first: 'Rentia',      last: 'Pretorius',  gender: 'Female', patterns: [C,C,C,C,C,C,C,C,C,C] },
      { code: 'EMP0027', first: 'Mpho',        last: 'Sithole',    gender: 'Male',   patterns: [A,A,L,L,L,C,C,C,C,C] },
      { code: 'EMP0028', first: 'Gareth',      last: 'Williams',   gender: 'Male',   patterns: [E,E,S,S,C,C,C,C,C,C] },
      { code: 'EMP0029', first: 'Nokukhanya',  last: 'Mthembu',    gender: 'Female', patterns: [C,C,C,C,C,C,C,C,C,C] },
      { code: 'EMP0030', first: 'Dirk',        last: 'Boshoff',    gender: 'Male',   patterns: [L,L,L,L,L,C,C,C,C,C] },
    ];
    for (const emp of demoEmps) {
      const seqNum = parseInt(emp.code.replace('EMP', ''), 10);
      const idNum = `80010100${String(seqNum).padStart(4, '0')}0`;
      await dbQuery(
        `INSERT INTO employees (employee_code, id_number, first_name, surname, date_of_birth, gender, joining_date, employee_type_id, condition_of_service_id, status, payment_type, monthly_salary, annual_salary, working_hours_per_day, created_by, updated_by)
         VALUES ($1,$2,$3,$4,'1985-01-01',$5,'2020-01-01',1,2,'ACTIVE','EFT',25000,300000,8,1,1)
         ON CONFLICT (employee_code) DO NOTHING`,
        [emp.code, idNum, emp.first, emp.last, emp.gender]
      );
      const er = await dbQuery('SELECT id FROM employees WHERE employee_code=$1', [emp.code]);
      if (!er.rows.length) continue;
      const empId = er.rows[0].id;
      for (let i = 0; i < workingDays.length; i++) {
        const d = workingDays[i];
        const [ci, co, hw, exType] = mkRow(d, emp.patterns[i]);
        await dbQuery(
          `INSERT INTO employee_attendance (employee_id, attendance_date, clock_in, clock_out, hours_worked, status, exception_type, manual_input, comment, input_mode, source)
           SELECT $1,$2,$3,$4,$5,'PRESENT',$6,TRUE,'Demo attendance record','DAILY','MANUAL'
           WHERE NOT EXISTS (SELECT 1 FROM employee_attendance WHERE employee_id=$1 AND attendance_date=$2)`,
          [empId, d, ci, co, hw, exType]
        );
      }
    }
  } catch (e) {
    if (!e.message.includes('already exists')) console.error('Migration ERROR (attendance demo seed):', e.message);
  }

  try {
    await dbQuery(`CREATE TABLE IF NOT EXISTS employee_shift_assignments (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      shift_rotation_id INTEGER NOT NULL REFERENCES shift_rotations(id),
      effective_from DATE NOT NULL,
      effective_to DATE NOT NULL DEFAULT '9999-12-31',
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER
    )`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_emp_shift_assign_employee ON employee_shift_assignments(employee_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_emp_shift_assign_rotation ON employee_shift_assignments(shift_rotation_id)`);
  } catch (e) {
    console.error('Migration ERROR (employee_shift_assignments):', e.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`mSCOA HR & Payroll System running on port ${PORT}`);
    console.log(`API Documentation: http://0.0.0.0:${PORT}/api-docs`);
    console.log(`API Base URL: http://0.0.0.0:${PORT}${config.apiPrefix}`);
    console.log(`Environment: ${config.env}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
