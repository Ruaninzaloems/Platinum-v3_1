/**
 * API Route Smoke Tests
 * Uses supertest to call the Express app directly without a running server.
 * All database and service calls are mocked — no real DB connection is needed.
 *
 * Coverage:
 *  - Leave API (classifications, setup, types, schemes, validation)
 *  - Employee API (list, get by id, create validation, lookups)
 *  - Overtime API (list, create validation, can-approve)
 *  - Claims API (list, can-approve)
 *  - Settings API (salary-heads, titles, tax-years, active-tax-year)
 *  - GL Integration API (salary-heads, scoa segment)
 *  - Payroll API (cycles, periods, open periods, cycle validation)
 *  - Wages API (transaction list, validation, can-approve)
 *  - Payroll Run transitions (find run, results-summary, lock, unlock)
 *  - Reports API (payroll-totals, emp201, payslip-by-run, export/employees)
 *  - SDL calculation (pure function)
 */

// ─── Mocks (before any require of the mocked modules) ──────────────────────

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { connect: jest.fn() },
}));

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, username: 'admin', roles: ['admin'] };
    next();
  },
  authorize: () => (req, res, next) => next(),
}));

jest.mock('../middleware/auditLog', () => ({
  auditLog: () => (req, res, next) => next(),
}));

jest.mock('../middleware/historyTracker', () => ({
  trackEmployeeChanges: (req, res, next) => next(),
}));

jest.mock('../middleware/validation', () => ({
  paginationMiddleware: (req, res, next) => {
    req.pagination = { page: 1, limit: 20, offset: 0 };
    next();
  },
  validateEmployeeMiddleware: (req, res, next) => next(),
}));

jest.mock('../services/notification.service', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/workflow.service', () => ({
  initWorkflow: jest.fn().mockResolvedValue(null),
  resolveWorkflowDefinition: jest.fn().mockResolvedValue(null),
  autoAdvanceInitiatorSteps: jest.fn().mockResolvedValue(null),
  actionStep: jest.fn().mockResolvedValue({ status: 'APPROVED', instance_status: 'APPROVED' }),
  getMyPendingActions: jest.fn().mockResolvedValue([]),
  getDelegations: jest.fn().mockResolvedValue([]),
  checkEscalations: jest.fn().mockResolvedValue([]),
}));

jest.mock('../services/transaction-approval.service', () => ({
  handleApproval: jest.fn().mockResolvedValue({ success: true, finalApproval: true }),
  handleRejection: jest.fn().mockResolvedValue({ success: true }),
  handleReturn: jest.fn().mockResolvedValue({ success: true }),
  getMyPendingApprovals: jest.fn().mockResolvedValue({ items: [], counts: { total: 0 } }),
  getInPeriodUnapprovedTransactions: jest.fn().mockResolvedValue({ blocking: false }),
  getWorkflowStatus: jest.fn().mockResolvedValue(null),
  getWorkflowStatusBatch: jest.fn().mockResolvedValue({}),
  checkAutoApprove: jest.fn().mockResolvedValue(false),
  writeHistory: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/overtime-calc.service', () => ({
  calculateOvertimeAmount: jest.fn().mockResolvedValue({ multiplier: 1.5, amount: 1000, hourlyRate: 100 }),
  resolveOvertimePeriod: jest.fn().mockResolvedValue({ period_id: 1, cycle_id: 1 }),
  calculateOvertimeHourlyRate: jest.fn().mockResolvedValue({ hourlyRate: 100, annualSalary: 240000, workHoursPerDay: 8 }),
}));

jest.mock('../services/payroll-engine', () => ({
  calculateForEmployee: jest.fn().mockResolvedValue({}),
  calculateMock: jest.fn().mockResolvedValue({}),
  loadTaxTables: jest.fn().mockResolvedValue({}),
  calculateETI: jest.fn().mockReturnValue(0),
  getAge: jest.fn().mockReturnValue(35),
  resolveTaxYear: jest.fn().mockReturnValue(2026),
  resolveMonthlyBasic: jest.fn().mockResolvedValue(20000),
  calculatePayslipForEmployee: jest.fn().mockResolvedValue({ nettPay: 18000 }),
  normalizeTransactionsToMonthly: jest.fn().mockReturnValue([]),
  evaluateFormulaV2: jest.fn().mockReturnValue(0),
  buildFormulaVariables: jest.fn().mockReturnValue({}),
  calculateSDL: jest.fn((results, contributions, tables, periods, exclude) => {
    if (exclude) return 0;
    const earningTotal = results
      .filter(r => r.transaction_type === 'EARNING' && tables.irp5Map[r.irp5_code])
      .reduce((sum, r) => sum + r.amount, 0);
    return parseFloat(((earningTotal * periods * tables.sdl.rate) / periods).toFixed(2));
  }),
  calculatePAYE: jest.fn().mockReturnValue(5000),
  calculateUIF: jest.fn().mockReturnValue(150),
  calculateMedicalCredits: jest.fn().mockReturnValue(364),
  getEmployeeMedicalAidInfo: jest.fn().mockResolvedValue(null),
  getEmployeeRetirementFundInfo: jest.fn().mockResolvedValue(null),
  getEmployeeUnionInfo: jest.fn().mockResolvedValue(null),
  resolveMOCRule: jest.fn().mockReturnValue(null),
  loadMOCRules: jest.fn().mockResolvedValue([]),
  applyMOCRounding: jest.fn().mockReturnValue(0),
  resolveEmployeeSalaryStructure: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/bank-lookup.service', () => ({
  findBank: jest.fn().mockResolvedValue(null),
  findBranch: jest.fn().mockResolvedValue(null),
  findAccountType: jest.fn().mockResolvedValue(null),
}));

jest.mock('../data/sars-tax-defaults', () => ({
  brackets: [],
  rebates: [],
  thresholds: [],
  medicalCredits: [],
  uif: { rate: 0.01, max: 177 },
  sdl: { rate: 0.01, threshold: 500000 },
}));

jest.mock('../routes/department.routes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/', (req, res) => res.json({ success: true, data: [] }));
  return Object.assign(router, {
    enrichDeptDiv: jest.fn().mockResolvedValue(undefined),
    enrichSingle: jest.fn().mockResolvedValue(undefined),
    getDepartments: jest.fn().mockResolvedValue([]),
    getDivisions: jest.fn().mockResolvedValue([]),
  });
});

jest.mock('../services/payslip.service', () => ({
  generatePayslip: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateEmploymentLetter: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateBatchPayslips: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

jest.mock('../services/statutory-reports.service', () => ({
  generateIRP5: jest.fn().mockResolvedValue({ irp5s: [] }),
  generateEMP201: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  generateEMP501: jest.fn().mockResolvedValue({ emp501: {} }),
  generateEasyFile: jest.fn().mockResolvedValue(''),
  generateUI19: jest.fn().mockResolvedValue([]),
  generateAllIRP5sPDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

jest.mock('../services/eft.service', () => ({
  generateACBFile: jest.fn().mockResolvedValue('ACB'),
}));

jest.mock('../services/report-export.service', () => ({
  exportToExcel: jest.fn().mockResolvedValue(Buffer.from('xlsx')),
  exportToCSV: jest.fn().mockResolvedValue('csv'),
}));

jest.mock('../services/payroll-totals.service', () => ({
  getPayrollTotals: jest.fn().mockResolvedValue({ totals: [] }),
  default: { getPayrollTotals: jest.fn().mockResolvedValue({ totals: [] }) },
}));

// ─── App setup ──────────────────────────────────────────────────────────────

const db = require('../config/database');
const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

const leaveRoutes = require('../routes/leave.routes');
const employeeRoutes = require('../routes/employee.routes');
const overtimeRoutes = require('../routes/overtime.routes');
const timeRoutes = require('../routes/time.routes');
const settingsRoutes = require('../routes/settings.routes');
const glRoutes = require('../routes/gl-integration.routes');
const payrollRoutes = require('../routes/payroll.routes');
const reportRoutes = require('../routes/report.routes');
const essRoutes = require('../routes/ess.routes');

app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/overtime', overtimeRoutes);
app.use('/api/v1/time', timeRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/gl', glRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/ess', essRoutes);

// ─── Leave Routes ───────────────────────────────────────────────────────────

describe('GET /api/v1/leave/classifications', () => {
  beforeEach(() => db.query.mockReset());

  test('200 with data array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Annual', code: 'ANN', enabled: true, display_order: 1 }] });
    const res = await request(app).get('/api/v1/leave/classifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/leave/setup', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns leave setup singleton', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, enable_leave: true, leave_start_date: '2024-03-01' }] });
    const res = await request(app).get('/api/v1/leave/setup');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('200 returns null when no setup configured', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/leave/setup');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe('PUT /api/v1/leave/setup', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when enable_leave=true but no leave_start_date', async () => {
    const res = await request(app).put('/api/v1/leave/setup').send({ enable_leave: true });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('200 when valid payload provided', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, enable_leave: true, leave_start_date: '2024-03-01' }] });
    const res = await request(app)
      .put('/api/v1/leave/setup')
      .send({ enable_leave: true, leave_start_date: '2024-03-01' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/leave/types', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns leave types array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Annual Leave', code: 'ANN', base_type: 'WORKING_DAYS' }] });
    const res = await request(app).get('/api/v1/leave/types');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/leave/types/:id', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns leave type with rules', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Annual Leave', code: 'ANN' }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/leave/types/1');
    expect(res.status).toBe(200);
    expect(res.body.data.rules).toBeDefined();
  });

  test('404 for non-existent leave type', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/leave/types/9999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/leave/schemes', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns leave schemes array', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Standard', code: 'STD', leave_type_count: '2', employee_count: '10' }] });
    const res = await request(app).get('/api/v1/leave/schemes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/leave/schemes/:id', () => {
  beforeEach(() => db.query.mockReset());

  test('404 for non-existent scheme', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/leave/schemes/9999');
    expect(res.status).toBe(404);
  });

  test('200 returns scheme with leave_types array', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Standard', code: 'STD' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Annual Leave', code: 'ANN' }] });
    const res = await request(app).get('/api/v1/leave/schemes/1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.leave_types)).toBe(true);
  });
});

describe('POST /api/v1/leave/schemes — validation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when code or name missing', async () => {
    const getClientMock = { query: jest.fn(), release: jest.fn() };
    getClientMock.query.mockResolvedValue({ rows: [] });
    db.getClient.mockResolvedValue(getClientMock);
    const res = await request(app).post('/api/v1/leave/schemes').send({ code: 'STD' });
    expect(res.status).toBe(400);
  });

  test('400 when no leave_type_ids provided', async () => {
    const getClientMock = { query: jest.fn(), release: jest.fn() };
    getClientMock.query.mockResolvedValue({ rows: [] });
    db.getClient.mockResolvedValue(getClientMock);
    const res = await request(app)
      .post('/api/v1/leave/schemes')
      .send({ code: 'STD', name: 'Standard Scheme', leave_type_ids: [] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/leave/validation/invalid-employee-schemes', () => {
  beforeEach(() => db.query.mockReset());

  test('returns empty array when leave is disabled', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ enable_leave: false }] });
    const res = await request(app).get('/api/v1/leave/validation/invalid-employee-schemes');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('returns employees with missing or mismatched schemes when leave enabled', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ enable_leave: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, employee_code: 'E001', reason: 'MISSING' }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/leave/validation/invalid-employee-schemes');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ─── Employee Routes ─────────────────────────────────────────────────────────

describe('GET /api/v1/employees', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns paginated employee list', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe', status: 'ACTIVE' }] });
    const res = await request(app).get('/api/v1/employees');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/employees/:id', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns employee detail', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe', status: 'ACTIVE' }],
    });
    const res = await request(app).get('/api/v1/employees/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(1);
  });

  test('404 when employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/employees/9999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/employees — create with no banking details', () => {
  beforeEach(() => db.query.mockReset());

  test('201 when minimal payload succeeds without banking errors', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 42, employee_code: 'E042', first_name: 'Jane', surname: 'Doe' }],
    });
    const res = await request(app)
      .post('/api/v1/employees')
      .send({ first_name: 'Jane', surname: 'Doe', joining_date: '2026-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(42);
  });
});

describe('GET /api/v1/employees/lookups/employee-all', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns lookup object with departments, titles, genders, etc.', async () => {
    // getDepartments and getDivisions are mocked; then 8 DB queries for lookup tables
    db.query
      .mockResolvedValue({ rows: [] }); // all DB lookups return empty
    const res = await request(app).get('/api/v1/employees/lookups/employee-all');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('titles');
    expect(res.body.data).toHaveProperty('genders');
    expect(res.body.data).toHaveProperty('departments');
  });
});

// ─── Overtime Routes ──────────────────────────────────────────────────────────

describe('GET /api/v1/overtime', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns paginated overtime list', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/overtime');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/overtime — validation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when employee_id, salary_head_id, or overtime_date missing', async () => {
    const res = await request(app)
      .post('/api/v1/overtime')
      .send({ employee_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/overtime/can-approve', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns canApprove:true when no workflow definition exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // no workflow definitions → anyone can approve
    const res = await request(app).get('/api/v1/overtime/can-approve');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canApprove).toBe(true);
  });
});

// ─── Claims Routes ────────────────────────────────────────────────────────────

describe('GET /api/v1/time/claims', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns paginated claims list', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/time/claims');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/time/claims — validation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/time/claims').send({ employee_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 when TRAVEL claim has kilometres <= 0', async () => {
    const res = await request(app).post('/api/v1/time/claims').send({
      employee_id: 1, claim_type: 'TRAVEL', start_date: '2026-05-01', amount: 500, kilometres: 0,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/kilometres/i);
  });

  test('400 when amount <= 0', async () => {
    const res = await request(app).post('/api/v1/time/claims').send({
      employee_id: 1, claim_type: 'S_AND_T', start_date: '2026-05-01', amount: 0,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/amount/i);
  });
});

describe('GET /api/v1/time/claims/configurations-by-type', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns claim configurations for a given type', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, claim_type: 'S & T', claim_subtype: 'Breakfast', sars_rate: '150.00', client_policy: null }],
    });
    const res = await request(app).get('/api/v1/time/claims/configurations-by-type?claim_type=S_AND_T');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('200 returns all configurations when no type filter provided', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/time/claims/configurations-by-type');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('PATCH /api/v1/time/claims/:id/approve', () => {
  beforeEach(() => db.query.mockReset());

  test('200 when approval succeeds (delegated to transaction-approval service)', async () => {
    const res = await request(app).patch('/api/v1/time/claims/1/approve').send({ comments: 'OK' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.finalApproval).toBe(true);
  });
});

describe('PATCH /api/v1/time/claims/:id/reject', () => {
  beforeEach(() => db.query.mockReset());

  test('200 when rejection succeeds (delegated to transaction-approval service)', async () => {
    const res = await request(app).patch('/api/v1/time/claims/1/reject').send({ comments: 'Not compliant' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/time/claims/can-approve', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns canApprove:true when no CLAIM workflow definition exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/time/claims/can-approve');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canApprove).toBe(true);
  });
});

// ─── Overtime approval / rejection / history ──────────────────────────────────

describe('PATCH /api/v1/overtime/:id/approve', () => {
  beforeEach(() => db.query.mockReset());

  test('200 when overtime approval succeeds', async () => {
    const res = await request(app).patch('/api/v1/overtime/1/approve').send({ comments: 'OK' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.finalApproval).toBe(true);
  });
});

describe('PATCH /api/v1/overtime/:id/reject', () => {
  beforeEach(() => db.query.mockReset());

  test('200 when overtime rejection succeeds', async () => {
    const res = await request(app).patch('/api/v1/overtime/1/reject').send({ comments: 'Hours incorrect' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/v1/overtime/:id/return', () => {
  beforeEach(() => db.query.mockReset());

  test('200 when overtime return succeeds', async () => {
    const res = await request(app).patch('/api/v1/overtime/1/return').send({ comments: 'Needs correction' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/v1/overtime/bulk-approve', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when ids array is empty or missing', async () => {
    const res = await request(app).post('/api/v1/overtime/bulk-approve').send({ ids: [] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('200 processes ids and returns approved/failed counts', async () => {
    const res = await request(app).post('/api/v1/overtime/bulk-approve').send({ ids: [1, 2, 3] });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('approved');
    expect(res.body.data).toHaveProperty('failed');
  });
});

describe('POST /api/v1/overtime/bulk-reject', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when ids array is missing', async () => {
    const res = await request(app).post('/api/v1/overtime/bulk-reject').send({ comments: 'Reason' });
    expect(res.status).toBe(400);
  });

  test('400 when comments/reason are missing', async () => {
    const res = await request(app).post('/api/v1/overtime/bulk-reject').send({ ids: [1] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/reason|comment/i);
  });
});

describe('GET /api/v1/overtime/:id/history', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns overtime audit history rows', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, overtime_transaction_id: 5, action: 'SUBMITTED', performed_by: 1, performed_by_name: 'admin', performed_at: '2026-05-01T09:00:00Z', comments: null },
        { id: 2, overtime_transaction_id: 5, action: 'APPROVED', performed_by: 2, performed_by_name: 'supervisor', performed_at: '2026-05-02T10:00:00Z', comments: 'OK' },
      ],
    });
    const res = await request(app).get('/api/v1/overtime/5/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[1].action).toBe('APPROVED');
  });
});

// ─── Settings Routes ──────────────────────────────────────────────────────────

describe('GET /api/v1/settings/salary-heads', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns salary heads list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING' }] });
    const res = await request(app).get('/api/v1/settings/salary-heads');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/settings/titles', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns paginated titles', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Mr' }, { id: 2, name: 'Ms' }] });
    const res = await request(app).get('/api/v1/settings/titles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/settings/tax-years', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns available tax years list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ tax_year: 2026 }, { tax_year: 2025 }] });
    const res = await request(app).get('/api/v1/settings/tax-years');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/settings/active-tax-year', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns active tax year', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ tax_year: 2026, is_active: true }] });
    const res = await request(app).get('/api/v1/settings/active-tax-year');
    expect(res.status).toBe(200);
    expect(res.body.data.tax_year).toBe(2026);
  });
});

// ─── GL Integration Routes ────────────────────────────────────────────────────

describe('GET /api/v1/gl/salary-heads', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns GL-mapped salary heads', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, code: 'BASIC', name: 'Basic Salary', scoa_item_id_permanent_staff: null }],
    });
    const res = await request(app).get('/api/v1/gl/salary-heads');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('PUT /api/v1/gl/salary-heads/:id/gl-mapping', () => {
  beforeEach(() => db.query.mockReset());

  test('404 when salary head does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).put('/api/v1/gl/salary-heads/9999/gl-mapping').send({});
    expect(res.status).toBe(404);
  });

  test('200 upserts GL mapping and inserts a payroll_gl_history row', async () => {
    const glRow = {
      id: 10, salary_head_id: 1, fin_year: 2026, start_date: '1900-01-01', end_date: '9999-12-31',
      journal_entry_only: false, scoa_project_id: null, suspense_scoa_item_id: 42,
      suspense_scoa_item_credit_id: null, scoa_item_id_permanent_staff: 55,
      scoa_item_id_permanent_staff_meta: null, earning_not_applicable_post_retirement: false,
      scoa_item_id_post_retirement: null, scoa_item_id_post_retirement_meta: null,
      override_project: false, plan_project_item_id: null,
      scoa_item_id: null, scoa_item_id_meta: null,
      vendor_id: null, vendor_scoa_project_id: null, vendor_scoa_id: null,
    };
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })      // salary_heads lookup
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })     // payroll_gl_items (existing → UPDATE)
      .mockResolvedValueOnce({ rows: [glRow] })           // UPSERT RETURNING *
      .mockResolvedValueOnce({ rows: [] });               // payroll_gl_history INSERT
    const res = await request(app)
      .put('/api/v1/gl/salary-heads/1/gl-mapping')
      .send({ fin_year: 2026, suspense_scoa_item_id: 42, scoa_item_id_permanent_staff: 55 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.salary_head_id).toBe(1);
    // Four DB calls: lookup, existing GL check, upsert, history insert
    expect(db.query).toHaveBeenCalledTimes(4);
  });
});

describe('GET /api/v1/gl/scoa/:segment', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns SCOA items for a given segment', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, code: '5000', description: 'Employee Related Costs' }] });
    const res = await request(app).get('/api/v1/gl/scoa/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── Payroll Routes ───────────────────────────────────────────────────────────

describe('GET /api/v1/payroll/cycles', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns payroll cycles list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Monthly', cycle_type: 'MONTHLY', enabled: true }] });
    const res = await request(app).get('/api/v1/payroll/cycles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/payroll/cycles — validation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when required fields are missing', async () => {
    const res = await request(app).post('/api/v1/payroll/cycles').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/payroll/periods', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns payroll periods', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, cycle_id: 1, start_date: '2026-05-01', end_date: '2026-05-31', status: 'OPEN' }],
    });
    const res = await request(app).get('/api/v1/payroll/periods');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/payroll/periods/open', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when cycle_id query param is missing', async () => {
    const res = await request(app).get('/api/v1/payroll/periods/open');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('200 returns open period for given cycle_id', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, cycle_id: 1, start_date: '2026-05-01', end_date: '2026-05-31', status: 'OPEN', cycle_name: 'Monthly', cycle_type: 'MONTHLY' }],
    });
    const res = await request(app).get('/api/v1/payroll/periods/open?cycle_id=1');
    expect(res.status).toBe(200);
    expect(res.body.data.cycle_id).toBe(1);
    expect(res.body.data.status).toBe('OPEN');
  });
});

// ─── SDL calculation (pure function, pulled from real payroll-engine) ─────────

const { calculateSDL: realCalculateSDL } = jest.requireActual('../services/payroll-engine');

describe('calculateSDL (real function) — 1% of remuneration', () => {
  const TAX_TABLES = {
    sdl: { rate: 0.01, threshold: 500000 },
    irp5Map: {
      '3601': { type: 1, taxable_percentage: 100, start_date: null, end_date: null },
    },
  };

  test('SDL = 1% of annual taxable earnings ÷ periodsPerYear', () => {
    const results = [{ transaction_type: 'EARNING', irp5_code: '3601', amount: 30000 }];
    const sdl = realCalculateSDL(results, [], TAX_TABLES, 12, false);
    expect(sdl).toBeCloseTo((30000 * 12 * 0.01) / 12, 2);
  });

  test('exclude_sdl flag returns 0', () => {
    const results = [{ transaction_type: 'EARNING', irp5_code: '3601', amount: 50000 }];
    expect(realCalculateSDL(results, [], TAX_TABLES, 12, true)).toBe(0);
  });

  test('non-EARNING transactions not included in SDL base', () => {
    const results = [
      { transaction_type: 'DEDUCTION', irp5_code: '3601', amount: 5000 },
      { transaction_type: 'COMPANY_CONTRIBUTION', irp5_code: '3601', amount: 5000 },
    ];
    expect(realCalculateSDL(results, [], TAX_TABLES, 12, false)).toBe(0);
  });

  test('irp5_code not in irp5Map: excluded from SDL base', () => {
    const results = [{ transaction_type: 'EARNING', irp5_code: null, amount: 30000 }];
    expect(realCalculateSDL(results, [], TAX_TABLES, 12, false)).toBe(0);
  });
});

// ─── Wages Routes ─────────────────────────────────────────────────────────────

describe('GET /api/v1/payroll/wages/transactions', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns paginated wage transactions list', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 1, employee_id: 1, employee_code: 'E001', first_name: 'Tom', surname: 'Smith',
          salary_head_id: 2, head_code: 'BASIC_HOURLY', period_id: 10, cycle_id: 1,
          hours: 8, days: null, rate: 100, amount: 800, status: 'PENDING',
          reference_no: null, notes: null, created_at: '2026-05-05T09:00:00Z',
        }],
      });
    const res = await request(app).get('/api/v1/payroll/wages/transactions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/v1/payroll/wages/transactions — validation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when employee_id, salary_head_id, period_id, or cycle_id missing', async () => {
    const res = await request(app)
      .post('/api/v1/payroll/wages/transactions')
      .send({ employee_id: 1, salary_head_id: 2 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 when employee not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // employee lookup → not found
    const res = await request(app)
      .post('/api/v1/payroll/wages/transactions')
      .send({ employee_id: 9999, salary_head_id: 2, period_id: 10, cycle_id: 1, hours: 8 });
    expect(res.status).toBe(404);
  });

  test('400 when employee has Task Grade (not a Rate Based employee)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ salary_based_on: 'FIXED', task_grade_id: 3, jp_task_grade_id: null, upper_limit_id: null, wage_rate: null, working_hours_per_month: 176, working_days_per_month: 22 }],
    });
    const res = await request(app)
      .post('/api/v1/payroll/wages/transactions')
      .send({ employee_id: 1, salary_head_id: 2, period_id: 10, cycle_id: 1, hours: 8 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Rate Based/i);
  });
});

describe('GET /api/v1/payroll/wages/can-approve', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns canApprove:true when no WAGE workflow definition exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // no workflow_definitions → anyone can approve
    const res = await request(app).get('/api/v1/payroll/wages/can-approve');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.canApprove).toBe(true);
  });
});

// ─── Payroll Run Transitions ──────────────────────────────────────────────────

describe('GET /api/v1/payroll/runs/find', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when cycle_id or period_id query params are missing', async () => {
    const res = await request(app).get('/api/v1/payroll/runs/find?cycle_id=1');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/cycle_id and period_id/i);
  });

  test('200 returns run data when found', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 5, cycle_id: 1, period_id: 10, run_type: 'TRIAL', status: 'COMPLETED',
        payment_date: '2026-05-31', locked_at: null, approved_at: null,
        created_at: '2026-05-01T08:00:00Z', cycle_name: 'Monthly',
        period_start: '2026-05-01', period_end: '2026-05-31',
      }],
    });
    const res = await request(app).get('/api/v1/payroll/runs/find?cycle_id=1&period_id=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(5);
    expect(res.body.data.run_type).toBe('TRIAL');
  });

  test('200 returns null data when no run exists for cycle+period', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/payroll/runs/find?cycle_id=99&period_id=99');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe('GET /api/v1/payroll/runs/:id/results-summary', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns results summary array with totals', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { emp_id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe', reason: 'CALCULATED', salary: 40000, earnings: 42000, deductions: 8000, contributions: 3000, fringe: 500, nett_salary: 34000 },
          { emp_id: 2, employee_code: 'E002', first_name: 'Tom', surname: 'Smith', reason: 'CALCULATED', salary: 30000, earnings: 32000, deductions: 5000, contributions: 2000, fringe: 0, nett_salary: 27000 },
        ],
      });
    const res = await request(app).get('/api/v1/payroll/runs/5/results-summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });
});

describe('POST /api/v1/payroll/runs/:id/lock', () => {
  beforeEach(() => db.query.mockReset());

  test('404 when run does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // run not found
    const res = await request(app).post('/api/v1/payroll/runs/9999/lock').send({});
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('400 when run status is not COMPLETED (cannot lock)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ run_type: 'TRIAL', status: 'PROCESSING', cycle_id: 1, period_id: 10 }] });
    const res = await request(app).post('/api/v1/payroll/runs/1/lock').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATE');
  });
});

describe('POST /api/v1/payroll/runs/:id/unlock', () => {
  beforeEach(() => db.query.mockReset());

  test('404 when run does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/v1/payroll/runs/9999/unlock').send({});
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('400 when run is APPROVED (finalised runs cannot be unlocked)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, run_type: 'FINAL', status: 'APPROVED', period_id: 10 }] });
    const res = await request(app).post('/api/v1/payroll/runs/1/unlock').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_APPROVED');
  });

  test('400 when run is not LOCKED (only LOCKED runs can be unlocked)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, run_type: 'TRIAL', status: 'COMPLETED', period_id: 10 }] });
    const res = await request(app).post('/api/v1/payroll/runs/2/unlock').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATE');
  });
});

// ─── Payroll Lock Status ──────────────────────────────────────────────────────

describe('GET /api/v1/payroll/lock-status', () => {
  beforeEach(() => db.query.mockReset());

  test('returns { locked: false } when no cycle_id is provided', async () => {
    const res = await request(app).get('/api/v1/payroll/lock-status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locked).toBe(false);
  });

  test('returns { locked: false } when cycle has no LOCKED period (OPEN period found)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 10, status: 'OPEN', period_number: 5,
        start_date: '2026-05-01', end_date: '2026-05-31',
        cycle_name: 'Monthly',
      }],
    });
    const res = await request(app).get('/api/v1/payroll/lock-status?cycle_id=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locked).toBe(false);
    expect(res.body.data.period_number).toBe(5);
    expect(res.body.data.cycle_name).toBe('Monthly');
  });

  test('returns { locked: true } with period details when cycle has a LOCKED period', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 11, status: 'LOCKED', period_number: 6,
        start_date: '2026-06-01', end_date: '2026-06-30',
        cycle_name: 'Monthly',
      }],
    });
    const res = await request(app).get('/api/v1/payroll/lock-status?cycle_id=1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locked).toBe(true);
    expect(res.body.data.period_number).toBe(6);
    expect(res.body.data.cycle_name).toBe('Monthly');
  });
});

// ─── Reports Routes ───────────────────────────────────────────────────────────

describe('GET /api/v1/reports/payroll-totals', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when period_id and cycle_id are missing', async () => {
    const res = await request(app).get('/api/v1/reports/payroll-totals');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/period_id and cycle_id/i);
  });

  test('200 returns payroll totals when both params provided', async () => {
    const payrollTotalsSvc = require('../services/payroll-totals.service');
    payrollTotalsSvc.getPayrollTotals = jest.fn().mockResolvedValue({
      totals: [{ head_code: 'BASIC', total_amount: 500000 }],
    });
    db.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/v1/reports/payroll-totals?period_id=10&cycle_id=1');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/reports/payslip/:runId/:employeeId', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns payslip PDF with correct content-type and disposition headers', async () => {
    const res = await request(app).get('/api/v1/reports/payslip/5/42');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/payslip_5_42/);
  });
});

describe('GET /api/v1/reports/irp5-batch/:taxYear', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns IRP5 batch PDF with correct headers', async () => {
    const res = await request(app).get('/api/v1/reports/irp5-batch/2026');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/IRP5_Batch_2026/);
  });
});

describe('GET /api/v1/reports/emp201/:taxYear/:taxPeriod', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns EMP201 PDF with correct content-type header', async () => {
    const res = await request(app).get('/api/v1/reports/emp201/2026/2');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/EMP201_2026_P2/);
  });
});

describe('GET /api/v1/reports/export/employees', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns employee export as Excel spreadsheet', async () => {
    // exportToExcel is mocked; DB query returns employee rows
    db.query.mockResolvedValueOnce({
      rows: [{ employee_code: 'E001', first_name: 'Jane', surname: 'Doe', title: 'Ms', id_number: '8001010001083', gender: 'F', date_of_birth: '1980-01-01', email_address: null, cell_number: null, annual_salary: 480000, status: 'ACTIVE', joining_date: '2020-01-01', nationality: 'ZA', position_title: 'Accountant', grade_code: 'T08' }],
    });
    const res = await request(app).get('/api/v1/reports/export/employees');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheetml|octet-stream|xlsx/i);
  });
});

// ---------------------------------------------------------------------------
// EMPLOYEE SA ID VALIDATION — validateSAID pure-function unit tests
// Tests the function that powers the 422 response in validateEmployeeMiddleware.
// ---------------------------------------------------------------------------
describe('validateSAID — SA ID Luhn / format validation (real implementation)', () => {
  // Uses jest.requireActual to bypass the mock and test the real validateSAID function.
  // This validates the logic that drives 422 responses from validateEmployeeMiddleware.
  const { validateSAID } = jest.requireActual('../middleware/validation');

  test('valid SA ID (8001010001089) passes Luhn check and all format rules', () => {
    const result = validateSAID('8001010001089');
    expect(result.valid).toBe(true);
    expect(result.message).toMatch(/valid/i);
  });

  test('valid SA ID (8506155001082) passes Luhn check and all format rules', () => {
    const result = validateSAID('8506155001082');
    expect(result.valid).toBe(true);
  });

  test('invalid SA ID fails Luhn check → message references check digit', () => {
    const result = validateSAID('9901010000001');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/Luhn|invalid|check digit/i);
  });

  test('SA ID shorter than 13 digits is invalid', () => {
    const result = validateSAID('900101');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/13 digits/i);
  });

  test('non-numeric SA ID string is rejected', () => {
    const result = validateSAID('ABCDEFGHIJKLM');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// EMPLOYEE DUPLICATE SA ID CHECK — GET /api/v1/employees/validate-id
// Powers the 422 duplicate-employee check in validateEmployeeMiddleware.
// ---------------------------------------------------------------------------
describe('GET /api/v1/employees/validate-id', () => {
  beforeEach(() => db.query.mockReset());

  test('returns duplicate=true when employee with same SA ID exists', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe' }],
    });
    const res = await request(app).get('/api/v1/employees/validate-id?id_number=8001010001089');
    expect(res.status).toBe(200);
    expect(res.body.data.duplicate).toBe(true);
    expect(res.body.data.existing.id).toBe(1);
  });

  test('returns duplicate=false when no employee with that SA ID exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/employees/validate-id?id_number=8506155001082');
    expect(res.status).toBe(200);
    expect(res.body.data.duplicate).toBe(false);
    expect(res.body.data.existing).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SETTINGS — EMPLOYEE TYPES
// ---------------------------------------------------------------------------
describe('GET /api/v1/settings/employee-types', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns list of employee types', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, code: 'PERMANENT', name: 'Permanent', working_hours_per_month: 166, working_days_per_month: 20.75 },
        { id: 2, code: 'CONTRACT', name: 'Contract', working_hours_per_month: 160, working_days_per_month: 20 },
      ],
    });
    const res = await request(app).get('/api/v1/settings/employee-types');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].code).toBe('PERMANENT');
  });
});

describe('PUT /api/v1/settings/employee-types/:id', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when working_hours_per_month is zero', async () => {
    const res = await request(app)
      .put('/api/v1/settings/employee-types/1')
      .send({ working_hours_per_month: 0, working_days_per_month: 20.75 });
    expect(res.status).toBe(400);
  });

  test('200 updates employee type working hours/days', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] }) // checkPayrollLockdown → no lock
      .mockResolvedValueOnce({
        rows: [{ id: 1, code: 'PERMANENT', name: 'Permanent', working_hours_per_month: 160, working_days_per_month: 20 }],
      });
    const res = await request(app)
      .put('/api/v1/settings/employee-types/1')
      .send({ working_hours_per_month: 160, working_days_per_month: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.working_hours_per_month).toBe(160);
  });

  test('404 when employee type not found', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] }) // checkPayrollLockdown → no lock
      .mockResolvedValueOnce({ rows: [] }); // UPDATE returns no rows → 404
    const res = await request(app)
      .put('/api/v1/settings/employee-types/999')
      .send({ working_hours_per_month: 166, working_days_per_month: 20.75 });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// SETTINGS — EMPLOYEE SUBTYPES
// ---------------------------------------------------------------------------
describe('GET /api/v1/settings/employee-subtypes', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns employee subtypes with employee_type_name', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, code: 'PERMANENT_FULL', name: 'Permanent Full-Time', employee_type_name: 'Permanent', employee_type_code: 'PERMANENT' },
        { id: 2, code: 'SEASONAL', name: 'Seasonal Worker', employee_type_name: 'Contract', employee_type_code: 'CONTRACT' },
      ],
    });
    const res = await request(app).get('/api/v1/settings/employee-subtypes');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].employee_type_name).toBe('Permanent');
  });
});

describe('POST /api/v1/settings/employee-subtypes', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when required fields missing (employee_type_id, code, name)', async () => {
    const res = await request(app)
      .post('/api/v1/settings/employee-subtypes')
      .send({ code: 'SEASONAL' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/required/i);
  });

  test('201 creates employee subtype with valid payload', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 5, employee_type_id: 2, code: 'SEASONAL', name: 'Seasonal Worker', enabled: true }],
    });
    const res = await request(app)
      .post('/api/v1/settings/employee-subtypes')
      .send({ employee_type_id: 2, code: 'SEASONAL', name: 'Seasonal Worker' });
    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('SEASONAL');
  });
});

// ---------------------------------------------------------------------------
// SETTINGS — CONDITIONS OF SERVICE
// ---------------------------------------------------------------------------
describe('GET /api/v1/settings/conditions-of-service', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns conditions of service list', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, code: 'ADMIN', name: 'Administrative', working_hours_per_day: 8, working_days_per_week: 5 },
        { id: 2, code: 'TECHNICAL', name: 'Technical', working_hours_per_day: 9, working_days_per_week: 5 },
      ],
    });
    const res = await request(app).get('/api/v1/settings/conditions-of-service');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/v1/settings/conditions-of-service', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when code, name, or start_date missing', async () => {
    const res = await request(app)
      .post('/api/v1/settings/conditions-of-service')
      .send({ code: 'ADMIN', name: 'Admin' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/required/i);
  });

  test('201 creates condition of service with valid payload', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 3, code: 'ADMIN', name: 'Administrative', working_hours_per_day: 8, working_days_per_week: 5, start_date: '2024-01-01', end_date: '9999-12-31' }],
    });
    const res = await request(app)
      .post('/api/v1/settings/conditions-of-service')
      .send({ code: 'ADMIN', name: 'Administrative', start_date: '2024-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('ADMIN');
  });
});

// ---------------------------------------------------------------------------
// SETTINGS — TASK GRADES
// ---------------------------------------------------------------------------
describe('GET /api/v1/settings/task-grades', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns task grades list', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, code: 'T01', name: 'Task Grade 01', enabled: true },
        { id: 2, code: 'T02', name: 'Task Grade 02', enabled: true },
      ],
    });
    const res = await request(app).get('/api/v1/settings/task-grades');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].code).toBe('T01');
  });
});

// ---------------------------------------------------------------------------
// SETTINGS — SALARY TRANSACTION GROUPS
// ---------------------------------------------------------------------------
describe('GET /api/v1/settings/salary-transaction-groups', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns salary transaction groups with item_count', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, code: 'STANDARD', name: 'Standard Package', item_count: '5' },
        { id: 2, code: 'EXECUTIVE', name: 'Executive Package', item_count: '8' },
      ],
    });
    const res = await request(app).get('/api/v1/settings/salary-transaction-groups');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/v1/settings/salary-transaction-groups', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when code or name missing', async () => {
    const res = await request(app)
      .post('/api/v1/settings/salary-transaction-groups')
      .send({ code: 'EXEC' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/required/i);
  });

  test('201 creates salary transaction group with code and name', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 3, code: 'EXEC', name: 'Executive Package', description: null }],
    });
    const res = await request(app)
      .post('/api/v1/settings/salary-transaction-groups')
      .send({ code: 'EXEC', name: 'Executive Package' });
    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('EXEC');
  });
});

// ---------------------------------------------------------------------------
// LEAVE — POST /api/v1/leave/types (CREATE with validation)
// ---------------------------------------------------------------------------
describe('POST /api/v1/leave/types — validation and creation', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when code, name, or base_type missing', async () => {
    const res = await request(app)
      .post('/api/v1/leave/types')
      .send({ name: 'Annual Leave' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/required/i);
  });

  test('400 when rules array is empty', async () => {
    const res = await request(app)
      .post('/api/v1/leave/types')
      .send({ code: 'AL', name: 'Annual Leave', base_type: 'WORKING_DAYS', rules: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/rule/i);
  });

  test('400 when rules have duplicate deduction_priority values', async () => {
    const res = await request(app)
      .post('/api/v1/leave/types')
      .send({
        code: 'AL', name: 'Annual Leave', base_type: 'WORKING_DAYS',
        rules: [
          { deduction_priority: 1, entitlement_days: 15 },
          { deduction_priority: 1, entitlement_days: 20 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/duplicate/i);
  });
});

// ---------------------------------------------------------------------------
// PAYROLL — PAYSLIP VIEW (employee list and calculate endpoints)
// ---------------------------------------------------------------------------
describe('GET /api/v1/payroll/payslip-view/employees', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when cycle_id not provided', async () => {
    const res = await request(app).get('/api/v1/payroll/payslip-view/employees');
    expect(res.status).toBe(400);
  });

  test('200 returns empty list when no OPEN/TRIAL period found for cycle', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // period lookup → no open period
    const res = await request(app).get('/api/v1/payroll/payslip-view/employees?cycle_id=99');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.period).toBeNull();
  });
});

describe('GET /api/v1/payroll/payslip-view/employee/:employeeId/calculate', () => {
  beforeEach(() => db.query.mockReset());

  test('400 when period_id or cycle_id missing', async () => {
    const res = await request(app).get('/api/v1/payroll/payslip-view/employee/1/calculate?period_id=10');
    expect(res.status).toBe(400);
  });

  test('404 when employee does not exist', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // empDetail query → not found
    const res = await request(app).get('/api/v1/payroll/payslip-view/employee/9999/calculate?period_id=10&cycle_id=1');
    expect(res.status).toBe(404);
  });

  test('422 SALARY_STRUCTURE_UNBALANCED when engine throws "not balanced"', async () => {
    const { calculatePayslipForEmployee } = require('../services/payroll-engine');
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe' }] });
    calculatePayslipForEmployee.mockRejectedValueOnce(
      new Error(
        'Upper Limit salary structure for employee E001 is not balanced. ' +
        'Target: R100000.00, structure: R99000.00, variance: R1000.00 (exceeds R5.00 tolerance).'
      )
    );
    const res = await request(app).get('/api/v1/payroll/payslip-view/employee/1/calculate?period_id=10&cycle_id=1');
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SALARY_STRUCTURE_UNBALANCED');
    expect(res.body.error.message).toContain('not balanced');
  });

  test('two instalments on the same salary head are returned as distinct deduction lines', async () => {
    const { calculatePayslipForEmployee } = require('../services/payroll-engine');
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, employee_code: 'E002', first_name: 'John', surname: 'Smith' }] });
    calculatePayslipForEmployee.mockResolvedValueOnce({
      results: [
        {
          transaction_type: 'DEDUCTION',
          salary_head_id: 10, head_code: 'LOAN', head_name: 'Employee Loan',
          amount: 500, reference_no: '',
          is_instalment_transaction: true, instalment_id: 1,
          instalment_description: 'Vehicle Loan', instalment_total_amount: 6000,
          instalment_monthly: 500, instalment_balance_before: 5500, instalment_balance_after: 5000,
          est_id: null, ept_id: null, irp5_code: null, is_system: false,
          scoa_item_id: null, contra_scoa_item_id: null,
        },
        {
          transaction_type: 'DEDUCTION',
          salary_head_id: 10, head_code: 'LOAN', head_name: 'Employee Loan',
          amount: 300, reference_no: '',
          is_instalment_transaction: true, instalment_id: 2,
          instalment_description: 'Computer Advance', instalment_total_amount: 1800,
          instalment_monthly: 300, instalment_balance_before: 900, instalment_balance_after: 600,
          est_id: null, ept_id: null, irp5_code: null, is_system: false,
          scoa_item_id: null, contra_scoa_item_id: null,
        },
      ],
      summary: { total_earnings: 0, total_deductions: 800, nett_pay: 0, company_contributions: 0, total_cost_to_company: 0 },
      salaryStructure: {}, period: {}, transactions: [],
    });
    const res = await request(app).get('/api/v1/payroll/payslip-view/employee/2/calculate?period_id=10&cycle_id=1');
    expect(res.status).toBe(200);
    const deductions = res.body.data.deductions;
    expect(deductions).toHaveLength(2);
    const vehicleLoan = deductions.find(d => d.instalment_id === 1);
    const computerAdv = deductions.find(d => d.instalment_id === 2);
    expect(vehicleLoan).toBeDefined();
    expect(vehicleLoan.instalment_description).toBe('Vehicle Loan');
    expect(vehicleLoan.amount).toBe(500);
    expect(vehicleLoan.instalment_balance_after).toBe(5000);
    expect(computerAdv).toBeDefined();
    expect(computerAdv.instalment_description).toBe('Computer Advance');
    expect(computerAdv.amount).toBe(300);
    expect(computerAdv.instalment_balance_after).toBe(600);
  });
});

// ─── ESS Leave Balances ──────────────────────────────────────────────────────

describe('GET /api/v1/ess/leave-balances/:employeeId', () => {
  beforeEach(() => db.query.mockReset());

  test('200 returns accrued and forfeited totals alongside taken and balance', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ leave_scheme_id: 5 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            leave_type_id: 1, id: 1,
            leave_type: 'Annual Leave', code: 'ANN',
            calendar_color: '#4caf50',
            opening_balance: 15,
            adjusted_days: 0,
            encashed_days: 0,
            accrued: 5,
            forfeited: 2,
            taken: 8,
            balance: 10,
            as_at_date: null,
          },
        ],
      });
    const res = await request(app).get('/api/v1/ess/leave-balances/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const lb = res.body.data[0];
    expect(lb.accrued).toBe(5);
    expect(lb.forfeited).toBe(2);
    expect(lb.taken).toBe(8);
    expect(lb.balance).toBe(10);
    expect(lb.opening_balance).toBe(15);
  });

  test('200 returns empty array when employee has no leave scheme', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ leave_scheme_id: null }] });
    const res = await request(app).get('/api/v1/ess/leave-balances/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  test('404 when employee not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/v1/ess/leave-balances/9999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
