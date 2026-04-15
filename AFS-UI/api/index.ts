import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'platinum-afs-api' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if ((email === 'admin@platinum.gov.za' || email === 'admin') && password === 'admin123') {
    res.json({
      accessToken: 'afs-local-token-' + Date.now(),
      user: {
        id: 1,
        email: 'admin@platinum.gov.za',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['Administrator'],
        permissions: ['*'],
        designation: 'System Administrator',
        tenantName: 'Mnquma Local Municipality',
        mustResetPassword: false
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

app.post('/api/auth/change-password', (_req, res) => {
  res.json({ message: 'Password changed successfully' });
});

app.get('/api/notifications/unread-count', (_req, res) => {
  res.json({ count: 0 });
});

app.get('/api/admin/financial-years', (_req, res) => {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const fyStart = month >= 7 ? currentYear : currentYear - 1;
  res.json([
    { id: 1, label: `${fyStart}/${fyStart + 1}`, status: 'Open', isCurrent: true },
    { id: 2, label: `${fyStart - 1}/${fyStart}`, status: 'Closed', isCurrent: false },
    { id: 3, label: `${fyStart - 2}/${fyStart - 1}`, status: 'Closed', isCurrent: false }
  ]);
});

app.get('/api/compilations', (_req, res) => {
  res.json([]);
});

app.get('/api/templates', (_req, res) => {
  res.json([]);
});

app.get('/api/trial-balance', (_req, res) => {
  res.json({ items: [], totalCount: 0 });
});

app.get('/api/general-ledger', (_req, res) => {
  res.json({ items: [], totalCount: 0 });
});

app.get('/api/documents', (_req, res) => {
  res.json({ items: [], totalCount: 0 });
});

app.get('/api/dashboard/stats', (_req, res) => {
  res.json({
    totalCompilations: 0,
    totalTemplates: 3,
    totalMappings: 0,
    pendingRfis: 0,
    openFindings: 0,
    integrityScore: 100,
    completionPercentage: 0
  });
});

app.get('/api/dashboard/recent-activity', (_req, res) => {
  res.json([]);
});

app.use('/api', (_req, res) => {
  res.json([]);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AFS API running on port ${PORT}`);
});
