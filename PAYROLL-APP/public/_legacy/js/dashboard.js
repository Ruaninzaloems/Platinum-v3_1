const API_BASE = '/api/v1';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function updatePeriodBadges(cp) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const dashDate = document.getElementById('dashboard-date');
  if (dashDate) dashDate.textContent = dateStr;

  if (!cp) return;
  const monthIdx = cp.start_date ? new Date(cp.start_date).getMonth() : (today.getMonth());
  const monthName = MONTH_NAMES[monthIdx];
  const taxYearLabel = `${cp.tax_year - 1}/${cp.tax_year}`;
  const label = `${taxYearLabel} \u00B7 Period ${cp.period_number} (${monthName})`;

  const topbar = document.getElementById('topbar-period-badge');
  const dashboard = document.getElementById('dashboard-period-badge');
  if (topbar) topbar.textContent = label;
  if (dashboard) dashboard.textContent = label;
}

async function api(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { throw new Error(`API Error: Server returned non-JSON response (${res.status})`); }
  if (!res.ok) throw new Error(json.error?.message || `API Error: ${res.status}`);
  return json;
}

async function apiPost(endpoint, data) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(`${API_BASE}${endpoint}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (e) { throw new Error(`API Error: Server returned non-JSON response (${res.status})`); }
  if (!res.ok) throw new Error(json.error?.message || `API Error: ${res.status}`);
  return json;
}

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  if (num >= 1e6) return `R ${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `R ${(num / 1e3).toFixed(0)}K`;
  return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;
}

function formatNumber(val) {
  return parseInt(val || 0).toLocaleString();
}

const icons = {
  users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  dollar: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  alertTriangle: '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  fileText: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  activity: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  lightbulb: '<svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 6h4c0-3 2-4 2-6a4 4 0 0 0-4-4z"/><line x1="10" y1="16" x2="14" y2="16"/><line x1="10" y1="19" x2="14" y2="19"/><path d="M10 22h4"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  award: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
  barChart: '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  creditCard: '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  trendingUp: '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  xCircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  rotateCcw: '<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  printer: '<svg viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  percent: '<svg viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  edit2: '<svg viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>',
  trash2: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  refreshCw: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  dollarSign: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
};

function icon(name, size) {
  const s = size || 18;
  const svg = icons[name] || '';
  return svg.replace('<svg ', `<svg width="${s}" height="${s}" stroke="currentColor" stroke-width="1.75" fill="none" stroke-linecap="round" stroke-linejoin="round" `);
}

const state = {
  activeModule: 'dashboard',
  activeTab: 'dashboard',
  dashboardData: null,
  deptData: null,
  leaveData: null,
  payrollData: null,
};

function initSidebar() {
  document.querySelectorAll('.nav-item[data-toggle]').forEach(item => {
    item.addEventListener('click', () => {
      const children = item.nextElementSibling;
      if (children && children.classList.contains('nav-children')) {
        item.classList.toggle('expanded');
        children.classList.toggle('show');
      }
    });
  });

  document.querySelectorAll('[data-module]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const module = item.dataset.module;
      setActiveModule(module);
    });
  });

  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('app-sidebar');
  if (toggleBtn && sidebar) {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') sidebar.classList.add('collapsed');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });
  }
}

function setActiveModule(module) {
  state.activeModule = module;
  document.querySelectorAll('.nav-item, .nav-child').forEach(el => el.classList.remove('active'));
  const activeEl = document.querySelector(`[data-module="${module}"]`);
  if (activeEl) {
    activeEl.classList.add('active');
    const parentChildren = activeEl.closest('.nav-children');
    if (parentChildren) {
      parentChildren.classList.add('show');
      const parentToggle = parentChildren.previousElementSibling;
      if (parentToggle && parentToggle.classList.contains('nav-item')) parentToggle.classList.add('expanded');
    }
  }
  loadModuleContent(module);
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const content = document.getElementById(`tab-${tabId}`);
      if (content) content.classList.add('active');
      state.activeTab = tabId;
      if (tabId === 'list') loadEmployeeList();
      if (tabId === 'analytics') loadAnalyticsDashboard();
    });
  });
}

async function loadDashboard() {
  const el = document.getElementById('dashboard-content');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading dashboard...</div>';

  try {
    const [summary, deptData, leaveData, payrollData, compliance] = await Promise.all([
      api('/dashboard/summary'),
      api('/dashboard/department-headcount'),
      api('/dashboard/leave-summary'),
      api('/dashboard/payroll-summary'),
      api('/dashboard/compliance'),
    ]);

    let workflowCount = 0, probationCount = 0, ghostCount = 0;
    try {
      const wfRes = await api('/workflows/pending').catch(() => null);
      workflowCount = wfRes && wfRes.data ? (Array.isArray(wfRes.data) ? wfRes.data.length : (parseInt(wfRes.data.count) || 0)) : 0;
    } catch(e) { workflowCount = 0; }
    try {
      const probRes = await api('/employees/probation-alerts').catch(() => null);
      probationCount = probRes && probRes.data ? (Array.isArray(probRes.data) ? probRes.data.length : (parseInt(probRes.data.count) || 0)) : 0;
    } catch(e) { probationCount = 0; }
    try {
      const ghostRes = await api('/time/ghost-detection?months=3').catch(() => null);
      ghostCount = ghostRes && ghostRes.data ? (Array.isArray(ghostRes.data) ? ghostRes.data.length : (parseInt(ghostRes.data.count) || 0)) : 0;
    } catch(e) { ghostCount = 0; }

    state.dashboardData = summary.data;
    state.deptData = deptData.data;
    state.leaveData = leaveData.data;
    state.payrollData = payrollData.data;

    const emp = summary.data.employees;
    const pos = summary.data.positions;
    const lv = summary.data.leave;
    const pr = summary.data.payroll;
    const cp = summary.data.current_period;
    const cmp = compliance.data;

    updatePeriodBadges(cp);

    el.innerHTML = `
      <div class="kpi-row">
        <div class="kpi-card kpi-blue">
          <div class="kpi-header">
            <span class="kpi-label">Total Employees</span>
            <div class="kpi-icon blue">${icon('user')}</div>
          </div>
          <div class="kpi-value">${formatNumber(emp.active_employees)}</div>
          <div class="kpi-sub">${formatNumber(emp.new_hires_30d)} new hires (30d)</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-header">
            <span class="kpi-label">Annual CoE Budget</span>
            <div class="kpi-icon green">${icon('dollar')}</div>
          </div>
          <div class="kpi-value">${formatCurrency(emp.total_annual_salary)}</div>
          <div class="kpi-sub">${formatCurrency(parseFloat(emp.total_annual_salary) / 12)}/month</div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-header">
            <span class="kpi-label">Vacancy Rate</span>
            <div class="kpi-icon teal">${icon('clipboard')}</div>
          </div>
          <div class="kpi-value">${pos.total_positions > 0 ? ((parseInt(pos.vacant_positions) / parseInt(pos.total_positions)) * 100).toFixed(0) : 0}%</div>
          <div class="kpi-sub">${formatNumber(pos.vacant_positions)} of ${formatNumber(pos.total_positions)} positions</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-header">
            <span class="kpi-label">Approval Rate</span>
            <div class="kpi-icon green">${icon('check')}</div>
          </div>
          <div class="kpi-value">${lv.total_requests > 0 ? Math.round(((parseInt(lv.total_requests) - parseInt(lv.pending_requests)) / parseInt(lv.total_requests)) * 100) : 0}%</div>
          <div class="kpi-sub">${formatNumber(lv.pending_requests)} pending</div>
        </div>
      </div>

      <div class="alert-row">
        <div class="alert-card">
          <div class="alert-icon alert-danger">${icon('alertTriangle', 16)}</div>
          <div>
            <div class="alert-label">Missing Tax Numbers</div>
            <div class="alert-value" style="color:var(--danger-dark)">${formatNumber(cmp.data_quality.missing_tax_numbers)}</div>
            <div class="alert-detail">Employees without SARS tax ref</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon alert-warning">${icon('link', 16)}</div>
          <div>
            <div class="alert-label">Missing Bank Details</div>
            <div class="alert-value" style="color:var(--warning-dark)">${formatNumber(cmp.data_quality.missing_bank_details)}</div>
            <div class="alert-detail">Cannot process EFT payments</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon alert-info">${icon('briefcase', 16)}</div>
          <div>
            <div class="alert-label">Unlinked Positions</div>
            <div class="alert-value" style="color:var(--info-dark)">${formatNumber(cmp.data_quality.unlinked_positions)}</div>
            <div class="alert-detail">Employees without position</div>
          </div>
        </div>
        <div class="alert-card">
          <div class="alert-icon alert-success">${icon('fileText', 16)}</div>
          <div>
            <div class="alert-label">Audit Entries (7d)</div>
            <div class="alert-value" style="color:var(--success-dark)">${formatNumber(cmp.audit.recent_entries)}</div>
            <div class="alert-detail">AG-compliant trail active</div>
          </div>
        </div>
      </div>

      <div class="alert-row" style="margin-top:1.5rem">
        <div class="alert-card" style="cursor:pointer;border-left:3px solid ${workflowCount > 0 ? 'var(--warning)' : 'var(--success)'}" onclick="setActiveModule('settings-workflows')">
          <div class="alert-icon ${workflowCount > 0 ? 'alert-warning' : 'alert-success'}">${icon('clock', 16)}</div>
          <div>
            <div class="alert-label">Pending Approvals</div>
            <div class="alert-value" style="color:${workflowCount > 0 ? 'var(--warning-dark)' : 'var(--success-dark)'}">${formatNumber(workflowCount)}</div>
            <div class="alert-detail">Workflow items awaiting action</div>
          </div>
        </div>
        <div class="alert-card" style="cursor:pointer;border-left:3px solid ${probationCount > 0 ? 'var(--warning)' : 'var(--success)'}" onclick="setActiveModule('employees')">
          <div class="alert-icon ${probationCount > 0 ? 'alert-warning' : 'alert-success'}">${icon('alertTriangle', 16)}</div>
          <div>
            <div class="alert-label">Probation Alerts</div>
            <div class="alert-value" style="color:${probationCount > 0 ? 'var(--warning-dark)' : 'var(--success-dark)'}">${formatNumber(probationCount)}</div>
            <div class="alert-detail">Employees on probation review</div>
          </div>
        </div>
        <div class="alert-card" style="cursor:pointer;border-left:3px solid ${ghostCount > 0 ? 'var(--danger)' : 'var(--success)'}" onclick="setActiveModule('time')">
          <div class="alert-icon ${ghostCount > 0 ? 'alert-danger' : 'alert-success'}">${icon('eye', 16)}</div>
          <div>
            <div class="alert-label">Ghost Employee Flags</div>
            <div class="alert-value" style="color:${ghostCount > 0 ? 'var(--danger-dark)' : 'var(--success-dark)'}">${formatNumber(ghostCount)}</div>
            <div class="alert-detail">Flagged in last 3 months</div>
          </div>
        </div>
        <div class="alert-card" style="border-left:3px solid var(--success)">
          <div class="alert-icon alert-success">${icon('shield', 16)}</div>
          <div>
            <div class="alert-label">RBAC Active</div>
            <div class="alert-value" style="color:var(--success-dark)">Enabled</div>
            <div class="alert-detail">Role-based access control</div>
          </div>
        </div>
      </div>

      ${renderPayrollPipeline(pr)}

      <div class="two-col">
        ${renderDeptChart(deptData.data)}
        ${renderLeaveChart(leaveData.data)}
      </div>

      ${renderAIInsights()}
    `;
  } catch (err) {
    el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load dashboard: ${err.message}</div>`;
    console.error('Dashboard load error:', err);
  }
}

function pipelineDrillStatus(status) {
  setActiveModule('payroll');
  setTimeout(() => { PayrollModule.state.filters.status = status; PayrollModule.loadRuns(); }, 200);
}

function pipelineDrillTax() {
  setActiveModule('payroll');
  setTimeout(() => { PayrollModule.state.activeTab = 'tax'; PayrollModule.renderMain(); }, 200);
}

function renderPayrollPipeline(pr) {
  return `
    <div class="pipeline">
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillStatus('PENDING')">
        <div class="step-icon">${icon('file', 16)}</div>
        <div class="step-count">${pr.pending_runs || 0}</div>
        <div class="step-label">Pending</div>
        <div class="step-bar" style="background: var(--text-muted)"></div>
      </div>
      <div class="pipeline-arrow">${icon('arrowRight', 16)}</div>
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillStatus('PROCESSING')">
        <div class="step-icon">${icon('settings', 16)}</div>
        <div class="step-count">${pr.processing_runs || 0}</div>
        <div class="step-label">Processing</div>
        <div class="step-bar" style="background: var(--info)"></div>
      </div>
      <div class="pipeline-arrow">${icon('arrowRight', 16)}</div>
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillStatus('COMPLETED')">
        <div class="step-icon">${icon('check', 16)}</div>
        <div class="step-count">${pr.completed_runs || 0}</div>
        <div class="step-label">Completed</div>
        <div class="step-bar" style="background: var(--success)"></div>
      </div>
      <div class="pipeline-arrow">${icon('arrowRight', 16)}</div>
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillTax()">
        <div class="step-icon">${icon('dollar', 16)}</div>
        <div class="step-count">${formatCurrency(pr.total_paye || 0)}</div>
        <div class="step-label">PAYE</div>
        <div class="step-bar" style="background: var(--primary)"></div>
      </div>
      <div class="pipeline-arrow">${icon('arrowRight', 16)}</div>
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillTax()">
        <div class="step-icon">${icon('home', 16)}</div>
        <div class="step-count">${formatCurrency(pr.total_uif || 0)}</div>
        <div class="step-label">UIF</div>
        <div class="step-bar" style="background: var(--warning)"></div>
      </div>
      <div class="pipeline-arrow">${icon('arrowRight', 16)}</div>
      <div class="pipeline-step pipeline-step-clickable" onclick="pipelineDrillTax()">
        <div class="step-icon">${icon('award', 16)}</div>
        <div class="step-count">${formatCurrency(pr.total_sdl || 0)}</div>
        <div class="step-label">SDL</div>
        <div class="step-bar" style="background: var(--purple)"></div>
      </div>
    </div>
  `;
}

function renderDeptChart(data) {
  if (!data || data.length === 0) return '<div class="dept-chart"><div class="chart-title">Department Headcount</div><p style="color:var(--text-muted)">No data</p></div>';
  const maxCount = Math.max(...data.map(d => parseInt(d.active_employees) || 0), 1);
  const colors = ['#6C7AE0','#68D391','#F6AD55','#FC8181','#B794F4','#F687B3','#81E6D9','#FBD38D'];

  const bars = data.map((d, i) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${d.name.length > 22 ? d.name.substring(0,22) + '...' : d.name}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.max(((parseInt(d.active_employees)||0) / maxCount) * 100, 3)}%;background:${colors[i % colors.length]}">${d.active_employees || 0}</div>
      </div>
      <div class="chart-bar-value">${formatCurrency(d.total_salary_cost)}</div>
    </div>
  `).join('');

  return `<div class="dept-chart"><div class="chart-title">Department Headcount & CoE</div><div class="chart-bars">${bars}</div></div>`;
}

function renderLeaveChart(data) {
  if (!data || data.length === 0) return '<div class="dept-chart"><div class="chart-title">Leave Overview</div><p style="color:var(--text-muted)">No data</p></div>';
  const rows = data.map(d => `
    <tr>
      <td><span class="badge badge-info">${d.code}</span> ${d.leave_type}</td>
      <td style="text-align:center">${d.total_requests}</td>
      <td style="text-align:center"><span class="status-badge status-pending">${d.pending}</span></td>
      <td style="text-align:center"><span class="status-badge status-approved">${d.approved}</span></td>
      <td style="text-align:right; font-weight:600">${parseFloat(d.total_days_taken).toFixed(0)} days</td>
    </tr>
  `).join('');

  return `
    <div class="data-grid">
      <table>
        <thead><tr><th>Leave Type</th><th style="text-align:center">Total</th><th style="text-align:center">Pending</th><th style="text-align:center">Approved</th><th style="text-align:right">Days Taken</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

let analyticsLoaded = false;
const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function createChart(canvasId, config) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  chartInstances[canvasId] = new Chart(ctx, config);
  return chartInstances[canvasId];
}

const CHART_COLORS = {
  blue: '#7eaed9', green: '#8ec8a0', orange: '#f0c891', red: '#e8a0a0',
  purple: '#b8a9d9', teal: '#85c5c5', pink: '#d9a0bf', amber: '#e8cf8e',
  indigo: '#9b9fd9', emerald: '#7bbf9a', rose: '#dba0ab', cyan: '#8ed4dd',
  blueBg: 'rgba(126,174,217,0.18)', greenBg: 'rgba(142,200,160,0.18)',
  orangeBg: 'rgba(240,200,145,0.18)', redBg: 'rgba(232,160,160,0.18)',
  purpleBg: 'rgba(184,169,217,0.18)', tealBg: 'rgba(133,197,197,0.18)',
};

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { font: { family: "'Inter','Segoe UI',sans-serif", size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: { backgroundColor: '#1e293b', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 8, displayColors: true }
  }
};

async function loadAnalyticsDashboard(forceRefresh) {
  if (analyticsLoaded && !forceRefresh) return;
  const el = document.getElementById('analytics-content');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading AI Analytics & Demographics...</div>';

  try {
    const [demoData, summaryData, deptData, complianceData, leaveData] = await Promise.all([
      api('/dashboard/demographics'),
      api('/dashboard/summary'),
      api('/dashboard/department-headcount'),
      api('/dashboard/compliance'),
      api('/dashboard/leave-summary'),
    ]);

    const demo = demoData.data;
    const summary = summaryData.data;
    const cmp = complianceData.data;
    const totalActive = parseInt(summary.employees.active_employees) || 0;

    const genderMap = {};
    demo.gender.forEach(g => { genderMap[g.gender] = parseInt(g.count); });
    const maleCount = genderMap['Male'] || 0;
    const femaleCount = genderMap['Female'] || 0;

    const raceMap = {};
    demo.race.forEach(r => { raceMap[r.race] = parseInt(r.count); });

    const disabledMale = demo.disability.filter(d => (d.disability_status || '').toUpperCase() === 'YES' && d.gender === 'Male').reduce((s, d) => s + parseInt(d.count), 0);
    const disabledFemale = demo.disability.filter(d => (d.disability_status || '').toUpperCase() === 'YES' && d.gender === 'Female').reduce((s, d) => s + parseInt(d.count), 0);
    const totalDisabled = disabledMale + disabledFemale;

    const eeTargets = demo.ee_targets;

    el.innerHTML = `
      <div class="analytics-header">
        <div class="analytics-title-row">
          <div>
            <h2 class="analytics-main-title">${icon('activity', 20)} HR Analytics & Employment Equity Dashboard</h2>
            <p class="analytics-subtitle">Real-time workforce demographics, EE targets, BCEA compliance and statutory reporting status</p>
          </div>
          <div class="analytics-badges">
            <span class="analytics-badge analytics-badge-live">${icon('activity', 12)} Live Data</span>
            <span class="analytics-badge analytics-badge-ee">EEA Compliant</span>
            <span class="analytics-badge analytics-badge-bcea">BCEA Aligned</span>
          </div>
        </div>
      </div>

      <div class="analytics-kpi-row">
        <div class="analytics-kpi">
          <div class="analytics-kpi-icon" style="background:#eef2ff;color:#6366f1">${icon('users', 18)}</div>
          <div class="analytics-kpi-data">
            <div class="analytics-kpi-value">${totalActive}</div>
            <div class="analytics-kpi-label">Active Employees</div>
          </div>
        </div>
        <div class="analytics-kpi">
          <div class="analytics-kpi-icon" style="background:#ecfdf5;color:#10b981">${icon('user', 18)}</div>
          <div class="analytics-kpi-data">
            <div class="analytics-kpi-value">${maleCount} / ${femaleCount}</div>
            <div class="analytics-kpi-label">Male / Female</div>
          </div>
        </div>
        <div class="analytics-kpi">
          <div class="analytics-kpi-icon" style="background:#fef2f2;color:#ef4444">${icon('shield', 18)}</div>
          <div class="analytics-kpi-data">
            <div class="analytics-kpi-value">${totalDisabled}</div>
            <div class="analytics-kpi-label">Disabled (${totalActive > 0 ? ((totalDisabled/totalActive)*100).toFixed(1) : 0}%)</div>
          </div>
        </div>
        <div class="analytics-kpi">
          <div class="analytics-kpi-icon" style="background:#fff7ed;color:#f97316">${icon('briefcase', 18)}</div>
          <div class="analytics-kpi-data">
            <div class="analytics-kpi-value">${summary.positions.vacant_positions}</div>
            <div class="analytics-kpi-label">Vacant Posts</div>
          </div>
        </div>
        <div class="analytics-kpi">
          <div class="analytics-kpi-icon" style="background:#faf5ff;color:#8b5cf6">${icon('award', 18)}</div>
          <div class="analytics-kpi-data">
            <div class="analytics-kpi-value">${Object.keys(raceMap).length}</div>
            <div class="analytics-kpi-label">Race Groups</div>
          </div>
        </div>
      </div>

      <div class="analytics-section-title">${icon('shield', 16)} Employment Equity (EEA) Demographics</div>
      <div class="analytics-grid-3">
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Gender Distribution</span>
            <span class="analytics-card-badge">EEA2</span>
          </div>
          <div class="analytics-chart-wrap"><canvas id="chart-gender"></canvas></div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Race Demographics</span>
            <span class="analytics-card-badge">EEA2</span>
          </div>
          <div class="analytics-chart-wrap"><canvas id="chart-race"></canvas></div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Disability Status</span>
            <span class="analytics-card-badge">EEA4</span>
          </div>
          <div class="analytics-chart-wrap"><canvas id="chart-disability"></canvas></div>
        </div>
      </div>

      <div class="analytics-grid-2">
        <div class="analytics-card analytics-card-wide">
          <div class="analytics-card-header">
            <span class="analytics-card-title">EE Targets vs Actual (Race x Gender)</span>
            <span class="analytics-card-badge badge-danger">EEA2 / EEA4</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-ee-targets"></canvas></div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Race x Gender Breakdown</span>
            <span class="analytics-card-badge">Detailed</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-race-gender"></canvas></div>
        </div>
      </div>

      <div class="analytics-section-title">${icon('barChart', 16)} Workforce Analytics & Trends</div>
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Age Distribution by Gender</span>
            <span class="analytics-card-badge">Workforce Planning</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-age"></canvas></div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Tenure Distribution</span>
            <span class="analytics-card-badge">Retention</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-tenure"></canvas></div>
        </div>
      </div>

      <div class="analytics-grid-2">
        <div class="analytics-card analytics-card-wide">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Department Headcount by Gender</span>
            <span class="analytics-card-badge">Organogram</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-dept-gender"></canvas></div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Hires & Terminations (12 Months)</span>
            <span class="analytics-card-badge">Turnover</span>
          </div>
          <div class="analytics-chart-wrap analytics-chart-tall"><canvas id="chart-turnover"></canvas></div>
        </div>
      </div>

      <div class="analytics-section-title">${icon('fileText', 16)} Statutory Compliance & Submissions</div>
      <div class="analytics-grid-3">
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">SARS Submissions</span>
            <span class="analytics-card-badge badge-danger">Tax Act</span>
          </div>
          <div class="analytics-compliance-list">
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EMP201 Monthly Declaration</div>
                <div class="analytics-compliance-detail">PAYE, UIF, SDL monthly submission to SARS</div>
              </div>
              <span class="status-badge status-completed">Current</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-orange"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EMP501 Bi-Annual Reconciliation</div>
                <div class="analytics-compliance-detail">Aug & Feb employer reconciliation</div>
              </div>
              <span class="status-badge status-pending">Due Mar</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-blue"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">IRP5/IT3(a) Certificates</div>
                <div class="analytics-compliance-detail">Annual employee tax certificates</div>
              </div>
              <span class="status-badge status-processing">In Progress</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-blue"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">e@syFile Submission</div>
                <div class="analytics-compliance-detail">Electronic SARS filing</div>
              </div>
              <span class="status-badge status-processing">Preparing</span>
            </div>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">Employment Equity</span>
            <span class="analytics-card-badge badge-warning">EE Act</span>
          </div>
          <div class="analytics-compliance-list">
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-orange"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EEA2 - Workforce Profile</div>
                <div class="analytics-compliance-detail">Annual demographic report to DoEL</div>
              </div>
              <span class="status-badge status-pending">Due Jan</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-orange"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EEA4 - Income Differential</div>
                <div class="analytics-compliance-detail">Salary gap analysis by race & gender</div>
              </div>
              <span class="status-badge status-pending">Due Jan</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EE Plan (5-year)</div>
                <div class="analytics-compliance-detail">Numerical targets & barriers analysis</div>
              </div>
              <span class="status-badge status-active">Active</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">EE Committee Minutes</div>
                <div class="analytics-compliance-detail">Quarterly consultation meetings</div>
              </div>
              <span class="status-badge status-completed">Q4 Done</span>
            </div>
          </div>
        </div>
        <div class="analytics-card">
          <div class="analytics-card-header">
            <span class="analytics-card-title">BCEA & Other</span>
            <span class="analytics-card-badge badge-info">Compliance</span>
          </div>
          <div class="analytics-compliance-list">
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">WSP/ATR</div>
                <div class="analytics-compliance-detail">LGSETA skills development plan</div>
              </div>
              <span class="status-badge status-pending">Due Apr</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">MFMA Section 66</div>
                <div class="analytics-compliance-detail">CoE personnel expenditure limits</div>
              </div>
              <span class="status-badge status-completed">Compliant</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot analytics-dot-green"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">BCEA Sec 20-22</div>
                <div class="analytics-compliance-detail">Leave provisions & accruals</div>
              </div>
              <span class="status-badge status-completed">Compliant</span>
            </div>
            <div class="analytics-compliance-item">
              <span class="analytics-compliance-dot ${parseInt(cmp.data_quality.missing_tax_numbers) > 0 ? 'analytics-dot-red' : 'analytics-dot-green'}"></span>
              <div class="analytics-compliance-info">
                <div class="analytics-compliance-name">Data Quality</div>
                <div class="analytics-compliance-detail">${cmp.data_quality.missing_tax_numbers} missing tax refs, ${cmp.data_quality.missing_bank_details} missing bank details</div>
              </div>
              <span class="status-badge ${parseInt(cmp.data_quality.missing_tax_numbers) > 0 ? 'status-rejected' : 'status-completed'}">${parseInt(cmp.data_quality.missing_tax_numbers) > 0 ? 'Action Req' : 'Clean'}</span>
            </div>
          </div>
        </div>
      </div>

      ${renderAIInsights()}
    `;

    renderGenderChart(demo);
    renderRaceChart(demo);
    renderDisabilityChart(disabledMale, disabledFemale, totalActive - totalDisabled);
    renderEETargetsChart(demo, eeTargets, totalActive);
    renderRaceGenderChart(demo);
    renderAgeChart(demo);
    renderTenureChart(demo);
    renderDeptGenderChart(demo);
    renderTurnoverChart(demo);

    analyticsLoaded = true;
  } catch (err) {
    el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load analytics: ${err.message}</div>`;
    console.error('Analytics load error:', err);
  }
}

function renderGenderChart(demo) {
  const labels = demo.gender.map(g => g.gender || 'Unspecified');
  const data = demo.gender.map(g => parseInt(g.count));
  createChart('chart-gender', {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [CHART_COLORS.blue, CHART_COLORS.pink, CHART_COLORS.amber],
        borderWidth: 2, borderColor: '#fff', hoverOffset: 6
      }]
    },
    options: { ...CHART_DEFAULTS, cutout: '65%',
      plugins: { ...CHART_DEFAULTS.plugins,
        legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' }
      }
    }
  });
}

function renderRaceChart(demo) {
  const labels = demo.race.map(r => r.race || 'Unspecified');
  const data = demo.race.map(r => parseInt(r.count));
  const colors = [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.pink];
  createChart('chart-race', {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2, borderColor: '#fff', hoverOffset: 6
      }]
    },
    options: { ...CHART_DEFAULTS, cutout: '65%',
      plugins: { ...CHART_DEFAULTS.plugins,
        legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' }
      }
    }
  });
}

function renderDisabilityChart(male, female, nonDisabled) {
  createChart('chart-disability', {
    type: 'doughnut',
    data: {
      labels: ['Disabled Male', 'Disabled Female', 'Non-Disabled'],
      datasets: [{
        data: [male, female, Math.max(0, nonDisabled)],
        backgroundColor: [CHART_COLORS.red, CHART_COLORS.rose, '#e2e8f0'],
        borderWidth: 2, borderColor: '#fff', hoverOffset: 6
      }]
    },
    options: { ...CHART_DEFAULTS, cutout: '65%',
      plugins: { ...CHART_DEFAULTS.plugins,
        legend: { ...CHART_DEFAULTS.plugins.legend, position: 'bottom' }
      }
    }
  });
}

function renderEETargetsChart(demo, targets, total) {
  const categories = [
    { key: 'african_male', label: 'African M' },
    { key: 'african_female', label: 'African F' },
    { key: 'coloured_male', label: 'Coloured M' },
    { key: 'coloured_female', label: 'Coloured F' },
    { key: 'indian_male', label: 'Indian M' },
    { key: 'indian_female', label: 'Indian F' },
    { key: 'white_male', label: 'White M' },
    { key: 'white_female', label: 'White F' },
  ];

  const labels = categories.map(c => c.label);
  const targetData = categories.map(c => Number(targets[c.key]) || 0);
  const actualData = categories.map(c => {
    const actual = demo.race_gender.find(rg => {
      const k = `${(rg.race || '').toLowerCase()}_${(rg.gender || '').toLowerCase()}`;
      return k === c.key;
    });
    if (!actual || total === 0) return 0;
    return Number(((parseInt(actual.count) || 0) / total * 100).toFixed(1));
  });
  const maxVal = Math.max(50, ...targetData, ...actualData) + 5;

  createChart('chart-ee-targets', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'EE Target %', data: targetData, backgroundColor: CHART_COLORS.blueBg, borderColor: CHART_COLORS.blue, borderWidth: 2, borderRadius: 4, barPercentage: 0.7 },
        { label: 'Actual %', data: actualData, backgroundColor: CHART_COLORS.greenBg, borderColor: CHART_COLORS.green, borderWidth: 2, borderRadius: 4, barPercentage: 0.7 },
      ]
    },
    options: { ...CHART_DEFAULTS,
      scales: {
        y: { beginAtZero: true, max: maxVal, ticks: { callback: v => v + '%', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } }
    }
  });
}

function renderRaceGenderChart(demo) {
  const races = [...new Set(demo.race_gender.map(rg => rg.race || 'Unspecified'))];
  const maleData = races.map(r => {
    const row = demo.race_gender.find(rg => rg.race === r && rg.gender === 'Male');
    return row ? (parseInt(row.count) || 0) : 0;
  });
  const femaleData = races.map(r => {
    const row = demo.race_gender.find(rg => rg.race === r && rg.gender === 'Female');
    return row ? (parseInt(row.count) || 0) : 0;
  });

  createChart('chart-race-gender', {
    type: 'bar',
    data: {
      labels: races,
      datasets: [
        { label: 'Male', data: maleData, backgroundColor: CHART_COLORS.blue, borderRadius: 4, barPercentage: 0.6 },
        { label: 'Female', data: femaleData, backgroundColor: CHART_COLORS.pink, borderRadius: 4, barPercentage: 0.6 },
      ]
    },
    options: { ...CHART_DEFAULTS, indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        y: { ticks: { font: { size: 10 } }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } }
    }
  });
}

function renderAgeChart(demo) {
  const bands = [...new Set(demo.age_distribution.map(a => a.age_band))];
  const sortOrder = ['18-24','25-34','35-44','45-54','55+'];
  bands.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

  const maleData = bands.map(b => {
    const row = demo.age_distribution.find(a => a.age_band === b && a.gender === 'Male');
    return row ? (parseInt(row.count) || 0) : 0;
  });
  const femaleData = bands.map(b => {
    const row = demo.age_distribution.find(a => a.age_band === b && a.gender === 'Female');
    return row ? (parseInt(row.count) || 0) : 0;
  });

  createChart('chart-age', {
    type: 'bar',
    data: {
      labels: bands,
      datasets: [
        { label: 'Male', data: maleData, backgroundColor: CHART_COLORS.blue, borderRadius: 4 },
        { label: 'Female', data: femaleData, backgroundColor: CHART_COLORS.pink, borderRadius: 4 },
      ]
    },
    options: { ...CHART_DEFAULTS,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } }
    }
  });
}

function renderTenureChart(demo) {
  const sortOrder = ['< 1 year','1-2 years','3-5 years','5-10 years','10+ years'];
  const sorted = [...demo.tenure_distribution].sort((a, b) => sortOrder.indexOf(a.tenure_band) - sortOrder.indexOf(b.tenure_band));
  const labels = sorted.map(t => t.tenure_band);
  const data = sorted.map(t => parseInt(t.count));
  const colors = [CHART_COLORS.teal, CHART_COLORS.blue, CHART_COLORS.indigo, CHART_COLORS.purple, CHART_COLORS.emerald];

  createChart('chart-tenure', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Employees',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 6,
        barPercentage: 0.6,
      }]
    },
    options: { ...CHART_DEFAULTS,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } }
    }
  });
}

function renderDeptGenderChart(demo) {
  const depts = [...new Set(demo.department_gender.map(d => d.department_name))];
  const maleData = depts.map(d => {
    const row = demo.department_gender.find(dg => dg.department_name === d && dg.gender === 'Male');
    return row ? (parseInt(row.count) || 0) : 0;
  });
  const femaleData = depts.map(d => {
    const row = demo.department_gender.find(dg => dg.department_name === d && dg.gender === 'Female');
    return row ? (parseInt(row.count) || 0) : 0;
  });

  createChart('chart-dept-gender', {
    type: 'bar',
    data: {
      labels: depts.map(d => d.length > 20 ? d.substring(0, 18) + '...' : d),
      datasets: [
        { label: 'Male', data: maleData, backgroundColor: CHART_COLORS.blue, borderRadius: 4, barPercentage: 0.6 },
        { label: 'Female', data: femaleData, backgroundColor: CHART_COLORS.pink, borderRadius: 4, barPercentage: 0.6 },
      ]
    },
    options: { ...CHART_DEFAULTS,
      scales: {
        y: { beginAtZero: true, stacked: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { stacked: true, ticks: { font: { size: 9 }, maxRotation: 45 }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } }
    }
  });
}

function renderTurnoverChart(demo) {
  const allMonths = new Set();
  demo.monthly_hires.forEach(h => allMonths.add(h.month));
  demo.monthly_terminations.forEach(t => allMonths.add(t.month));
  const months = [...allMonths].sort();

  if (months.length === 0) {
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
  }

  const hireMap = {};
  demo.monthly_hires.forEach(h => { hireMap[h.month] = parseInt(h.hires); });
  const termMap = {};
  demo.monthly_terminations.forEach(t => { termMap[t.month] = parseInt(t.terminations); });

  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    return new Date(y, parseInt(mo) - 1).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
  });

  createChart('chart-turnover', {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Hires', data: months.map(m => hireMap[m] || 0), borderColor: CHART_COLORS.green, backgroundColor: CHART_COLORS.greenBg, fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: CHART_COLORS.green },
        { label: 'Terminations', data: months.map(m => termMap[m] || 0), borderColor: CHART_COLORS.red, backgroundColor: CHART_COLORS.redBg, fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: CHART_COLORS.red },
      ]
    },
    options: { ...CHART_DEFAULTS,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { size: 9 } }, grid: { display: false } }
      },
      plugins: { ...CHART_DEFAULTS.plugins, legend: { ...CHART_DEFAULTS.plugins.legend, position: 'top' } }
    }
  });
}

function renderAIInsights() {
  const insights = [
    {
      severity: 'red',
      title: 'PAYE Compliance Risk Detected',
      desc: 'Multiple employees are missing SARS income tax reference numbers. This will result in non-compliance with EMP201 submissions and potential SARS penalties.',
      ref: 'SARS Tax Administration Act',
      refBadge: 'badge-danger',
      confidence: 92
    },
    {
      severity: 'orange',
      title: 'Annual Leave Accumulation Warning',
      desc: 'Several employees have accumulated leave exceeding the BCEA maximum of 48 days. Consider enforcing leave scheduling per the BCEA Section 20 requirements.',
      ref: 'BCEA Section 20',
      refBadge: 'badge-warning',
      confidence: 87
    },
    {
      severity: 'blue',
      title: 'CoE Budget Threshold Alert',
      desc: 'Compensation of Employees is approaching the mSCOA budget allocation threshold for this financial year. Review against MFMA Section 28 expenditure controls.',
      ref: 'MFMA Section 28',
      refBadge: 'badge-info',
      confidence: 78
    },
    {
      severity: 'orange',
      title: 'Position Vacancy Trend',
      desc: 'Vacancy rate exceeds the Municipal Staff Regulations 2021 recommended staffing threshold. Critical positions remain unfilled which may affect service delivery.',
      ref: 'Municipal Staff Regulations 2021',
      refBadge: 'badge-warning',
      confidence: 85
    },
    {
      severity: 'red',
      title: 'EFT Payment Data Incomplete',
      desc: 'Employees missing banking details cannot receive salary payments via EFT. Resolve before next payroll run to prevent payment failures.',
      ref: 'MFMA Section 65',
      refBadge: 'badge-danger',
      confidence: 95
    },
    {
      severity: 'blue',
      title: 'Employment Equity Reporting Due',
      desc: 'EEA2 and EEA4 annual reports must be submitted to the Department of Employment and Labour. Ensure demographic data is current for accurate reporting.',
      ref: 'Employment Equity Act',
      refBadge: 'badge-info',
      confidence: 80
    }
  ];

  const cards = insights.map(i => `
    <div class="insight-card">
      <div class="insight-severity">
        <span class="severity-dot ${i.severity}"></span>
        <span class="badge ${i.refBadge}">${i.ref}</span>
      </div>
      <div class="insight-title">${i.title}</div>
      <div class="insight-desc">${i.desc}</div>
      <div class="insight-actions">
        <span class="insight-confidence">Confidence: ${i.confidence}%
          <span class="progress-bar"><span class="progress-fill" style="width:${i.confidence}%;background:${i.severity === 'red' ? 'var(--danger)' : i.severity === 'orange' ? 'var(--warning)' : 'var(--info)'}"></span></span>
        </span>
      </div>
    </div>
  `).join('');

  return `
    <div class="ai-section">
      <div class="ai-header">
        <div class="ai-icon">${icon('lightbulb', 16)}</div>
        <span class="ai-title">AI Compliance Insights</span>
        <span class="ai-badge">Rule-based</span>
      </div>
      <div class="insights-grid">${cards}</div>
    </div>
  `;
}

const empListState = { page: 1, limit: 50, search: '', sortBy: 'surname', sortOrder: 'asc', status: '' };

async function loadEmployeeList(resetPage) {
  if (resetPage) empListState.page = 1;
  const el = document.getElementById('tab-list');
  if (!el) return;

  const listContainer = document.getElementById('emp-list-body');
  const target = listContainer || el;
  if (!listContainer) {
    el.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
        <div style="position:relative;flex:1;min-width:200px;max-width:320px">
          ${icon('search',14)}
          <input type="text" id="emp-list-search" class="form-control" placeholder="Search employees..." value="${empListState.search}" style="padding-left:32px;font-size:13px">
        </div>
        <select id="emp-list-status" class="form-control" style="width:140px;font-size:13px">
          <option value="">All Statuses</option>
          <option value="ACTIVE" ${empListState.status==='ACTIVE'?'selected':''}>Active</option>
          <option value="SUSPENDED" ${empListState.status==='SUSPENDED'?'selected':''}>Suspended</option>
          <option value="TERMINATED" ${empListState.status==='TERMINATED'?'selected':''}>Terminated</option>
          <option value="DECEASED" ${empListState.status==='DECEASED'?'selected':''}>Deceased</option>
        </select>
        <select id="emp-list-pagesize" class="form-control" style="width:110px;font-size:13px">
          <option value="25" ${empListState.limit===25?'selected':''}>25 / page</option>
          <option value="50" ${empListState.limit===50?'selected':''}>50 / page</option>
          <option value="100" ${empListState.limit===100?'selected':''}>100 / page</option>
          <option value="200" ${empListState.limit===200?'selected':''}>200 / page</option>
        </select>
      </div>
      <div id="emp-list-body"><div class="loading"><div class="spinner"></div>Loading employees...</div></div>
    `;
    document.getElementById('emp-list-search')?.addEventListener('input', (e) => {
      clearTimeout(empListState._t);
      empListState._t = setTimeout(() => { empListState.search = e.target.value; loadEmployeeList(true); }, 350);
    });
    document.getElementById('emp-list-status')?.addEventListener('change', (e) => { empListState.status = e.target.value; loadEmployeeList(true); });
    document.getElementById('emp-list-pagesize')?.addEventListener('change', (e) => { empListState.limit = parseInt(e.target.value); loadEmployeeList(true); });
  }

  const body = document.getElementById('emp-list-body');
  if (!body) return;
  body.innerHTML = '<div class="loading"><div class="spinner"></div>Loading employees...</div>';

  try {
    let url = `/employees?limit=${empListState.limit}&page=${empListState.page}&sort_by=${empListState.sortBy}&sort_order=${empListState.sortOrder}`;
    if (empListState.search) url += `&search=${encodeURIComponent(empListState.search)}`;
    if (empListState.status) url += `&status=${empListState.status}`;
    const data = await api(url);
    const total = data.meta?.total || 0;
    const totalPages = Math.ceil(total / empListState.limit) || 1;
    const page = empListState.page;

    const rows = data.data.map(emp => `
      <tr>
        <td><strong>${emp.employee_code}</strong></td>
        <td>${emp.title || ''} ${emp.first_name} ${emp.surname}</td>
        <td>${emp.position_title || '-'}</td>
        <td>${emp.department_name || '-'}</td>
        <td>${emp.division_name || '-'}</td>
        <td>${formatCurrency(emp.annual_salary)}</td>
        <td><span class="status-badge status-${(emp.status || '').toLowerCase()}">${emp.status}</span></td>
      </tr>
    `).join('');

    const from = ((page - 1) * empListState.limit) + 1;
    const to = Math.min(page * empListState.limit, total);

    let pageButtons = '';
    const maxBtns = 7;
    let startP = Math.max(1, page - Math.floor(maxBtns / 2));
    let endP = Math.min(totalPages, startP + maxBtns - 1);
    if (endP - startP < maxBtns - 1) startP = Math.max(1, endP - maxBtns + 1);

    if (startP > 1) pageButtons += `<button class="pagination-btn" onclick="empListState.page=1;loadEmployeeList()">1</button>`;
    if (startP > 2) pageButtons += `<span style="padding:0 4px;color:var(--text-muted)">...</span>`;
    for (let i = startP; i <= endP; i++) {
      pageButtons += `<button class="pagination-btn${i === page ? ' pagination-active' : ''}" onclick="empListState.page=${i};loadEmployeeList()">${i}</button>`;
    }
    if (endP < totalPages - 1) pageButtons += `<span style="padding:0 4px;color:var(--text-muted)">...</span>`;
    if (endP < totalPages) pageButtons += `<button class="pagination-btn" onclick="empListState.page=${totalPages};loadEmployeeList()">${totalPages}</button>`;

    body.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Position</th><th>Department</th><th>Division</th><th>Annual Salary</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">No employees found</td></tr>'}</tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 4px;flex-wrap:wrap;gap:8px">
        <div style="font-size:13px;color:var(--text-secondary)">
          Showing ${total > 0 ? from : 0}${to > from ? '–' + to : ''} of ${total.toLocaleString()} employees
        </div>
        ${totalPages > 1 ? `
          <div style="display:flex;align-items:center;gap:4px">
            <button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} onclick="empListState.page=${page - 1};loadEmployeeList()">${icon('chevronLeft',14)}</button>
            ${pageButtons}
            <button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} onclick="empListState.page=${page + 1};loadEmployeeList()">${icon('chevronRight',14)}</button>
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load employees: ${err.message}</div>`;
  }
}

async function loadModuleContent(module) {
  const breadcrumb = document.getElementById('breadcrumb-module');
  if (breadcrumb) breadcrumb.textContent = getModuleName(module);

  if (module === 'dashboard') {
    showPage('executive-dashboard');
    loadDashboard();
  } else {
    showPage('module-page');
    const titleEl = document.getElementById('module-title');
    const subtitleEl = document.getElementById('module-subtitle');
    if (titleEl) titleEl.textContent = getModuleName(module);
    if (subtitleEl) subtitleEl.textContent = getModuleDescription(module);
    loadModuleData(module);
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
  const page = document.getElementById(pageId);
  if (page) page.style.display = 'block';
}

function getModuleName(m) {
  const names = {
    dashboard: 'Executive Dashboard',
    employees: 'HR Management',
    positions: 'Staff Establishment',
    organogram: 'Organogram',
    payroll: 'Payroll Management',
    leave: 'Leave Management',
    benefits: 'Employee Benefits',
    time: 'Time & Attendance',
    performance: 'Staff Performance',
    departments: 'Departments',
    reports: 'Reports & Exports',
    disciplinary: 'Disciplinary & Grievance',
    skills: 'Skills & Training',
    recruitment: 'Recruitment',
    ess: 'Employee Self-Service',
    'settings-municipality': 'Municipality Details',
    'settings-employeetypes': 'Employee Sub Types',
    'settings-taskgrades': 'Task Grades & Notches',
    'settings-conditions': 'Conditions of Service',
    'settings-tax': 'Tax Tables',
    'settings-leave': 'Leave Types',
    'settings-salaryheads': 'Salary Heads',
    'settings-bank': 'Bank & Payments',
    'settings-security': 'Security & RBAC',
    'settings-leavepolicies': 'Leave Policies',
    'settings-claimrates': 'Claim Rates',
    'settings-saltransgroups': 'Salary Trans Groups',
    'settings-upperlimits': 'Upper Limits',
    'settings-workflows': 'Workflows',
  };
  return names[m] || m;
}

function getModuleDescription(m) {
  const descs = {
    employees: 'Employee lifecycle management, TASK grades, employment equity',
    positions: 'Organogram, positions, job profiles, TASK grading',
    organogram: 'Interactive visual organisational structure, hierarchy, vacant posts',
    payroll: 'Payroll lifecycle, PAYE/UIF/SDL, EFT, third party payments',
    leave: 'BCEA leave types, accruals, workflow approvals',
    benefits: 'Medical aid, retirement funds, dependant management',
    time: 'Biometric integration, shifts, overtime, claims, instalments',
    performance: 'KPAs, quarterly reviews, SDBIP alignment',
    departments: 'Municipal departments and divisions',
    reports: 'IRP5, EMP201, EMP501, payslips, EFT files, e@syFile, data exports',
    disciplinary: 'Disciplinary cases, grievances, CCMA tracking, LRA compliance',
    skills: 'Training courses, qualifications, WSP/ATR, LGSETA reporting',
    recruitment: 'Vacancies, applicant tracking, interviews, appointments',
    ess: 'Self-service portal: profile, payslips, leave, benefits, documents',
    'settings-municipality': 'Municipality name, code, address, SARS registration, IRP5 details',
    'settings-employeetypes': 'Manage employee sub types linked to the 7 constant employee types',
    'settings-taskgrades': 'TASK grading structure with notch salaries and effective dates',
    'settings-conditions': 'Working conditions agreements (SALGBC, TASK, Councillor, Shift Worker)',
    'settings-tax': 'PAYE brackets, rebates, thresholds, UIF, SDL, medical tax credits',
    'settings-leave': 'Configure leave types, accrual rules, and entitlements',
    'settings-salaryheads': 'Earnings, deductions, and company contributions with mSCOA mapping',
    'settings-bank': 'Payment configuration, municipality bank details, H2H integration',
    'settings-security': 'Role-based access control, permissions matrix, user-role assignment',
    'settings-leavepolicies': 'BCEA leave policy configuration per leave type',
    'settings-claimrates': 'Travel, S&T, and other claim rate tables',
    'settings-saltransgroups': 'Salary transaction groups for payroll categorisation',
    'settings-upperlimits': 'Upper limit salary caps for non-TASK graded employees (senior management, councillors)',
    'settings-workflows': 'Approval workflow definitions and step configuration',
  };
  return descs[m] || '';
}

async function loadModuleData(module) {
  const el = document.getElementById('module-body');
  if (!el) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';

  try {
    switch (module) {
      case 'employees': await renderEmployeeModule(el); break;
      case 'jobprofiles': if (typeof JobProfilesModule !== 'undefined') await JobProfilesModule.render(el); else el.innerHTML = '<div class="loading">Job Profiles module loading...</div>'; break;
      case 'positions': await renderPositionModule(el); break;
      case 'payroll': await renderPayrollModule(el); break;
      case 'leave': await renderLeaveModule(el); break;
      case 'benefits': await renderBenefitsModule(el); break;
      case 'time': await renderTimeModule(el); break;
      case 'performance': await renderPerformanceModule(el); break;
      case 'departments': await renderDepartmentModule(el); break;
      case 'reports': if (typeof ReportsModule !== 'undefined') await ReportsModule.render(el); else el.innerHTML = '<div class="loading">Reports module loading...</div>'; break;
      case 'disciplinary': if (typeof DisciplinaryModule !== 'undefined') await DisciplinaryModule.render(el); else el.innerHTML = '<div class="loading">Disciplinary module loading...</div>'; break;
      case 'skills': if (typeof SkillsModule !== 'undefined') await SkillsModule.render(el); else el.innerHTML = '<div class="loading">Skills module loading...</div>'; break;
      case 'recruitment': if (typeof RecruitmentModule !== 'undefined') await RecruitmentModule.render(el); else el.innerHTML = '<div class="loading">Recruitment module loading...</div>'; break;
      case 'organogram': await renderOrganogramModule(el); break;
      case 'ess': if (typeof ESSModule !== 'undefined') await ESSModule.render(el); else el.innerHTML = '<div class="loading">ESS module loading...</div>'; break;
      case 'settings': if (typeof SettingsModule !== 'undefined') await SettingsModule.render(el); else el.innerHTML = '<div class="loading">Settings module loading...</div>'; break;
      case 'settings-municipality':
      case 'settings-employeetypes':
      case 'settings-taskgrades':
      case 'settings-conditions':
      case 'settings-tax':
      case 'settings-leave':
      case 'settings-salaryheads':
      case 'settings-bank':
      case 'settings-security':
      case 'settings-leavepolicies':
      case 'settings-claimrates':
      case 'settings-saltransgroups':
      case 'settings-upperlimits':
      case 'settings-workflows':
        if (typeof SettingsModule !== 'undefined') {
          const settingsTab = module.replace('settings-', '');
          SettingsModule.state.activeTab = settingsTab;
          await SettingsModule.renderDirect(el);
        } else { el.innerHTML = '<div class="loading">Settings module loading...</div>'; }
        break;
      default: el.innerHTML = '<div class="loading">Module not implemented yet</div>';
    }
  } catch (err) {
    el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
  }
}

async function renderEmployeeModule(el) {
  if (typeof EmployeeModule !== 'undefined') {
    await EmployeeModule.init(el);
    return;
  }
  const data = await api('/employees?limit=50&sort_by=surname&sort_order=asc');
  const rows = data.data.map(emp => `
    <tr>
      <td><strong>${emp.employee_code}</strong></td>
      <td>${emp.title || ''} ${emp.first_name} ${emp.surname}</td>
      <td>${emp.position_title || '-'}</td>
      <td>${emp.department_name || '-'}</td>
      <td>${formatCurrency(emp.annual_salary)}</td>
      <td><span class="status-badge status-${(emp.status||'').toLowerCase()}">${emp.status}</span></td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div class="kpi-row" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-header"><span class="kpi-label">Total Employees</span></div><div class="kpi-value">${data.meta.total}</div></div>
    </div>
    <div class="data-grid">
      <table>
        <thead><tr><th>Code</th><th>Name</th><th>Position</th><th>Department</th><th>Salary</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function renderPositionModule(el) {
  if (typeof PositionsModule !== 'undefined') {
    await PositionsModule.render(el);
  } else {
    const data = await api('/positions?limit=50');
    const rows = data.data.map(p => `
      <tr>
        <td><strong>${p.position_code}</strong></td>
        <td>${p.title}</td>
        <td>${p.department_name || '-'}</td>
        <td>${p.grade_code || '-'}</td>
        <td>${p.incumbent_surname ? `${p.incumbent_first_name} ${p.incumbent_surname}` : '-'}</td>
        <td><span class="status-badge status-${(p.status||'').toLowerCase()}">${p.status}</span></td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>Code</th><th>Title</th><th>Department</th><th>Grade</th><th>Incumbent</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
}

async function renderPayrollModule(el) {
  if (typeof PayrollModule !== 'undefined') {
    await PayrollModule.render(el);
    return;
  }
  const [runs, cycles] = await Promise.all([api('/payroll/runs?limit=20'), api('/payroll/cycles')]);
  const rows = runs.data.map(r => `
    <tr>
      <td>${r.cycle_name}</td>
      <td>Period ${r.period_number} (${r.tax_year})</td>
      <td>${r.run_type}</td>
      <td>${formatCurrency(r.total_nett)}</td>
      <td>${r.employee_count}</td>
      <td><span class="status-badge status-${(r.status||'').toLowerCase()}">${r.status}</span></td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div class="data-grid">
      <table>
        <thead><tr><th>Cycle</th><th>Period</th><th>Type</th><th>Nett Pay</th><th>Employees</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No payroll runs yet. Create one via API.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

async function renderLeaveModule(el) {
  if (typeof LeaveModule !== 'undefined') {
    await LeaveModule.render(el);
  } else {
    el.innerHTML = '<div class="loading" style="color:var(--danger)">Leave module not loaded</div>';
  }
}


async function renderDepartmentModule(el) {
  if (typeof PositionsModule !== 'undefined') {
    el.innerHTML = '';
    PositionsModule.showDepartmentManager();
    return;
  }
  const data = await api('/departments');
  const rows = data.data.map(d => `
    <tr>
      <td><strong>${d.code}</strong></td>
      <td>${d.name}</td>
      <td>${d.division_count || 0}</td>
      <td>${d.filled_positions || 0} / ${d.position_count || 0}</td>
      <td>${d.vacant_positions || 0}</td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div class="data-grid">
      <table>
        <thead><tr><th>Code</th><th>Department</th><th>Divisions</th><th>Filled/Total</th><th>Vacant</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function renderBenefitsModule(el) {
  if (typeof BenefitsModule !== 'undefined') {
    await BenefitsModule.render(el);
    return;
  }
  el.innerHTML = UI.emptyState('\uD83C\uDFE5', 'Benefits Module', 'Loading...');
}

async function renderTimeModule(el) {
  if (typeof TimeModule !== 'undefined') {
    await TimeModule.render(el);
    return;
  }
  el.innerHTML = UI.emptyState('\u23F0', 'Time & Attendance', 'Loading...');
}

async function renderPerformanceModule(el) {
  if (typeof PerformanceModule !== 'undefined') {
    await PerformanceModule.render(el);
    return;
  }
  el.innerHTML = UI.emptyState('\uD83C\uDFC6', 'Staff Performance', 'Loading...');
}

async function loadNotifications() {
  try {
    const data = await api('/notifications?limit=20');
    const countEl = document.getElementById('notification-count');
    const listEl = document.getElementById('notification-list');
    if (countEl && data.data.unread_count > 0) {
      countEl.textContent = data.data.unread_count > 9 ? '9+' : data.data.unread_count;
      countEl.style.display = 'block';
    } else if (countEl) {
      countEl.style.display = 'none';
    }
    if (listEl) {
      const items = (data.data.notifications || []);
      if (!items.length) {
        listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">No notifications</div>';
      } else {
        listEl.innerHTML = items.map(n => `
          <div style="padding:8px 12px;border-bottom:1px solid var(--border);cursor:pointer;${n.is_read ? 'opacity:0.6' : 'background:#f8f9ff'}" onclick="markNotificationRead(${n.id})">
            <div style="font-size:13px;font-weight:${n.is_read ? '400' : '600'}">${n.title}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${n.message}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${new Date(n.created_at).toLocaleString('en-ZA')}</div>
          </div>
        `).join('');
      }
    }
  } catch (err) {}
}

function toggleNotifications() {
  const dd = document.getElementById('notification-dropdown');
  if (dd) {
    const isVisible = dd.style.display !== 'none';
    dd.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) loadNotifications();
  }
}

async function markNotificationRead(id) {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    loadNotifications();
  } catch (err) {}
}

async function markAllNotificationsRead() {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
    loadNotifications();
  } catch (err) {}
}

async function openWorkflowConfig() {
  const content = `<div id="workflow-config-body"><div class="loading"><div class="spinner"></div>Loading workflows...</div></div>`;
  const footer = `<button class="btn btn-primary" onclick="showAddWorkflowForm()">${icon('plus', 14)} Add Workflow</button>
    <button class="btn" data-close-modal>Close</button>`;
  UI.modal({ title: `${icon('settings', 18)} Approval Workflow Configuration`, content, size: 'lg', footer });
  await loadWorkflowList();
}

async function loadWorkflowList() {
  const body = document.getElementById('workflow-config-body');
  if (!body) return;
  try {
    const data = await api('/notifications/approval-workflows');
    const workflows = data.data || [];
    if (!workflows.length) {
      body.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted)">
        <div style="margin-bottom:8px">${icon('settings', 32)}</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">No Approval Workflows Configured</div>
        <div style="font-size:13px">Click "Add Workflow" to create your first approval workflow for leave, payroll, or other processes.</div>
      </div>`;
      return;
    }
    const rows = workflows.map(w => {
      const steps = typeof w.steps === 'string' ? JSON.parse(w.steps) : (w.steps || []);
      const stepCount = Array.isArray(steps) ? steps.length : 0;
      return `<tr>
        <td style="font-weight:600">${escapeHtml(w.workflow_name)}</td>
        <td><span class="badge badge-info">${escapeHtml(w.entity_type || '-')}</span></td>
        <td>${stepCount} level${stepCount !== 1 ? 's' : ''}</td>
        <td><span class="status-badge ${w.is_active ? 'status-active' : 'status-inactive'}">${w.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-sm" onclick="editWorkflow(${w.id})" title="Edit">${icon('edit', 14)}</button>
        </td>
      </tr>`;
    }).join('');
    body.innerHTML = `<div class="data-grid"><table>
      <thead><tr><th>Workflow Name</th><th>Entity Type</th><th>Approver Levels</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  } catch (err) {
    body.innerHTML = `<div style="padding:16px;color:var(--danger);text-align:center">Failed to load workflows: ${escapeHtml(err.message)}</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showAddWorkflowForm() {
  const body = document.getElementById('workflow-config-body');
  if (!body) return;
  body.innerHTML = `<div style="padding:8px">
    <h4 style="margin-bottom:12px;font-size:14px">New Approval Workflow</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Workflow Name</label>
        <input type="text" id="wf-name" class="form-control" placeholder="e.g. Leave Approval">
      </div>
      <div>
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Entity Type</label>
        <select id="wf-entity" class="form-control">
          <option value="leave">Leave</option>
          <option value="payroll">Payroll</option>
          <option value="recruitment">Recruitment</option>
          <option value="benefits">Benefits</option>
          <option value="disciplinary">Disciplinary</option>
          <option value="overtime">Overtime</option>
          <option value="claims">Claims</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Approval Levels</label>
      <div id="wf-steps">
        <div class="wf-step-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
          <span style="font-size:12px;font-weight:600;min-width:60px">Level 1:</span>
          <input type="text" class="wf-step-role" placeholder="Approver role (e.g. Line Manager)" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px">
        </div>
      </div>
      <button class="btn btn-sm" onclick="addWorkflowStep()" style="margin-top:4px">${icon('plus', 12)} Add Level</button>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--border)">
      <button class="btn" onclick="loadWorkflowList()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewWorkflow()">Save Workflow</button>
    </div>
  </div>`;
}

function addWorkflowStep() {
  const container = document.getElementById('wf-steps');
  if (!container) return;
  const count = container.querySelectorAll('.wf-step-row').length + 1;
  const row = document.createElement('div');
  row.className = 'wf-step-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
  row.innerHTML = `<span style="font-size:12px;font-weight:600;min-width:60px">Level ${count}:</span>
    <input type="text" class="wf-step-role" placeholder="Approver role" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px">
    <button class="btn btn-sm" onclick="this.closest('.wf-step-row').remove()" title="Remove">${icon('trash', 12)}</button>`;
  container.appendChild(row);
}

async function saveNewWorkflow() {
  const name = document.getElementById('wf-name')?.value?.trim();
  const entity = document.getElementById('wf-entity')?.value;
  const stepInputs = document.querySelectorAll('.wf-step-role');
  const steps = [];
  stepInputs.forEach((input, i) => {
    const role = input.value.trim();
    if (role) steps.push({ level: i + 1, role });
  });
  if (!name) { UI.toast('error', 'Validation', 'Workflow name is required'); return; }
  if (!steps.length) { UI.toast('error', 'Validation', 'At least one approval level is required'); return; }
  try {
    await apiPost('/notifications/approval-workflows', { workflow_name: name, entity_type: entity, steps });
    UI.toast('success', 'Workflow Created', `${escapeHtml(name)} has been saved`);
    await loadWorkflowList();
  } catch (err) {
    UI.toast('error', 'Error', err.message);
  }
}

async function editWorkflow(id) {
  const body = document.getElementById('workflow-config-body');
  if (!body) return;
  body.innerHTML = '<div class="loading"><div class="spinner"></div>Loading workflow...</div>';
  try {
    const data = await api('/notifications/approval-workflows');
    const wf = (data.data || []).find(w => w.id === id);
    if (!wf) { UI.toast('error', 'Error', 'Workflow not found'); await loadWorkflowList(); return; }
    const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : (wf.steps || []);
    const stepRows = (Array.isArray(steps) ? steps : []).map((s, i) => `
      <div class="wf-step-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
        <span style="font-size:12px;font-weight:600;min-width:60px">Level ${i + 1}:</span>
        <input type="text" class="wf-step-role" value="${escapeHtml(s.role || '')}" placeholder="Approver role" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px">
        <button class="btn btn-sm" onclick="this.closest('.wf-step-row').remove()" title="Remove">${icon('trash', 12)}</button>
      </div>`).join('');

    body.innerHTML = `<div style="padding:8px">
      <h4 style="margin-bottom:12px;font-size:14px">Edit Workflow</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Workflow Name</label>
          <input type="text" id="wf-edit-name" class="form-control" value="${escapeHtml(wf.workflow_name)}">
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Entity Type</label>
          <select id="wf-edit-entity" class="form-control">
            <option value="leave" ${wf.entity_type === 'leave' ? 'selected' : ''}>Leave</option>
            <option value="payroll" ${wf.entity_type === 'payroll' ? 'selected' : ''}>Payroll</option>
            <option value="recruitment" ${wf.entity_type === 'recruitment' ? 'selected' : ''}>Recruitment</option>
            <option value="benefits" ${wf.entity_type === 'benefits' ? 'selected' : ''}>Benefits</option>
            <option value="disciplinary" ${wf.entity_type === 'disciplinary' ? 'selected' : ''}>Disciplinary</option>
            <option value="overtime" ${wf.entity_type === 'overtime' ? 'selected' : ''}>Overtime</option>
            <option value="claims" ${wf.entity_type === 'claims' ? 'selected' : ''}>Claims</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary)">Active</label>
        <input type="checkbox" id="wf-edit-active" ${wf.is_active ? 'checked' : ''}>
      </div>
      <div style="margin-bottom:12px">
        <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-secondary)">Approval Levels</label>
        <div id="wf-steps">${stepRows || '<div class="wf-step-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><span style="font-size:12px;font-weight:600;min-width:60px">Level 1:</span><input type="text" class="wf-step-role" placeholder="Approver role" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px"></div>'}</div>
        <button class="btn btn-sm" onclick="addWorkflowStep()" style="margin-top:4px">${icon('plus', 12)} Add Level</button>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:8px;border-top:1px solid var(--border)">
        <button class="btn" onclick="loadWorkflowList()">Cancel</button>
        <button class="btn btn-primary" onclick="updateWorkflow(${id})">Update Workflow</button>
      </div>
    </div>`;
  } catch (err) {
    UI.toast('error', 'Error', err.message);
    await loadWorkflowList();
  }
}

async function updateWorkflow(id) {
  const name = document.getElementById('wf-edit-name')?.value?.trim();
  const entity = document.getElementById('wf-edit-entity')?.value;
  const isActive = document.getElementById('wf-edit-active')?.checked;
  const stepInputs = document.querySelectorAll('.wf-step-role');
  const steps = [];
  stepInputs.forEach((input, i) => {
    const role = input.value.trim();
    if (role) steps.push({ level: i + 1, role });
  });
  if (!name) { UI.toast('error', 'Validation', 'Workflow name is required'); return; }
  if (!steps.length) { UI.toast('error', 'Validation', 'At least one approval level is required'); return; }
  try {
    const res = await fetch(`${API_BASE}/notifications/approval-workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_name: name, entity_type: entity, steps, is_active: isActive })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || 'Failed to update workflow');
    UI.toast('success', 'Workflow Updated', `${escapeHtml(name)} has been updated`);
    await loadWorkflowList();
  } catch (err) {
    UI.toast('error', 'Error', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  loadDashboard();
  loadNotifications();
  setInterval(loadNotifications, 60000);
  document.addEventListener('click', (e) => {
    const bell = document.getElementById('notification-bell');
    const dd = document.getElementById('notification-dropdown');
    if (dd && dd.style.display !== 'none' && !bell?.contains(e.target) && !dd.contains(e.target)) {
      dd.style.display = 'none';
    }
  });
});
