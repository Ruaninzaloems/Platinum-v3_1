const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/database');

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: System health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     system:
 *                       type: string
 *                     version:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                     database:
 *                       type: string
 *                     modules:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/', async (req, res) => {
  const dbConnected = await testConnection();

  res.json({
    success: true,
    data: {
      status: 'ok',
      system: 'mSCOA HR & Payroll Management System',
      version: '1.0.0',
      uptime: process.uptime(),
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      modules: [
        'HR & Payroll Budgeting',
        'HR Management',
        'Leave Management',
        'Payroll Management',
        'Staff Performance Management',
        'Time & Attendance Management',
      ],
    },
  });
});

module.exports = router;
