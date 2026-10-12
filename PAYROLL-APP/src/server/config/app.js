const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  env: process.env.NODE_ENV || 'development',
  apiPrefix: '/api/v1',
  jwt: {
    // PLATINUM_JWT_SECRET is the platform-wide global-auth secret POS-API
    // signs with (POS-API/ems-jwt.ts) — this module now verifies THAT token
    // instead of issuing/verifying its own. JWT_SECRET is kept as a fallback
    // name only for any environment that hasn't set the new var yet.
    // The public dev literal is Development-only. In production a missing secret
    // leaves this undefined, so jwt.verify rejects every token (fail closed)
    // rather than accepting tokens anyone could forge with the known literal.
    secret: process.env.PLATINUM_JWT_SECRET || process.env.JWT_SECRET ||
      (process.env.NODE_ENV === 'production' ? undefined : 'platinum-local-dev-jwt-secret-change-in-production'),
    expiresIn: '8h',
    issuer: 'PlatinumPOS',
    audience: 'Platinum-Suite',
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'x-user-id', 'x-user-name', 'x-user-display-name', 'x-user-roles', 'x-employee-id'],
  },
};

module.exports = config;
