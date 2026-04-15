const TimeModule = {
  state: {
    activeTab: 'overtime',
    shifts: [],
    employees: [],
    periods: [],
    overtimePage: 1,
    attendancePage: 1,
    claimsPage: 1,
    ghostResults: null,
    reportsData: null,
  },

  async apiPost(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${res.status}`);
    }
    return res.json();
  },

  async render(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading time & attendance...</div>';
    try {
      const [shifts, empData] = await Promise.all([
        api('/time/shifts'),
        api('/employees?limit=200&sort_by=surname&sort_order=asc'),
      ]);
      this.state.shifts = shifts.data;
      this.state.employees = empData.data;

      el.innerHTML = `
        ${UI.detailTabs([
          { id: 'overtime', label: 'Overtime', icon: icon('clock',14) },
          { id: 'attendance', label: 'Attendance Log', icon: icon('check',14) },
          { id: 'shifts', label: 'Shifts', icon: icon('settings',14) },
          { id: 'rosters', label: 'Shift Rosters', icon: icon('calendar',14) },
          { id: 'flexi', label: 'Flexi-Time', icon: icon('clock',14) },
          { id: 'claims', label: 'Claims', icon: icon('fileText',14) },
          { id: 'instalments', label: 'Instalments', icon: icon('creditCard',14) },
          { id: 'ghost', label: 'Ghost Detection', icon: icon('alertTriangle',14) },
          { id: 'reports', label: 'Time Reports', icon: icon('barChart',14) },
        ], this.state.activeTab)}
        <div id="time-tab-content"></div>
      `;

      el.querySelectorAll('[data-detail-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
          this.state.activeTab = tab.dataset.detailTab;
          el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderTab();
        });
      });

      this.renderTab();
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  renderTab() {
    const el = document.getElementById('time-tab-content');
    if (!el) return;
    switch (this.state.activeTab) {
      case 'overtime': this.renderOvertimeTab(el); break;
      case 'attendance': this.renderAttendanceTab(el); break;
      case 'shifts': this.renderShiftsTab(el); break;
      case 'rosters': this.renderRostersTab(el); break;
      case 'flexi': this.renderFlexiTab(el); break;
      case 'claims': this.renderClaimsTab(el); break;
      case 'instalments': this.renderInstalmentsTab(el); break;
      case 'ghost': this.renderGhostDetection(el); break;
      case 'reports': this.renderTimeReports(el); break;
    }
  },

  async renderOvertimeTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading overtime...</div>';
    try {
      const data = await api(`/time/overtime?limit=20&page=${this.state.overtimePage}`);
      const pendingCount = data.data.filter(o => o.status === 'PENDING').length;

      const rows = data.data.map(o => `
        <tr>
          <td>${o.employee_code} - ${o.first_name} ${o.surname}</td>
          <td>${o.overtime_date ? o.overtime_date.split('T')[0] : '-'}</td>
          <td>${o.salary_head_name || '-'}</td>
          <td style="text-align:right">${o.hours}h</td>
          <td style="text-align:right">x${o.rate_multiplier}</td>
          <td style="text-align:right">${formatCurrency(o.amount)}</td>
          <td><span class="status-badge status-${(o.status||'').toLowerCase()}">${o.status}</span></td>
          <td>
            <div class="action-bar">
              ${o.status === 'PENDING' ? `<button class="action-btn success" onclick="TimeModule.approveOvertime(${o.id})">Approve</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        ${UI.statCards([
          { value: data.meta.total, label: 'Total OT Records', color: '#3B82F6' },
          { value: pendingCount, label: 'Pending Approval', color: '#F59E0B' },
        ])}
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search overtime..." data-search></div>
          <button class="btn btn-primary" onclick="TimeModule.showCaptureOvertime()">${icon('plus',14)} Capture Overtime</button>
          <button class="btn" onclick="TimeModule.showAutoCalculateOT()">${icon('clock',14)} Auto-Calculate OT</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Type</th><th style="text-align:right">Hours</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No overtime records</td></tr>'}</tbody>
          </table>
        </div>
        ${data.meta.total > 20 ? UI.pagination({ page: this.state.overtimePage, limit: 20, total: data.meta.total, onPageChange: 'TimeModule.goOvertimePage' }) : ''}
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  goOvertimePage(page) {
    this.state.overtimePage = page;
    this.renderTab();
  },

  showCaptureOvertime() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Capture Overtime', icon: icon('clock',16) },
      { id: 'ot_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'ot_overtime_date', label: 'Overtime Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'ot_hours', label: 'Hours Worked', type: 'number', required: true, min: 0.5, max: 24, step: 0.5, placeholder: 'e.g. 2' },
      { id: 'ot_rate_multiplier', label: 'Rate Multiplier', type: 'select', required: true, options: [
        { value: '1.5', label: '1.5x (Weekday)' },
        { value: '2.0', label: '2.0x (Sunday/Public Holiday)' },
        { value: '1.0', label: '1.0x (Normal Rate)' },
      ], value: '1.5' },
      { id: 'ot_reason', label: 'Reason', type: 'textarea', placeholder: 'Reason for overtime...', fullWidth: true },
    ]);

    UI.modal({
      title: 'Capture Overtime',
      content: `<div class="form-grid" id="capture-overtime-form">${fields}</div>
        <div style="margin-top:12px;padding:12px;background:#FEF3C7;border-radius:8px;font-size:13px;color:#92400E">
          <strong>BCEA Note:</strong> Overtime may not exceed 10 hours per week (Section 10). Amount is calculated automatically from employee's salary.
        </div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitOvertime()">Submit Overtime</button>
      `,
    });
  },

  async submitOvertime() {
    const form = document.getElementById('capture-overtime-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/time/overtime', {
        employee_id: parseInt(data.ot_employee_id),
        salary_head_id: 1,
        overtime_date: data.ot_overtime_date,
        hours: parseFloat(data.ot_hours),
        rate_multiplier: parseFloat(data.ot_rate_multiplier),
        reason: data.ot_reason,
      });
      UI.closeModal();
      UI.toast('success', 'Submitted', 'Overtime captured successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async approveOvertime(id) {
    const confirmed = await UI.confirm({
      title: 'Approve Overtime',
      message: 'Are you sure you want to approve this overtime transaction?',
      icon: icon('alertTriangle', 28),
      confirmText: 'Approve',
    });
    if (!confirmed) return;
    try {
      await this.apiPost(`/time/overtime/${id}/approve`, {});
      UI.toast('success', 'Approved', 'Overtime transaction approved');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderAttendanceTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading attendance...</div>';
    try {
      const data = await api(`/time/attendance?limit=20&page=${this.state.attendancePage}`);

      const rows = data.data.map(a => `
        <tr>
          <td>${a.employee_code} - ${a.first_name} ${a.surname}</td>
          <td>${a.attendance_date ? a.attendance_date.split('T')[0] : '-'}</td>
          <td>${a.clock_in ? new Date(a.clock_in).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          <td>${a.clock_out ? new Date(a.clock_out).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
          <td style="text-align:right">${a.hours_worked ? parseFloat(a.hours_worked).toFixed(1) + 'h' : '-'}</td>
          <td>${a.shift_name || '-'}</td>
          <td><span class="status-badge status-${(a.status||'').toLowerCase()}">${a.status}</span></td>
          <td>${a.source || '-'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search attendance..." data-search></div>
          <button class="btn btn-primary" onclick="TimeModule.showRecordAttendance()">Record Attendance</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th style="text-align:right">Hours</th><th>Shift</th><th>Status</th><th>Source</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No attendance records</td></tr>'}</tbody>
          </table>
        </div>
        ${data.meta.total > 20 ? UI.pagination({ page: this.state.attendancePage, limit: 20, total: data.meta.total, onPageChange: 'TimeModule.goAttendancePage' }) : ''}
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  goAttendancePage(page) {
    this.state.attendancePage = page;
    this.renderTab();
  },

  showRecordAttendance() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const shiftOpts = this.state.shifts.map(s => ({ value: s.id, label: `${s.name} (${s.shift_start_time}-${s.shift_end_time})` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Record Attendance', icon: icon('check',16) },
      { id: 'att_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'att_attendance_date', label: 'Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'att_clock_in', label: 'Clock In', type: 'text', placeholder: 'HH:MM (e.g. 08:00)' },
      { id: 'att_clock_out', label: 'Clock Out', type: 'text', placeholder: 'HH:MM (e.g. 17:00)' },
      { id: 'att_shift_id', label: 'Shift', type: 'select', options: shiftOpts },
      { id: 'att_status', label: 'Status', type: 'select', required: true, options: [
        { value: 'PRESENT', label: 'Present' },
        { value: 'ABSENT', label: 'Absent' },
        { value: 'LATE', label: 'Late' },
        { value: 'LEAVE', label: 'On Leave' },
        { value: 'HOLIDAY', label: 'Public Holiday' },
      ], value: 'PRESENT' },
    ]);

    UI.modal({
      title: 'Record Attendance',
      content: `<div class="form-grid" id="record-attendance-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitAttendance()">Record</button>
      `,
    });
  },

  async submitAttendance() {
    const form = document.getElementById('record-attendance-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    const dateStr = data.att_attendance_date;
    let clockIn = null, clockOut = null;
    if (data.att_clock_in) clockIn = `${dateStr}T${data.att_clock_in}:00`;
    if (data.att_clock_out) clockOut = `${dateStr}T${data.att_clock_out}:00`;

    try {
      await this.apiPost('/time/attendance', {
        employee_id: parseInt(data.att_employee_id),
        attendance_date: dateStr,
        clock_in: clockIn,
        clock_out: clockOut,
        shift_id: data.att_shift_id ? parseInt(data.att_shift_id) : null,
        status: data.att_status,
      });
      UI.closeModal();
      UI.toast('success', 'Recorded', 'Attendance recorded successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  renderShiftsTab(el) {
    const rows = this.state.shifts.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.short_description || '-'}</td>
        <td>${s.shift_start_time || '-'}</td>
        <td>${s.shift_end_time || '-'}</td>
        <td style="text-align:right">${s.total_hours || '-'}h</td>
        <td>${s.is_night_shift ? '<span class="status-badge status-pending">Night</span>' : '<span class="status-badge status-approved">Day</span>'}</td>
        <td>${s.break_duration_minutes || 0} min</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr><th>Shift Name</th><th>Description</th><th>Start</th><th>End</th><th style="text-align:right">Hours</th><th>Type</th><th>Break</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No shifts defined</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderRostersTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading shift rosters...</div>';
    try {
      const data = await api('/time/shift-rosters');
      const rosters = data.data || [];

      const rows = rosters.map(r => `
        <tr>
          <td>${r.employee_code || ''} - ${r.first_name || ''} ${r.surname || ''}</td>
          <td>${r.shift_name || '-'}</td>
          <td>${r.roster_date ? r.roster_date.split('T')[0] : '-'}</td>
          <td>${r.start_time || '-'}</td>
          <td>${r.end_time || '-'}</td>
          <td><span class="status-badge status-${(r.status || '').toLowerCase()}">${r.status || '-'}</span></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search rosters..." data-search></div>
          <button class="btn btn-primary" onclick="TimeModule.showCreateRoster()">Create Roster</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Shift</th><th>Date</th><th>Start</th><th>End</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No shift rosters found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showCreateRoster() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const shiftOpts = this.state.shifts.map(s => ({ value: s.id, label: `${s.name} (${s.shift_start_time}-${s.shift_end_time})` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Create Shift Roster', icon: icon('calendar',16) },
      { id: 'roster_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'roster_shift_id', label: 'Shift', type: 'select', options: shiftOpts, required: true },
      { id: 'roster_date', label: 'Roster Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    ]);

    UI.modal({
      title: 'Create Shift Roster',
      size: 'sm',
      content: `<div class="form-grid" id="create-roster-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitRoster()">Create</button>
      `,
    });
  },

  async submitRoster() {
    const form = document.getElementById('create-roster-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/time/shift-rosters', {
        employee_id: parseInt(data.roster_employee_id),
        shift_id: parseInt(data.roster_shift_id),
        roster_date: data.roster_date,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'Shift roster created successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderFlexiTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading flexi-time...</div>';
    try {
      const data = await api('/time/flexi-time');
      const balances = data.data || [];

      const rows = balances.map(b => `
        <tr>
          <td>${b.employee_code || ''} - ${b.first_name || ''} ${b.surname || ''}</td>
          <td style="text-align:right">${b.balance_hours != null ? parseFloat(b.balance_hours).toFixed(1) + 'h' : '-'}</td>
          <td style="text-align:right">${b.accrued_hours != null ? parseFloat(b.accrued_hours).toFixed(1) + 'h' : '-'}</td>
          <td style="text-align:right">${b.used_hours != null ? parseFloat(b.used_hours).toFixed(1) + 'h' : '-'}</td>
          <td>${b.last_updated ? new Date(b.last_updated).toLocaleDateString() : '-'}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" onclick="TimeModule.showAdjustFlexi(${b.employee_id}, '${(b.first_name || '')} ${(b.surname || '')}')">Adjust</button>
            </div>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search flexi-time..." data-search></div>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th style="text-align:right">Balance</th><th style="text-align:right">Accrued</th><th style="text-align:right">Used</th><th>Last Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No flexi-time records found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showAdjustFlexi(employeeId, employeeName) {
    const fields = UI.buildForm([
      { type: 'section', label: `Adjust Flexi-Time - ${employeeName}`, icon: icon('clock',16) },
      { id: 'flexi_hours', label: 'Hours Adjustment', type: 'number', required: true, step: 0.5, placeholder: 'e.g. 2 or -1.5' },
      { id: 'flexi_reason', label: 'Reason', type: 'textarea', placeholder: 'Reason for adjustment...', fullWidth: true },
    ]);

    UI.modal({
      title: 'Adjust Flexi-Time',
      size: 'sm',
      content: `<div class="form-grid" id="adjust-flexi-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitFlexiAdjust(${employeeId})">Adjust</button>
      `,
    });
  },

  async submitFlexiAdjust(employeeId) {
    const form = document.getElementById('adjust-flexi-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/time/flexi-time', {
        employee_id: employeeId,
        hours: parseFloat(data.flexi_hours),
        reason: data.flexi_reason,
      });
      UI.closeModal();
      UI.toast('success', 'Adjusted', 'Flexi-time adjusted successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderClaimsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading claims...</div>';
    try {
      const data = await api(`/time/claims?limit=20&page=${this.state.claimsPage}`);

      const rows = data.data.map(c => `
        <tr>
          <td>${c.employee_code} - ${c.first_name} ${c.surname}</td>
          <td><span class="badge badge-info">${c.claim_type}</span></td>
          <td>${c.sub_type || '-'}</td>
          <td>${c.start_date ? c.start_date.split('T')[0] : '-'}</td>
          <td style="text-align:right">${formatCurrency(c.amount)}</td>
          <td style="text-align:right">${c.kilometres ? c.kilometres + ' km' : '-'}</td>
          <td><span class="status-badge status-${(c.status||'').toLowerCase()}">${c.status}</span></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search claims..." data-search></div>
          <button class="btn btn-primary" onclick="TimeModule.showSubmitClaim()">Submit Claim</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Type</th><th>Sub-Type</th><th>Date</th><th style="text-align:right">Amount</th><th style="text-align:right">Kilometres</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No claims submitted</td></tr>'}</tbody>
          </table>
        </div>
        ${data.meta.total > 20 ? UI.pagination({ page: this.state.claimsPage, limit: 20, total: data.meta.total, onPageChange: 'TimeModule.goClaimsPage' }) : ''}
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  goClaimsPage(page) {
    this.state.claimsPage = page;
    this.renderTab();
  },

  showSubmitClaim() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Submit Claim', icon: icon('fileText',16) },
      { id: 'cl_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'cl_claim_type', label: 'Claim Type', type: 'select', required: true, options: [
        { value: 'S_AND_T', label: 'Subsistence & Travel (S&T)' },
        { value: 'TRAVEL', label: 'Travel / Kilometre Claim' },
        { value: 'OTHER', label: 'Other Claim' },
      ]},
      { id: 'cl_start_date', label: 'Claim Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'cl_end_date', label: 'End Date', type: 'date' },
      { id: 'cl_amount', label: 'Amount (R)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '0.00' },
      { id: 'cl_kilometres', label: 'Kilometres', type: 'number', min: 0, step: 0.1, placeholder: 'If travel claim', hint: 'Only for travel/km claims' },
      { id: 'cl_reason', label: 'Reason / Description', type: 'textarea', placeholder: 'Describe the purpose of this claim...', fullWidth: true },
    ]);

    UI.modal({
      title: 'Submit Claim',
      content: `<div class="form-grid" id="submit-claim-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitClaim()">Submit Claim</button>
      `,
    });
  },

  async submitClaim() {
    const form = document.getElementById('submit-claim-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/time/claims', {
        employee_id: parseInt(data.cl_employee_id),
        claim_type: data.cl_claim_type,
        start_date: data.cl_start_date,
        end_date: data.cl_end_date,
        amount: parseFloat(data.cl_amount),
        kilometres: data.cl_kilometres ? parseFloat(data.cl_kilometres) : null,
        reason: data.cl_reason,
      });
      UI.closeModal();
      UI.toast('success', 'Submitted', 'Claim submitted successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderInstalmentsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading instalments...</div>';
    try {
      const data = await api('/time/instalments');

      const rows = data.data.map(i => {
        const progress = i.total_amount > 0 ? (((i.total_amount - (i.balance || 0)) / i.total_amount) * 100).toFixed(0) : 0;
        return `
          <tr>
            <td>${i.employee_code} - ${i.first_name} ${i.surname}</td>
            <td>${i.salary_head_name || '-'}</td>
            <td>${i.description || '-'}</td>
            <td style="text-align:right">${formatCurrency(i.total_amount)}</td>
            <td style="text-align:right">${formatCurrency(i.monthly_instalment)}</td>
            <td style="text-align:right">${formatCurrency(i.balance)}</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="width:60px;height:6px"><div class="progress-fill" style="width:${progress}%;background:#10B981"></div></div>
                <span style="font-size:12px;color:#64748B">${progress}%</span>
              </div>
            </td>
            <td>${i.period_months || '-'} months</td>
            <td><span class="status-badge status-${(i.status||'').toLowerCase()}">${i.status}</span></td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-search"><input type="text" placeholder="Search instalments..." data-search></div>
          <button class="btn btn-primary" onclick="TimeModule.showCreateInstalment()">Create Instalment</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Deduction Type</th><th>Description</th><th style="text-align:right">Total</th><th style="text-align:right">Monthly</th><th style="text-align:right">Balance</th><th>Progress</th><th>Period</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No instalment plans</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showCreateInstalment() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Create Instalment Plan', icon: icon('creditCard',16) },
      { id: 'inst_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'inst_description', label: 'Description', type: 'text', placeholder: 'e.g. Garnishee Order - Court Ref XYZ', required: true },
      { type: 'section', label: 'Financial Details', icon: icon('dollar',16) },
      { id: 'inst_total_amount', label: 'Total Amount (R)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '0.00' },
      { id: 'inst_monthly_instalment', label: 'Monthly Instalment (R)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '0.00' },
      { id: 'inst_period_months', label: 'Period (Months)', type: 'number', required: true, min: 1, max: 120, step: 1, placeholder: 'e.g. 12' },
      { id: 'inst_start_date', label: 'Start Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { type: 'section', label: 'Vendor Details', icon: icon('briefcase',16) },
      { id: 'inst_vendor_name', label: 'Vendor / Creditor Name', type: 'text', placeholder: 'e.g. ABC Finance' },
      { id: 'inst_reference_number', label: 'Reference Number', type: 'text', placeholder: 'e.g. Court order ref' },
    ]);

    UI.modal({
      title: 'Create Instalment Plan',
      size: 'lg',
      content: `<div class="form-grid" id="create-instalment-form">${fields}</div>
        <div style="margin-top:12px;padding:12px;background:#EFF6FF;border-radius:8px;font-size:13px;color:#1E40AF">
          <strong>Note:</strong> Garnishee orders are governed by the Magistrates' Court Act (Section 65J). Monthly deductions cannot exceed 25% of the employee's remuneration.
        </div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitInstalment()">Create Plan</button>
      `,
    });
  },

  async submitInstalment() {
    const form = document.getElementById('create-instalment-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/time/instalments', {
        employee_id: parseInt(data.inst_employee_id),
        salary_head_id: 1,
        description: data.inst_description,
        total_amount: parseFloat(data.inst_total_amount),
        monthly_instalment: parseFloat(data.inst_monthly_instalment),
        period_months: parseInt(data.inst_period_months),
        start_date: data.inst_start_date,
        vendor_name: data.inst_vendor_name,
        reference_number: data.inst_reference_number,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'Instalment plan created successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async showAutoCalculateOT() {
    try {
      const periodsData = await api('/payroll/periods');
      const periods = periodsData.data || [];
      const periodOpts = periods.map(p => ({ value: p.id, label: `${p.period_name || p.name || ''} (${p.start_date ? p.start_date.split('T')[0] : ''} - ${p.end_date ? p.end_date.split('T')[0] : ''})` }));

      const fields = UI.buildForm([
        { type: 'section', label: 'Auto-Calculate Overtime from Attendance', icon: icon('clock',16) },
        { id: 'auto_ot_period_id', label: 'Payroll Period', type: 'select', options: periodOpts, required: true },
      ]);

      UI.modal({
        title: 'Auto-Calculate Overtime',
        size: 'sm',
        content: `<div class="form-grid" id="auto-ot-form">${fields}</div>
          <div style="margin-top:12px;padding:12px;background:#EFF6FF;border-radius:8px;font-size:13px;color:#1E40AF">
            ${icon('alertTriangle',14)} This will scan attendance records for the selected period and automatically create overtime records for hours worked beyond the standard shift.
          </div>
          <div id="auto-ot-results" style="margin-top:12px"></div>`,
        footer: `
          <button class="btn" data-close-modal>Cancel</button>
          <button class="btn btn-primary" onclick="TimeModule.runAutoCalculateOT()">Calculate Overtime from Attendance</button>
        `,
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async runAutoCalculateOT() {
    const form = document.getElementById('auto-ot-form');
    const data = UI.getFormData(form);
    const periodId = data.auto_ot_period_id;
    if (!periodId) {
      UI.toast('error', 'Validation Error', 'Please select a payroll period');
      return;
    }
    const resultsEl = document.getElementById('auto-ot-results');
    if (resultsEl) resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating...</div>';
    try {
      const result = await this.apiPost(`/time/calculate-overtime/${periodId}`, {});
      const count = result.count || result.records_created || 0;
      if (resultsEl) {
        resultsEl.innerHTML = `
          <div style="padding:12px;background:#D1FAE5;border-radius:8px;font-size:14px;color:#065F46">
            ${icon('check',16)} <strong>${count}</strong> overtime record(s) created from attendance data.
          </div>`;
      }
      UI.toast('success', 'Complete', `${count} OT records created`);
    } catch (err) {
      if (resultsEl) resultsEl.innerHTML = `<div style="padding:12px;background:#FEE2E2;border-radius:8px;font-size:13px;color:#991B1B">${err.message}</div>`;
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderGhostDetection(el) {
    el.innerHTML = `
      <div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <label style="font-weight:500;font-size:14px">Months to Check:</label>
          <input type="number" id="ghost-months" class="form-control" value="3" min="1" max="24" style="width:80px">
          <button class="btn btn-primary" onclick="TimeModule.runGhostDetection()">${icon('search',14)} Run Detection</button>
        </div>
      </div>
      <div id="ghost-results">
        <div style="text-align:center;color:var(--text-muted);padding:40px">
          ${icon('alertTriangle',32)}
          <p style="margin-top:8px">Configure months and click "Run Detection" to scan for ghost employees.</p>
        </div>
      </div>
    `;
  },

  async runGhostDetection() {
    const months = document.getElementById('ghost-months')?.value || 3;
    const resultsEl = document.getElementById('ghost-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Running ghost detection...</div>';
    try {
      const data = await api(`/time/ghost-detection?months=${months}`);
      const summary = data.summary || {};
      const flagged = data.flagged_employees || data.data || [];

      const rows = flagged.map(e => `
        <tr>
          <td>${e.employee_code || '-'}</td>
          <td>${e.first_name || '-'}</td>
          <td>${e.surname || '-'}</td>
          <td>${e.position_title || '-'}</td>
          <td>${e.department_name || '-'}</td>
          <td style="text-align:right">${formatCurrency(e.annual_salary || 0)}</td>
        </tr>
      `).join('');

      resultsEl.innerHTML = `
        ${UI.statCards([
          { label: 'Flagged Employees', value: summary.flagged_count || flagged.length, color: '#EF4444' },
          { label: 'Annual Exposure', value: formatCurrency(summary.total_annual_exposure || 0), color: '#F59E0B' },
          { label: 'Months Checked', value: summary.months_checked || months, color: '#3B82F6' },
        ])}
        <div class="data-grid" style="margin-top:16px">
          <table>
            <thead>
              <tr><th>Employee Code</th><th>First Name</th><th>Surname</th><th>Position</th><th>Department</th><th style="text-align:right">Annual Salary</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No ghost employees detected</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showShiftSubstitution() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const shiftOpts = this.state.shifts.map(s => ({ value: s.id, label: `${s.name} (${s.shift_start_time}-${s.shift_end_time})` }));

    const fields = UI.buildForm([
      { type: 'section', label: 'Shift Substitution', icon: icon('users',16) },
      { id: 'sub_original_employee_id', label: 'Original Employee', type: 'select', options: empOpts, required: true },
      { id: 'sub_substitute_employee_id', label: 'Substitute Employee', type: 'select', options: empOpts, required: true },
      { id: 'sub_shift_id', label: 'Shift', type: 'select', options: shiftOpts, required: true },
      { id: 'sub_date', label: 'Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'sub_reason', label: 'Reason', type: 'textarea', placeholder: 'Reason for substitution...', fullWidth: true },
    ]);

    UI.modal({
      title: 'Shift Substitution',
      content: `<div class="form-grid" id="shift-substitution-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="TimeModule.submitShiftSubstitution()">Submit Substitution</button>
      `,
    });
  },

  async submitShiftSubstitution() {
    const form = document.getElementById('shift-substitution-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    if (data.sub_original_employee_id === data.sub_substitute_employee_id) {
      UI.toast('error', 'Validation Error', 'Original and substitute employees must be different');
      return;
    }
    try {
      await this.apiPost('/time/shift-substitution', {
        original_employee_id: parseInt(data.sub_original_employee_id),
        substitute_employee_id: parseInt(data.sub_substitute_employee_id),
        shift_id: parseInt(data.sub_shift_id),
        date: data.sub_date,
        reason: data.sub_reason,
      });
      UI.closeModal();
      UI.toast('success', 'Submitted', 'Shift substitution recorded successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderTimeReports(el) {
    let periodsHtml = '<option value="">Select period...</option>';
    try {
      const periodsData = await api('/payroll/periods');
      const periods = periodsData.data || [];
      periodsHtml += periods.map(p => `<option value="${p.id}">${p.period_name || p.name || ''} (${p.start_date ? p.start_date.split('T')[0] : ''} - ${p.end_date ? p.end_date.split('T')[0] : ''})</option>`).join('');
    } catch (e) {}

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:16px">
          <h4 style="margin:0 0 12px;font-size:14px;display:flex;align-items:center;gap:6px">${icon('check',16)} Attendance Summary</h4>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <input type="date" id="rpt-att-start" class="form-control" value="${thirtyDaysAgo}" style="flex:1">
            <input type="date" id="rpt-att-end" class="form-control" value="${today}" style="flex:1">
          </div>
          <button class="btn btn-primary" onclick="TimeModule.loadAttendanceSummary()" style="width:100%">${icon('barChart',14)} Generate Report</button>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:16px">
          <h4 style="margin:0 0 12px;font-size:14px;display:flex;align-items:center;gap:6px">${icon('clock',16)} Overtime Summary</h4>
          <select id="rpt-ot-period" class="form-control" style="margin-bottom:8px">${periodsHtml}</select>
          <button class="btn btn-primary" onclick="TimeModule.loadOvertimeSummary()" style="width:100%">${icon('barChart',14)} Generate Report</button>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:16px">
          <h4 style="margin:0 0 12px;font-size:14px;display:flex;align-items:center;gap:6px">${icon('settings',16)} Shift Report</h4>
          <button class="btn btn-primary" onclick="TimeModule.loadShiftReport()" style="width:100%">${icon('barChart',14)} Generate Report</button>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:16px">
          <h4 style="margin:0 0 12px;font-size:14px;display:flex;align-items:center;gap:6px">${icon('fileText',16)} Claims Report</h4>
          <button class="btn btn-primary" onclick="TimeModule.loadClaimsReport()" style="width:100%">${icon('barChart',14)} Generate Report</button>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <button class="btn" onclick="TimeModule.showShiftSubstitution()">${icon('users',14)} Shift Substitution</button>
      </div>
      <div id="time-report-results">
        <div style="text-align:center;color:var(--text-muted);padding:40px">
          ${icon('barChart',32)}
          <p style="margin-top:8px">Select a report above to generate.</p>
        </div>
      </div>
    `;
  },

  async loadAttendanceSummary() {
    const startDate = document.getElementById('rpt-att-start')?.value;
    const endDate = document.getElementById('rpt-att-end')?.value;
    const resultsEl = document.getElementById('time-report-results');
    if (!resultsEl) return;
    if (!startDate || !endDate) {
      UI.toast('error', 'Validation Error', 'Please select start and end dates');
      return;
    }
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading attendance summary...</div>';
    try {
      const data = await api(`/time/reports/attendance-summary?start_date=${startDate}&end_date=${endDate}`);
      const records = data.data || data || [];
      const rows = (Array.isArray(records) ? records : []).map(r => `
        <tr>
          <td>${r.employee_code || '-'}</td>
          <td>${r.first_name || ''} ${r.surname || ''}</td>
          <td style="text-align:right">${r.days_present || 0}</td>
          <td style="text-align:right">${r.days_absent || 0}</td>
          <td style="text-align:right">${r.days_late || 0}</td>
          <td style="text-align:right">${r.total_hours ? parseFloat(r.total_hours).toFixed(1) : '0.0'}</td>
        </tr>
      `).join('');

      resultsEl.innerHTML = `
        <h4 style="margin:0 0 12px;font-size:14px">${icon('check',16)} Attendance Summary (${startDate} to ${endDate})</h4>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Code</th><th>Employee</th><th style="text-align:right">Present</th><th style="text-align:right">Absent</th><th style="text-align:right">Late</th><th style="text-align:right">Total Hours</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No data found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadOvertimeSummary() {
    const periodId = document.getElementById('rpt-ot-period')?.value;
    const resultsEl = document.getElementById('time-report-results');
    if (!resultsEl) return;
    if (!periodId) {
      UI.toast('error', 'Validation Error', 'Please select a payroll period');
      return;
    }
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading overtime summary...</div>';
    try {
      const data = await api(`/time/reports/overtime-summary?period_id=${periodId}`);
      const records = data.data || data || [];
      const rows = (Array.isArray(records) ? records : []).map(r => `
        <tr>
          <td>${r.employee_code || '-'}</td>
          <td>${r.first_name || ''} ${r.surname || ''}</td>
          <td style="text-align:right">${r.total_hours ? parseFloat(r.total_hours).toFixed(1) : '0.0'}</td>
          <td style="text-align:right">${formatCurrency(r.total_amount || 0)}</td>
          <td>${r.status || '-'}</td>
        </tr>
      `).join('');

      resultsEl.innerHTML = `
        <h4 style="margin:0 0 12px;font-size:14px">${icon('clock',16)} Overtime Summary</h4>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Code</th><th>Employee</th><th style="text-align:right">Total Hours</th><th style="text-align:right">Total Amount</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No data found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadShiftReport() {
    const resultsEl = document.getElementById('time-report-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading shift report...</div>';
    try {
      const data = await api('/time/reports/shift-report');
      const records = data.data || data || [];
      const rows = (Array.isArray(records) ? records : []).map(r => `
        <tr>
          <td>${r.shift_name || r.name || '-'}</td>
          <td>${r.shift_start_time || r.start_time || '-'}</td>
          <td>${r.shift_end_time || r.end_time || '-'}</td>
          <td style="text-align:right">${r.total_hours || '-'}</td>
          <td style="text-align:right">${r.employee_count || 0}</td>
          <td>${r.is_night_shift ? '<span class="badge badge-warning">Night</span>' : '<span class="badge badge-info">Day</span>'}</td>
        </tr>
      `).join('');

      resultsEl.innerHTML = `
        <h4 style="margin:0 0 12px;font-size:14px">${icon('settings',16)} Shift Report</h4>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Shift Name</th><th>Start</th><th>End</th><th style="text-align:right">Hours</th><th style="text-align:right">Employees</th><th>Type</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No data found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadClaimsReport() {
    const resultsEl = document.getElementById('time-report-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading claims report...</div>';
    try {
      const data = await api('/time/claims/reports');
      const records = data.data || data || [];
      const summary = data.summary || {};

      const summaryHtml = summary.total_claims != null ? UI.statCards([
        { label: 'Total Claims', value: summary.total_claims || 0, color: '#3B82F6' },
        { label: 'Total Amount', value: formatCurrency(summary.total_amount || 0), color: '#10B981' },
        { label: 'Pending', value: summary.pending_count || 0, color: '#F59E0B' },
        { label: 'Approved', value: summary.approved_count || 0, color: '#10B981' },
      ]) : '';

      const rows = (Array.isArray(records) ? records : []).map(r => `
        <tr>
          <td>${r.employee_code || '-'}</td>
          <td>${r.first_name || ''} ${r.surname || ''}</td>
          <td><span class="badge badge-info">${r.claim_type || '-'}</span></td>
          <td>${r.start_date ? r.start_date.split('T')[0] : '-'}</td>
          <td style="text-align:right">${formatCurrency(r.amount || 0)}</td>
          <td><span class="status-badge status-${(r.status || '').toLowerCase()}">${r.status || '-'}</span></td>
        </tr>
      `).join('');

      resultsEl.innerHTML = `
        <h4 style="margin:0 0 12px;font-size:14px">${icon('fileText',16)} Claims Report</h4>
        ${summaryHtml}
        <div class="data-grid" style="margin-top:16px">
          <table>
            <thead>
              <tr><th>Code</th><th>Employee</th><th>Type</th><th>Date</th><th style="text-align:right">Amount</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No data found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },
};

async function renderTimeModule(el) {
  await TimeModule.render(el);
}
