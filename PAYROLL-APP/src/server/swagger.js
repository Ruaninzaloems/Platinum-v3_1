const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'mSCOA HR & Payroll Management System API',
      version: '1.0.0',
      description: `World-class HR and Payroll module for South African municipalities, aligned with mSCOA (Municipal Standard Chart of Accounts) requirements from National Treasury.

## Modules
- **HR & Payroll Budgeting** - Compensation budgeting, CoE projections
- **HR Management** - Full employee lifecycle, recruitment to separation
- **Leave Management** - All leave types per BCEA, municipal-specific
- **Payroll Management** - Full payroll lifecycle, statutory returns, bank integration
- **Staff Performance Management** - KPAs, reviews, PIP management
- **Time & Attendance** - Biometric integration, shift management

## Compliance
- mSCOA 7-segment classification on every transaction
- MFMA, BCEA, Labour Relations Act, Employment Equity Act
- SARS (PAYE, UIF, SDL) - EMP201, EMP501, IRP5
- GRAP accounting standards
- Auditor General compliant with full audit trail`,
      contact: {
        name: 'mSCOA HR & Payroll Team',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 25 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 4 },
          },
        },
        SCOASegments: {
          type: 'object',
          description: 'mSCOA 7-segment classification',
          properties: {
            item_id: { type: 'integer', description: 'SCOA Item segment' },
            fund_id: { type: 'integer', description: 'SCOA Fund segment' },
            function_id: { type: 'integer', description: 'SCOA Function segment' },
            project_id: { type: 'integer', description: 'SCOA Project segment' },
            region_id: { type: 'integer', description: 'SCOA Region segment' },
            costing_id: { type: 'integer', description: 'SCOA Costing segment' },
            msc_id: { type: 'integer', description: 'SCOA MSC segment' },
          },
        },
        AuditFields: {
          type: 'object',
          properties: {
            created_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'integer' },
            updated_at: { type: 'string', format: 'date-time' },
            updated_by: { type: 'integer' },
          },
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Page number',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 25, minimum: 1, maximum: 100 },
          description: 'Items per page',
        },
        SortByParam: {
          in: 'query',
          name: 'sort_by',
          schema: { type: 'string', default: 'created_at' },
          description: 'Field to sort by',
        },
        SortOrderParam: {
          in: 'query',
          name: 'sort_order',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          description: 'Sort direction',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'System health and status' },
      { name: 'Employees', description: 'Employee management - HR Management module' },
      { name: 'Positions', description: 'Position and staff establishment management' },
      { name: 'Departments', description: 'Department and division management' },
      { name: 'Payroll', description: 'Payroll processing and management' },
      { name: 'Leave', description: 'Leave management' },
      { name: 'Benefits', description: 'Employee benefits management' },
      { name: 'Time & Attendance', description: 'Time and attendance management' },
      { name: 'Performance', description: 'Staff performance management' },
    ],
  },
  apis: ['./src/server/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'mSCOA HR & Payroll API Documentation',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = { setupSwagger, swaggerSpec };
