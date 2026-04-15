const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  apiPrefix: '/api/v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'mscoa-hr-payroll-dev-secret-change-in-production',
    expiresIn: '8h',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 500,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 25,
    maxLimit: 100,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  },
};

module.exports = config;
