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
const performanceRoutes = require('./routes/performance.routes');
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

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
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
app.use(`${config.apiPrefix}/performance`, performanceRoutes);
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
