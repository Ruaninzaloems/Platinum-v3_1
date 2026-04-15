const ESSModule = {
  state: {
    employeeId: null,
    profile: null,
    activeView: 'profile',
    employees: [],
  },

  async render(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading Employee Self-Service...</div>';
    try {
      const empData = await api('/employees?limit=500&sort_by=surname&sort_order=asc');
      this.state.employees = empData.data || [];
      if (!this.state.employeeId && this.state.employees.length > 0) {
        this.state.employeeId = this.state.employees[0].id;
      }
      this.renderShell(el);
      this.bindEvents(el);
      if (this.state.employeeId) await this.loadProfile();
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load ESS: ${err.message}</div>`;
    }
  },

  renderShell(el) {
    const empOptions = this.state.employees.map(e =>
      `<option value="${e.id}" ${e.id == this.state.employeeId ? 'selected' : ''}>${e.employee_code} - ${e.first_name} ${e.surname}</option>`
    ).join('');

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <label style="font-weight:600;font-size:13px;color:var(--text-secondary)">Select Employee:</label>
        <select id="ess-employee-select" class="form-control" style="max-width:320px">${empOptions}</select>
      </div>
      ${UI.detailTabs([
        { id: 'profile', label: 'My Profile', icon: icon('user', 14) },
        { id: 'payslips', label: 'Payslips', icon: icon('dollar', 14) },
        { id: 'leave', label: 'Leave', icon: icon('calendar', 14) },
        { id: 'benefits', label: 'Benefits', icon: icon('heart', 14) },
        { id: 'documents', label: 'Documents', icon: icon('file', 14) },
        { id: 'performance', label: 'Performance', icon: icon('activity', 14) },
        { id: 'dependants', label: 'Dependants', icon: icon('users', 14) },
      ], this.state.activeView)}
      <div id="ess-content"></div>
    `;
  },

  bindEvents(el) {
    el.querySelectorAll('[data-detail-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.activeView = tab.dataset.detailTab;
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderActiveView();
      });
    });
    const select = document.getElementById('ess-employee-select');
    if (select) {
      select.addEventListener('change', async () => {
        this.state.employeeId = select.value;
        await this.loadProfile();
      });
    }
  },

  async renderActiveView() {
    const c = document.getElementById('ess-content');
    if (!c) return;
    c.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      switch (this.state.activeView) {
        case 'profile': await this.loadProfile(); break;
        case 'payslips': await this.renderPayslips(c); break;
        case 'leave': await this.renderLeave(c); break;
        case 'benefits': await this.renderBenefits(c); break;
        case 'documents': await this.renderDocuments(c); break;
        case 'performance': await this.renderPerformance(c); break;
        case 'dependants': await this.renderDependants(c); break;
      }
    } catch (err) {
      c.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadProfile() {
    const c = document.getElementById('ess-content');
    if (!c || !this.state.employeeId) return;
    c.innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';
    try {
      const data = await api(`/ess/profile/${this.state.employeeId}`);
      this.state.profile = data.data;
      this.renderProfile(c);
    } catch (err) {
      c.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  renderProfile(c) {
    const p = this.state.profile;
    if (!p) return;
    const photoHtml = p.photo_url
      ? `<img src="${p.photo_url}" alt="Photo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border)">`
      : `<div style="width:80px;height:80px;border-radius:50%;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:28px;font-weight:700;border:2px solid var(--border)">${(p.first_name||'')[0]||''}${(p.surname||'')[0]||''}</div>`;

    c.innerHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px">
        ${photoHtml}
        <div>
          <div style="font-size:20px;font-weight:700;color:var(--text-primary)">${p.title || ''} ${p.first_name} ${p.surname}</div>
          <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">${p.position_title || 'No position'} - ${p.department_name || 'No department'}</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <span class="badge badge-primary">${p.employee_code}</span>
            <span class="status-badge status-${(p.status||'').toLowerCase()}">${p.status}</span>
          </div>
        </div>
      </div>
      <div class="two-col">
        <div class="data-grid">
          <table>
            <thead><tr><th colspan="2">Personal Information</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600;width:40%">ID Number</td><td>${p.id_number || '-'}</td></tr>
              <tr><td style="font-weight:600">Date of Birth</td><td>${p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-ZA') : '-'}</td></tr>
              <tr><td style="font-weight:600">Gender</td><td>${p.gender || '-'}</td></tr>
              <tr><td style="font-weight:600">Race</td><td>${p.race || '-'}</td></tr>
              <tr><td style="font-weight:600">Nationality</td><td>${p.nationality || '-'}</td></tr>
              <tr><td style="font-weight:600">Marital Status</td><td>${p.marital_status || '-'}</td></tr>
              <tr><td style="font-weight:600">Disability</td><td>${p.disability_status || 'None'}</td></tr>
              <tr><td style="font-weight:600">Tax Number</td><td>${p.income_tax_number || '-'}</td></tr>
              <tr><td style="font-weight:600">Joining Date</td><td>${p.joining_date ? new Date(p.joining_date).toLocaleDateString('en-ZA') : '-'}</td></tr>
              <tr><td style="font-weight:600">TASK Grade</td><td>${p.grade_code ? p.grade_code + ' - ' + (p.grade_name || '') : '-'}</td></tr>
              <tr><td style="font-weight:600">Employee Type</td><td>${p.employee_type_name || '-'}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th colspan="2">Contact Details</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600;width:40%">Email</td><td>${p.email_address || '-'}</td></tr>
              <tr><td style="font-weight:600">Cell Number</td><td>${p.cell_number || '-'}</td></tr>
              <tr><td style="font-weight:600">Work Number</td><td>${p.work_number || '-'}</td></tr>
              <tr><td style="font-weight:600">Physical Address</td><td>${[p.physical_address_1, p.physical_address_2, p.physical_city, p.physical_province, p.physical_postal_code].filter(Boolean).join(', ') || '-'}</td></tr>
              <tr><td style="font-weight:600">Postal Address</td><td>${[p.postal_address_1, p.postal_address_2, p.postal_city, p.postal_province, p.postal_code].filter(Boolean).join(', ') || '-'}</td></tr>
              <tr><td style="font-weight:600">Annual Salary</td><td>${p.annual_salary ? formatCurrency(p.annual_salary) : '-'}</td></tr>
              <tr><td style="font-weight:600">Division</td><td>${p.division_name || '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async renderPayslips(c) {
    const data = await api(`/ess/payslips/${this.state.employeeId}`);
    const rows = (data.data || []).map(ps => `
      <tr>
        <td>${ps.cycle_name}</td>
        <td>Period ${ps.period_number} (${ps.tax_year})</td>
        <td><span class="badge badge-${ps.run_type === 'FINAL' ? 'danger' : 'info'}">${ps.run_type}</span></td>
        <td style="text-align:right">${formatCurrency(ps.gross_pay)}</td>
        <td style="text-align:right;color:var(--danger)">${formatCurrency(ps.total_deductions)}</td>
        <td style="text-align:right;font-weight:700">${formatCurrency(ps.nett_pay)}</td>
        <td>${ps.payment_date ? new Date(ps.payment_date).toLocaleDateString('en-ZA') : '-'}</td>
        <td><span class="status-badge status-${(ps.status||'').toLowerCase()}">${ps.status}</span></td>
      </tr>
    `).join('');

    c.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>Cycle</th><th>Period</th><th>Type</th><th style="text-align:right">Gross</th><th style="text-align:right">Deductions</th><th style="text-align:right">Nett Pay</th><th>Payment Date</th><th>Status</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No payslips found</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderLeave(c) {
    const [balances, requests, types] = await Promise.all([
      api(`/ess/leave-balances/${this.state.employeeId}`),
      api(`/ess/leave-requests/${this.state.employeeId}`),
      api('/leave/types'),
    ]);

    const balanceCards = (balances.data || []).map(b => `
      <div class="kpi-card" style="border-left-color:var(--info)">
        <div class="kpi-header"><span class="kpi-label">${b.leave_type}</span><span class="badge badge-info">${b.code}</span></div>
        <div class="kpi-value">${parseFloat(b.balance || 0).toFixed(1)}</div>
        <div class="kpi-sub">${parseFloat(b.accrued || 0).toFixed(1)} accrued, ${parseFloat(b.taken || 0).toFixed(1)} taken</div>
      </div>
    `).join('');

    const requestRows = (requests.data || []).map(r => `
      <tr>
        <td><span class="badge badge-info">${r.code}</span> ${r.leave_type}</td>
        <td>${new Date(r.start_date).toLocaleDateString('en-ZA')}</td>
        <td>${new Date(r.end_date).toLocaleDateString('en-ZA')}</td>
        <td style="text-align:center">${parseFloat(r.days_requested).toFixed(1)}</td>
        <td><span class="status-badge status-${(r.status||'').toLowerCase()}">${r.status}</span></td>
        <td>${r.reason || '-'}</td>
      </tr>
    `).join('');

    const typeOpts = (types.data || []).map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    c.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0;font-size:15px;font-weight:600">Leave Balances</h3>
        <button class="btn btn-primary btn-sm" id="ess-apply-leave-btn">${icon('plus',14)} Apply for Leave</button>
      </div>
      <div class="kpi-row" style="margin-bottom:20px">${balanceCards || '<div style="color:var(--text-muted)">No balances found</div>'}</div>
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:600">Leave History</h3>
      <div class="data-grid">
        <table>
          <thead><tr><th>Type</th><th>Start</th><th>End</th><th style="text-align:center">Days</th><th>Status</th><th>Reason</th></tr></thead>
          <tbody>${requestRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No leave requests</td></tr>'}</tbody>
        </table>
      </div>
      <div id="ess-leave-form-container" style="display:none;margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:8px;background:#fff">
        <h4 style="margin:0 0 12px;font-size:14px;font-weight:600">New Leave Request</h4>
        <form id="ess-leave-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div><label class="form-label">Leave Type</label><select name="leave_type_id" class="form-control" required>${typeOpts}</select></div>
          <div><label class="form-label">Reason</label><input name="reason" class="form-control" placeholder="Optional"></div>
          <div><label class="form-label">Start Date</label><input type="date" name="start_date" class="form-control" required></div>
          <div><label class="form-label">End Date</label><input type="date" name="end_date" class="form-control" required></div>
          <div><label class="form-label">Days Requested</label><input type="number" name="days_requested" class="form-control" step="0.5" min="0.5" required></div>
          <div style="display:flex;align-items:flex-end;gap:8px">
            <button type="submit" class="btn btn-primary btn-sm">Submit Request</button>
            <button type="button" class="btn btn-sm" id="ess-cancel-leave">Cancel</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('ess-apply-leave-btn')?.addEventListener('click', () => {
      document.getElementById('ess-leave-form-container').style.display = 'block';
    });
    document.getElementById('ess-cancel-leave')?.addEventListener('click', () => {
      document.getElementById('ess-leave-form-container').style.display = 'none';
    });
    document.getElementById('ess-leave-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiPost('/ess/leave-request', {
          employee_id: this.state.employeeId,
          leave_type_id: fd.get('leave_type_id'),
          start_date: fd.get('start_date'),
          end_date: fd.get('end_date'),
          days_requested: fd.get('days_requested'),
          reason: fd.get('reason'),
        });
        UI.toast('success', 'Leave Request Submitted', 'Your leave request has been submitted for approval');
        this.renderLeave(c);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async renderBenefits(c) {
    const data = await api(`/ess/benefits/${this.state.employeeId}`);
    const medRows = (data.data.medical_aid || []).map(m => `
      <tr>
        <td>${m.scheme_name}</td>
        <td>${m.scheme_type || '-'}</td>
        <td>${m.membership_number || '-'}</td>
        <td>${m.join_date ? m.join_date.split('T')[0] : '-'}</td>
      </tr>
    `).join('');
    const retRows = (data.data.retirement_funds || []).map(r => `
      <tr>
        <td>${r.fund_name}</td>
        <td>${r.fund_type || '-'}</td>
        <td>${r.fund_number || '-'}</td>
        <td style="text-align:right">${formatCurrency(r.employee_amount)}</td>
        <td style="text-align:right">${formatCurrency(r.employer_amount)}</td>
      </tr>
    `).join('');

    c.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:600">Medical Aid</h3>
      <div class="data-grid" style="margin-bottom:20px">
        <table>
          <thead><tr><th>Scheme</th><th>Type</th><th>Membership No</th><th>Join Date</th><th>Status</th></tr></thead>
          <tbody>${medRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No medical aid</td></tr>'}</tbody>
        </table>
      </div>
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:600">Retirement Funds</h3>
      <div class="data-grid">
        <table>
          <thead><tr><th>Fund</th><th>Type</th><th>Fund Number</th><th style="text-align:right">Employee Amt</th><th style="text-align:right">Employer Amt</th></tr></thead>
          <tbody>${retRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No retirement funds</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderDocuments(c) {
    const data = await api(`/ess/documents/${this.state.employeeId}`);
    const rows = (data.data || []).map(d => `
      <tr>
        <td>${icon('file', 14)} ${d.document_name || '-'}</td>
        <td>${d.document_type || '-'}</td>
        <td>v${d.version_number || 1}</td>
        <td>${d.file_size ? (d.file_size / 1024).toFixed(0) + ' KB' : '-'}</td>
        <td>${d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString('en-ZA') : '-'}</td>
      </tr>
    `).join('');

    c.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>File Name</th><th>Type</th><th>Version</th><th>Size</th><th>Uploaded</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No documents</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderPerformance(c) {
    const data = await api(`/ess/performance/${this.state.employeeId}`);
    const rows = (data.data || []).map(r => {
      const scoreColor = r.score >= 4 ? '#10B981' : r.score >= 3 ? '#3B82F6' : r.score >= 2 ? '#F59E0B' : r.score >= 1 ? '#EF4444' : '#94A3B8';
      return `
        <tr>
          <td>${r.period_name || '-'} (${r.financial_year || '-'})</td>
          <td><strong>${r.kpa || '-'}</strong></td>
          <td>${r.kpi || '-'}</td>
          <td style="text-align:center">${r.weighting || 0}%</td>
          <td style="text-align:center">${r.annual_target || '-'}</td>
          <td style="text-align:center">${r.q1_actual || '-'}</td>
          <td style="text-align:center">${r.q2_actual || '-'}</td>
          <td style="text-align:center">${r.q3_actual || '-'}</td>
          <td style="text-align:center">${r.q4_actual || '-'}</td>
          <td style="text-align:center;font-weight:700;color:${scoreColor}">${r.score || '-'}</td>
          <td><span class="status-badge status-${(r.status||'').toLowerCase()}">${r.status || 'DRAFT'}</span></td>
        </tr>
      `;
    }).join('');

    c.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>Period</th><th>KPA</th><th>KPI</th><th style="text-align:center">Weight</th><th style="text-align:center">Target</th><th style="text-align:center">Q1</th><th style="text-align:center">Q2</th><th style="text-align:center">Q3</th><th style="text-align:center">Q4</th><th style="text-align:center">Score</th><th>Status</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="11" style="text-align:center;color:var(--text-muted)">No performance indicators found</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderDependants(c) {
    const data = await api(`/ess/dependants/${this.state.employeeId}`);
    const rows = (data.data || []).map(d => `
      <tr>
        <td>${d.first_name} ${d.surname}</td>
        <td>${d.relationship || '-'}</td>
        <td>${d.id_number || '-'}</td>
        <td>${d.date_of_birth ? new Date(d.date_of_birth).toLocaleDateString('en-ZA') : '-'}</td>
        <td>${d.gender || '-'}</td>
        <td>${d.contact_number || '-'}</td>
      </tr>
    `).join('');

    c.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>Name</th><th>Relationship</th><th>ID Number</th><th>Date of Birth</th><th>Gender</th><th>Contact</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No dependants on record</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },
};
