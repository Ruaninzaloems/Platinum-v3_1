const LeaveModule = {
  state: {
    transactions: [],
    leaveTypes: [],
    employees: [],
    balances: [],
    holidays: [],
    filters: { status: '', leave_type_id: '', search: '' },
    pagination: { page: 1, limit: 20, total: 0 },
    activeView: 'transactions',
    selectedEmployee: null,
  },

  async render(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading Leave Management...</div>';
    try {
      const [types, employees] = await Promise.all([
        api('/leave/types'),
        api('/employees?limit=500&sort_by=surname&sort_order=asc'),
      ]);
      this.state.leaveTypes = types.data || [];
      this.state.employees = employees.data || [];
      this.renderShell(el);
      this.bindTabs(el);
      await this.loadTransactions();
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load Leave Management: ${err.message}</div>`;
    }
  },

  renderShell(el) {
    const statusCounts = this.getStatusCounts();
    el.innerHTML = `
      ${UI.statCards([
        { label: 'Total Requests', value: this.state.pagination.total || '...', color: '#4F6AFF' },
        { label: 'Pending', value: statusCounts.PENDING || 0, color: '#F59E0B' },
        { label: 'Approved', value: statusCounts.APPROVED || 0, color: '#10B981' },
        { label: 'Rejected', value: statusCounts.REJECTED || 0, color: '#EF4444' },
      ])}
      ${UI.detailTabs([
        { id: 'transactions', label: 'Leave Transactions', icon: icon('file',14) },
        { id: 'balances', label: 'Leave Balances', icon: icon('calendar',14) },
        { id: 'calendar', label: 'Leave Calendar', icon: icon('calendar',14) },
        { id: 'policies', label: 'Leave Policies', icon: icon('clipboard',14) },
        { id: 'reports', label: 'Leave Reports', icon: icon('barChart2',14) },
        { id: 'types', label: 'Leave Types', icon: icon('settings',14) },
      ], this.state.activeView)}
      <div id="leave-view-content"></div>
    `;
  },

  getStatusCounts() {
    const counts = {};
    this.state.transactions.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  },

  bindTabs(el) {
    el.querySelectorAll('[data-detail-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.activeView = tab.dataset.detailTab;
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderActiveView();
      });
    });
  },

  async renderActiveView() {
    switch (this.state.activeView) {
      case 'transactions': await this.loadTransactions(); break;
      case 'balances': this.renderBalancesView(); break;
      case 'calendar': await this.renderCalendarView(); break;
      case 'policies': await this.renderPolicies(); break;
      case 'reports': await this.renderReports(); break;
      case 'types': this.renderTypesView(); break;
    }
  },

  async loadTransactions() {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    const { status, leave_type_id } = this.state.filters;
    const { page, limit } = this.state.pagination;
    let qs = `?page=${page}&limit=${limit}`;
    if (status) qs += `&status=${status}`;
    if (leave_type_id) qs += `&leave_type_id=${leave_type_id}`;

    try {
      const data = await api(`/leave/transactions${qs}`);
      this.state.transactions = data.data || [];
      this.state.pagination.total = data.meta?.total || 0;
      this.renderTransactionsView(container);
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading transactions: ${err.message}</div>`;
    }
  },

  renderTransactionsView(container) {
    const typeOptions = this.state.leaveTypes.map(t => ({ value: t.id, label: t.name }));
    const statusOptions = [
      { value: '', label: 'All Statuses' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'REJECTED', label: 'Rejected' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ];
    const typeFilterOptions = [{ value: '', label: 'All Leave Types' }, ...typeOptions];

    const rows = this.state.transactions.map(t => `
      <tr class="clickable-row" data-txn-id="${t.id}">
        <td><strong>${t.employee_code}</strong> ${t.first_name} ${t.surname}</td>
        <td><span class="badge badge-info">${t.leave_type_code || ''}</span> ${t.leave_type_name}</td>
        <td>${t.start_date?.split('T')[0] || '-'}</td>
        <td>${t.end_date?.split('T')[0] || '-'}</td>
        <td style="text-align:center;font-weight:600">${t.days}</td>
        <td><span class="status-badge status-${(t.status || '').toLowerCase()}">${t.status}</span></td>
        <td>
          <div class="action-bar">
            ${t.status === 'PENDING' ? `
              <button class="action-btn success" data-approve="${t.id}" title="Approve">Approve</button>
              <button class="action-btn danger" data-reject="${t.id}" title="Reject">Reject</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search">
          <input type="text" placeholder="Search by employee name or code..." data-search id="leave-search">
        </div>
        <div class="toolbar-filter">
          <select id="leave-status-filter" class="toolbar-filter-select">
            ${statusOptions.map(o => `<option value="${o.value}" ${this.state.filters.status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select id="leave-type-filter" class="toolbar-filter-select">
            ${typeFilterOptions.map(o => `<option value="${o.value}" ${this.state.filters.leave_type_id == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="btn-new-leave-request">+ New Leave Request</button>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th style="text-align:center">Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px">No leave transactions found</td></tr>'}
          </tbody>
        </table>
      </div>
      ${this.state.pagination.total > 0 ? UI.pagination({
        page: this.state.pagination.page,
        limit: this.state.pagination.limit,
        total: this.state.pagination.total,
        onPageChange: 'LeaveModule.goToPage'
      }) : ''}
    `;

    this.bindTransactionEvents(container);
  },

  bindTransactionEvents(container) {
    container.querySelector('#leave-status-filter')?.addEventListener('change', (e) => {
      this.state.filters.status = e.target.value;
      this.state.pagination.page = 1;
      this.loadTransactions();
    });

    container.querySelector('#leave-type-filter')?.addEventListener('change', (e) => {
      this.state.filters.leave_type_id = e.target.value;
      this.state.pagination.page = 1;
      this.loadTransactions();
    });

    let searchTimeout;
    container.querySelector('#leave-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.state.filters.search = e.target.value;
        this.filterLocalTransactions();
      }, 300);
    });

    container.querySelector('#btn-new-leave-request')?.addEventListener('click', () => {
      this.showLeaveRequestForm();
    });

    container.querySelectorAll('[data-approve]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.approveLeave(parseInt(btn.dataset.approve));
      });
    });

    container.querySelectorAll('[data-reject]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.rejectLeave(parseInt(btn.dataset.reject));
      });
    });

    container.querySelectorAll('[data-txn-id]').forEach(row => {
      row.addEventListener('click', () => {
        this.showTransactionDetail(parseInt(row.dataset.txnId));
      });
    });
  },

  filterLocalTransactions() {
    const search = this.state.filters.search.toLowerCase();
    const container = document.getElementById('leave-view-content');
    if (!container) return;
    container.querySelectorAll('tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(search) ? '' : 'none';
    });
  },

  goToPage(page) {
    LeaveModule.state.pagination.page = page;
    LeaveModule.loadTransactions();
  },

  showLeaveRequestForm() {
    const empOptions = this.state.employees.map(e => ({
      value: e.id,
      label: `${e.employee_code} - ${e.first_name} ${e.surname}`
    }));
    const typeOptions = this.state.leaveTypes.map(t => ({
      value: t.id,
      label: `${t.name} (${t.code})`
    }));

    const today = new Date().toISOString().split('T')[0];

    const formHtml = `<div class="form-grid" id="leave-request-form">
      ${UI.buildForm([
        { type: 'section', label: 'Employee & Leave Type', icon: icon('user',16) },
        { id: 'lr_employee_id', name: 'employee_id', label: 'Employee', type: 'select', options: empOptions, required: true },
        { id: 'lr_leave_type_id', name: 'leave_type_id', label: 'Leave Type', type: 'select', options: typeOptions, required: true },
        { type: 'section', label: 'Dates & Duration', icon: icon('calendar',16) },
        { id: 'lr_start_date', name: 'start_date', label: 'Start Date', type: 'date', required: true, min: today },
        { id: 'lr_end_date', name: 'end_date', label: 'End Date', type: 'date', required: true, min: today },
        { id: 'lr_days', name: 'days', label: 'Working Days', type: 'number', required: true, min: 0.5, step: 0.5, hint: 'Auto-calculated excluding weekends & public holidays' },
        { id: 'lr_reason', name: 'reason', label: 'Reason', type: 'textarea', fullWidth: true, placeholder: 'Enter reason for leave request...' },
      ])}
      <div class="full-width" id="leave-balance-check" style="display:none"></div>
    </div>`;

    const overlay = UI.modal({
      title: 'New Leave Request',
      content: formHtml,
      size: 'lg',
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-submit-leave">Submit Leave Request</button>
      `
    });

    const startDateEl = overlay.querySelector('#lr_start_date');
    const endDateEl = overlay.querySelector('#lr_end_date');
    const daysEl = overlay.querySelector('#lr_days');
    const empEl = overlay.querySelector('#lr_employee_id');
    const typeEl = overlay.querySelector('#lr_leave_type_id');

    const calcDays = () => {
      const start = startDateEl.value;
      const end = endDateEl.value;
      if (start && end) {
        const days = this.calculateWorkingDays(new Date(start), new Date(end));
        daysEl.value = days;
      }
    };

    startDateEl.addEventListener('change', () => {
      if (startDateEl.value && (!endDateEl.value || endDateEl.value < startDateEl.value)) {
        endDateEl.min = startDateEl.value;
      }
      calcDays();
      this.checkBalance(overlay);
    });

    endDateEl.addEventListener('change', () => {
      calcDays();
      this.checkBalance(overlay);
    });

    empEl.addEventListener('change', () => this.checkBalance(overlay));
    typeEl.addEventListener('change', () => this.checkBalance(overlay));

    overlay.querySelector('#btn-submit-leave')?.addEventListener('click', () => {
      this.submitLeaveRequest(overlay);
    });
  },

  calculateWorkingDays(start, end) {
    if (start > end) return 0;
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  },

  async checkBalance(overlay) {
    const empId = overlay.querySelector('#lr_employee_id')?.value;
    const typeId = overlay.querySelector('#lr_leave_type_id')?.value;
    const days = parseFloat(overlay.querySelector('#lr_days')?.value) || 0;
    const balDiv = overlay.querySelector('#leave-balance-check');
    if (!balDiv) return;

    if (!empId || !typeId) {
      balDiv.style.display = 'none';
      return;
    }

    try {
      const data = await api(`/leave/balances/${empId}`);
      const bal = data.data.find(b => {
        const lt = this.state.leaveTypes.find(t => t.id == typeId);
        return lt && b.code === lt.code;
      });

      if (bal) {
        const available = parseFloat(bal.balance_days) || (parseFloat(bal.accrued_days) - parseFloat(bal.taken_days));
        const insufficient = days > 0 && available < days;
        balDiv.style.display = 'block';
        balDiv.innerHTML = `
          <div style="padding:12px;border-radius:8px;border:1px solid ${insufficient ? '#FCA5A5' : '#A7F3D0'};background:${insufficient ? '#FEF2F2' : '#ECFDF5'};margin-top:8px">
            <div style="font-weight:600;font-size:14px;color:${insufficient ? '#DC2626' : '#059669'};margin-bottom:4px">
              ${insufficient ? 'BCEA Warning: Insufficient Balance' : 'Balance Available'}
            </div>
            <div style="font-size:13px;color:#475569">
              <strong>${bal.leave_type || bal.code}</strong>: 
              Entitlement: ${bal.annual_entitlement || '-'} days | 
              Accrued: ${parseFloat(bal.accrued_days).toFixed(1)} | 
              Taken: ${parseFloat(bal.taken_days).toFixed(1)} | 
              <strong>Available: ${available.toFixed(1)} days</strong>
              ${bal.max_accumulation ? ` | Max Accumulation: ${bal.max_accumulation} days` : ''}
            </div>
            ${insufficient ? `<div style="font-size:12px;color:#DC2626;margin-top:4px">Requested ${days} days exceeds available balance of ${available.toFixed(1)} days. Per BCEA Section 20, leave cannot exceed entitlement.</div>` : ''}
          </div>
        `;
      } else {
        balDiv.style.display = 'block';
        balDiv.innerHTML = `<div style="padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F8F9FB;margin-top:8px;font-size:13px;color:#64748B">No balance record found for this leave type. First-time request will be created.</div>`;
      }
    } catch {
      balDiv.style.display = 'none';
    }
  },

  async submitLeaveRequest(overlay) {
    const form = overlay.querySelector('#leave-request-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }

    const data = UI.getFormData(form);

    const empId = data.employee_id;
    const typeId = data.leave_type_id;
    const days = parseFloat(data.days) || 0;

    try {
      const balData = await api(`/leave/balances/${empId}`);
      const lt = this.state.leaveTypes.find(t => t.id == typeId);
      const bal = balData.data.find(b => lt && b.code === lt.code);
      if (bal) {
        const available = parseFloat(bal.balance_days) || (parseFloat(bal.accrued_days) - parseFloat(bal.taken_days));
        if (days > available && available >= 0) {
          const proceed = await UI.confirm({
            title: 'Insufficient Leave Balance',
            message: `Requested ${days} days exceeds available balance of ${available.toFixed(1)} days. Per BCEA Section 20, this may not be compliant. Submit anyway?`,
            icon: icon('alertTriangle', 28),
            confirmText: 'Submit Anyway',
            cancelText: 'Cancel',
            danger: true
          });
          if (!proceed) return;
        }
      }
    } catch {}

    const submitBtn = overlay.querySelector('#btn-submit-leave');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    try {
      const res = await fetch(`${API_BASE}/leave/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        UI.closeModal();
        UI.toast('success', 'Leave Request Submitted', `Leave request #${result.data.id} created successfully`);
        await this.loadTransactions();
        this.updateStatCards();
      } else {
        UI.toast('error', 'Submission Failed', result.error?.message || 'Unknown error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Leave Request';
        }
      }
    } catch (err) {
      UI.toast('error', 'Error', err.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Leave Request';
      }
    }
  },

  async approveLeave(id) {
    const confirmed = await UI.confirm({
      title: 'Approve Leave Request',
      message: 'Are you sure you want to approve this leave request? The employee\'s leave balance will be updated.',
      icon: icon('alertTriangle', 28),
      confirmText: 'Approve',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/leave/transactions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        UI.toast('success', 'Leave Approved', result.message || 'Leave request approved successfully');
        await this.loadTransactions();
        this.updateStatCards();
      } else {
        UI.toast('error', 'Approval Failed', result.error?.message || 'Unknown error');
      }
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async rejectLeave(id) {
    const formHtml = `<div id="reject-form">
      <div class="form-group">
        <label>Rejection Reason <span class="required">*</span></label>
        <textarea class="form-control" id="reject-reason" name="reason" rows="3" required placeholder="Enter reason for rejecting this leave request..."></textarea>
      </div>
    </div>`;

    const overlay = UI.modal({
      title: 'Reject Leave Request',
      content: formHtml,
      size: 'sm',
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-reject">Reject Leave</button>
      `
    });

    overlay.querySelector('#btn-confirm-reject')?.addEventListener('click', async () => {
      const reason = overlay.querySelector('#reject-reason')?.value?.trim();
      if (!reason) {
        UI.toast('warning', 'Required', 'Please provide a reason for rejection');
        overlay.querySelector('#reject-reason')?.classList.add('error');
        return;
      }

      UI.closeModal();

      try {
        const res = await fetch(`${API_BASE}/leave/transactions/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          UI.toast('success', 'Leave Rejected', result.message || 'Leave request rejected');
          await this.loadTransactions();
          this.updateStatCards();
        } else {
          UI.toast('error', 'Rejection Failed', result.error?.message || 'Unknown error');
        }
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async showTransactionDetail(id) {
    try {
      const result = await api(`/leave/transactions/${id}`);
      const t = result.data;

      const [balData, sickCycleData] = await Promise.all([
        api(`/leave/balances/${t.employee_id}`),
        api(`/leave/sick-cycle/${t.employee_id}`).catch(() => ({ data: null }))
      ]);
      const balRows = (balData.data || []).map(b => `
        <tr>
          <td><span class="badge badge-info">${b.code}</span> ${b.leave_type}</td>
          <td style="text-align:center">${parseFloat(b.annual_entitlement || 0)}</td>
          <td style="text-align:center">${parseFloat(b.accrued_days || 0).toFixed(1)}</td>
          <td style="text-align:center">${parseFloat(b.taken_days || 0).toFixed(1)}</td>
          <td style="text-align:center;font-weight:700;color:${parseFloat(b.balance_days || 0) < 0 ? '#EF4444' : '#10B981'}">${parseFloat(b.balance_days || (parseFloat(b.accrued_days) - parseFloat(b.taken_days)) || 0).toFixed(1)}</td>
        </tr>
      `).join('');

      const sickCycle = sickCycleData?.data;
      let sickCycleHtml = '';
      if (sickCycle) {
        sickCycleHtml = `
          <h4 style="margin:20px 0 12px;font-size:15px;font-weight:600">${icon('activity',16)} Sick Leave Cycle</h4>
          ${UI.statCards([
            { label: 'Cycle Start', value: sickCycle.cycle_start ? new Date(sickCycle.cycle_start).toLocaleDateString('en-ZA') : '-', color: '#3B82F6' },
            { label: 'Cycle End', value: sickCycle.cycle_end ? new Date(sickCycle.cycle_end).toLocaleDateString('en-ZA') : '-', color: '#3B82F6' },
            { label: 'Total Entitlement', value: `${sickCycle.total_entitlement || 0} days`, color: '#10B981' },
            { label: 'Used', value: `${sickCycle.used || 0} days`, color: '#F59E0B' },
            { label: 'Remaining', value: `${sickCycle.remaining || 0} days`, color: parseFloat(sickCycle.remaining || 0) <= 0 ? '#EF4444' : '#10B981' },
          ])}
        `;
      }

      const content = `
        <div class="info-grid" style="margin-bottom:20px">
          <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${t.employee_code} - ${t.first_name} ${t.surname}</div></div>
          <div class="info-item"><div class="info-label">Leave Type</div><div class="info-value">${t.leave_type_name}</div></div>
          <div class="info-item"><div class="info-label">Start Date</div><div class="info-value">${t.start_date?.split('T')[0] || '-'}</div></div>
          <div class="info-item"><div class="info-label">End Date</div><div class="info-value">${t.end_date?.split('T')[0] || '-'}</div></div>
          <div class="info-item"><div class="info-label">Days</div><div class="info-value">${t.days}</div></div>
          <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(t.status || '').toLowerCase()}">${t.status}</span></div></div>
          <div class="info-item"><div class="info-label">Reason</div><div class="info-value">${t.reason || '-'}</div></div>
          <div class="info-item"><div class="info-label">Created</div><div class="info-value">${t.created_at ? new Date(t.created_at).toLocaleDateString('en-ZA') : '-'}</div></div>
        </div>
        ${sickCycleHtml}
        <h4 style="margin-bottom:12px;font-size:15px;font-weight:600">Employee Leave Balances</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Leave Type</th><th style="text-align:center">Entitlement</th><th style="text-align:center">Accrued</th><th style="text-align:center">Taken</th><th style="text-align:center">Balance</th></tr></thead>
            <tbody>${balRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No balance data</td></tr>'}</tbody>
          </table>
        </div>
      `;

      let footerHtml = '<button class="btn" data-close-modal>Close</button>';
      if (t.status === 'PENDING') {
        footerHtml = `
          <button class="btn" data-close-modal>Close</button>
          <button class="btn btn-danger" id="btn-detail-reject">Reject</button>
          <button class="btn btn-primary" id="btn-detail-approve">Approve</button>
        `;
      }

      const overlay = UI.modal({
        title: `Leave Request #${t.id}`,
        content,
        size: 'lg',
        footer: footerHtml
      });

      overlay.querySelector('#btn-detail-approve')?.addEventListener('click', () => {
        UI.closeModal();
        this.approveLeave(id);
      });

      overlay.querySelector('#btn-detail-reject')?.addEventListener('click', () => {
        UI.closeModal();
        this.rejectLeave(id);
      });
    } catch (err) {
      UI.toast('error', 'Error', `Failed to load leave detail: ${err.message}`);
    }
  },

  renderBalancesView() {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    const empOptions = this.state.employees.map(e =>
      `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`
    ).join('');

    container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search" style="max-width:400px">
          <select id="balance-employee-select" class="form-control" style="width:100%">
            <option value="">-- Select Employee --</option>
            ${empOptions}
          </select>
        </div>
      </div>
      <div id="balance-results">
        ${UI.emptyState(icon('user',32), 'Select an Employee', 'Choose an employee from the dropdown to view their leave balances')}
      </div>
    `;

    container.querySelector('#balance-employee-select')?.addEventListener('change', async (e) => {
      const empId = e.target.value;
      if (!empId) {
        document.getElementById('balance-results').innerHTML = UI.emptyState(icon('user',32), 'Select an Employee', 'Choose an employee from the dropdown to view their leave balances');
        return;
      }
      await this.loadEmployeeBalances(empId);
    });
  },

  async loadEmployeeBalances(empId) {
    const resultsDiv = document.getElementById('balance-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Loading balances...</div>';

    try {
      const data = await api(`/leave/balances/${empId}`);
      const emp = this.state.employees.find(e => e.id == empId);
      const balances = data.data || [];

      const cards = balances.map(b => {
        const available = parseFloat(b.balance_days) || (parseFloat(b.accrued_days || 0) - parseFloat(b.taken_days || 0));
        const entitlement = parseFloat(b.annual_entitlement || 0);
        const pct = entitlement > 0 ? Math.min(((parseFloat(b.taken_days || 0)) / entitlement) * 100, 100) : 0;
        const maxAcc = b.max_accumulation ? parseFloat(b.max_accumulation) : null;
        const overMax = maxAcc && available > maxAcc;

        return `
          <div class="leave-balance-card" style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <div>
                <div style="font-weight:600;font-size:14px;color:#1E293B">${b.leave_type}</div>
                <div style="font-size:12px;color:#94A3B8">${b.code}</div>
              </div>
              <div style="font-size:24px;font-weight:700;color:${available < 0 ? '#EF4444' : '#10B981'}">${available.toFixed(1)}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
              <div style="text-align:center;padding:6px;background:#F8F9FB;border-radius:6px">
                <div style="font-size:11px;color:#94A3B8;text-transform:uppercase">Entitlement</div>
                <div style="font-size:16px;font-weight:600;color:#1E293B">${entitlement}</div>
              </div>
              <div style="text-align:center;padding:6px;background:#F8F9FB;border-radius:6px">
                <div style="font-size:11px;color:#94A3B8;text-transform:uppercase">Accrued</div>
                <div style="font-size:16px;font-weight:600;color:#1E293B">${parseFloat(b.accrued_days || 0).toFixed(1)}</div>
              </div>
              <div style="text-align:center;padding:6px;background:#F8F9FB;border-radius:6px">
                <div style="font-size:11px;color:#94A3B8;text-transform:uppercase">Taken</div>
                <div style="font-size:16px;font-weight:600;color:#EF4444">${parseFloat(b.taken_days || 0).toFixed(1)}</div>
              </div>
            </div>
            <div style="background:#E2E8F0;border-radius:4px;height:6px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${pct > 80 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981'};border-radius:4px;transition:width 0.3s"></div>
            </div>
            <div style="font-size:11px;color:#94A3B8;margin-top:4px">${pct.toFixed(0)}% utilized${maxAcc ? ` | Max accumulation: ${maxAcc} days` : ''}${overMax ? ' Exceeds max' : ''}</div>
          </div>
        `;
      }).join('');

      this.state.selectedEmployee = empId;
      this.state.balances = balances;

      resultsDiv.innerHTML = `
        ${emp ? `<div style="margin-bottom:16px;padding:12px 16px;background:#F8F9FB;border-radius:8px;font-size:14px;display:flex;justify-content:space-between;align-items:center"><span><strong>${emp.employee_code}</strong> - ${emp.title || ''} ${emp.first_name} ${emp.surname} | ${emp.department_name || 'No Department'} | ${emp.position_title || 'No Position'}</span><div style="display:flex;gap:8px"><button class="btn btn-primary" id="btn-encash-leave">${icon('dollarSign',14)} Encash Leave</button><button class="btn btn-secondary" id="btn-carry-over">${icon('refreshCw',14)} Carry Over</button></div></div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
          ${cards || '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px">No leave balances found</div>'}
        </div>
      `;

      resultsDiv.querySelector('#btn-encash-leave')?.addEventListener('click', () => {
        this.showEncashLeaveModal(empId, balances);
      });
      resultsDiv.querySelector('#btn-carry-over')?.addEventListener('click', () => {
        this.showCarryOverModal(empId, balances);
      });
    } catch (err) {
      resultsDiv.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading balances: ${err.message}</div>`;
    }
  },

  showEncashLeaveModal(empId, balances) {
    const emp = this.state.employees.find(e => e.id == empId);
    const typeOptions = balances
      .filter(b => parseFloat(b.balance_days || 0) > 0)
      .map(b => {
        const lt = this.state.leaveTypes.find(t => t.code === b.code);
        return `<option value="${lt ? lt.id : ''}" data-balance="${parseFloat(b.balance_days || 0).toFixed(1)}">${b.leave_type} (${b.code}) - Balance: ${parseFloat(b.balance_days || 0).toFixed(1)} days</option>`;
      }).join('');

    const formHtml = `<div id="encash-form">
      <div class="form-group">
        <label>Employee</label>
        <input type="text" class="form-control" value="${emp ? emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname : ''}" disabled>
      </div>
      <div class="form-group">
        <label>Leave Type <span class="required">*</span></label>
        <select class="form-control" id="encash-leave-type" required>
          <option value="">-- Select Leave Type --</option>
          ${typeOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Days to Encash <span class="required">*</span></label>
        <input type="number" class="form-control" id="encash-days" min="0.5" step="0.5" required placeholder="Enter number of days">
      </div>
      <div id="encash-preview" style="display:none;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F8F9FB;margin-top:8px">
      </div>
    </div>`;

    const overlay = UI.modal({
      title: 'Encash Leave',
      content: formHtml,
      size: 'md',
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-submit-encash">Submit Encashment</button>
      `
    });

    const typeSelect = overlay.querySelector('#encash-leave-type');
    const daysInput = overlay.querySelector('#encash-days');
    const previewDiv = overlay.querySelector('#encash-preview');

    const updatePreview = () => {
      const selectedOption = typeSelect.selectedOptions[0];
      const maxBalance = selectedOption ? parseFloat(selectedOption.dataset.balance || 0) : 0;
      const days = parseFloat(daysInput.value) || 0;
      if (days > 0 && maxBalance > 0) {
        const valid = days <= maxBalance;
        previewDiv.style.display = 'block';
        previewDiv.style.borderColor = valid ? '#A7F3D0' : '#FCA5A5';
        previewDiv.style.background = valid ? '#ECFDF5' : '#FEF2F2';
        previewDiv.innerHTML = `
          <div style="font-size:13px;color:${valid ? '#059669' : '#DC2626'}">
            <strong>${days} days</strong> of ${maxBalance.toFixed(1)} available will be encashed.
            ${!valid ? '<br>Days exceed available balance.' : ''}
          </div>
        `;
      } else {
        previewDiv.style.display = 'none';
      }
    };

    typeSelect.addEventListener('change', updatePreview);
    daysInput.addEventListener('input', updatePreview);

    overlay.querySelector('#btn-submit-encash')?.addEventListener('click', async () => {
      const leave_type_id = typeSelect.value;
      const days = parseFloat(daysInput.value);

      if (!leave_type_id) {
        UI.toast('warning', 'Required', 'Please select a leave type');
        return;
      }
      if (!days || days <= 0) {
        UI.toast('warning', 'Required', 'Please enter the number of days to encash');
        return;
      }

      const selectedOption = typeSelect.selectedOptions[0];
      const maxBalance = parseFloat(selectedOption?.dataset.balance || 0);
      if (days > maxBalance) {
        UI.toast('error', 'Invalid', 'Days exceed available balance');
        return;
      }

      const submitBtn = overlay.querySelector('#btn-submit-encash');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing...'; }

      try {
        const result = await apiPost('/leave/encash', { employee_id: parseInt(empId), leave_type_id: parseInt(leave_type_id), days });
        UI.closeModal();
        if (result.data) {
          UI.toast('success', 'Leave Encashed', result.message || `${days} days encashed successfully. Amount: ${formatCurrency(result.data.encashment_amount)}`);
        } else {
          UI.toast('success', 'Leave Encashed', result.message || `${days} days encashed successfully`);
        }
        await this.loadEmployeeBalances(empId);
      } catch (err) {
        UI.toast('error', 'Encashment Failed', err.message || 'Failed to process encashment');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Encashment'; }
      }
    });
  },

  showCarryOverModal(empId, balances) {
    const emp = this.state.employees.find(e => e.id == empId);
    const typeOptions = balances
      .filter(b => parseFloat(b.balance_days || 0) > 0)
      .map(b => {
        const lt = this.state.leaveTypes.find(t => t.code === b.code);
        return `<option value="${lt ? lt.id : ''}" data-balance="${parseFloat(b.balance_days || 0).toFixed(1)}" data-max="${b.max_accumulation || ''}">${b.leave_type} (${b.code}) - Balance: ${parseFloat(b.balance_days || 0).toFixed(1)} days</option>`;
      }).join('');

    const formHtml = `<div id="carryover-form">
      <div class="form-group">
        <label>Employee</label>
        <input type="text" class="form-control" value="${emp ? emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname : ''}" disabled>
      </div>
      <div class="form-group">
        <label>Leave Type <span class="required">*</span></label>
        <select class="form-control" id="carryover-leave-type" required>
          <option value="">-- Select Leave Type --</option>
          ${typeOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Days to Carry Over <span class="required">*</span></label>
        <input type="number" class="form-control" id="carryover-days" min="0.5" step="0.5" required placeholder="Enter number of days">
      </div>
      <div id="carryover-info" style="display:none;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F8F9FB;margin-top:8px">
      </div>
    </div>`;

    const overlay = UI.modal({
      title: 'Carry Over Leave',
      content: formHtml,
      size: 'md',
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-submit-carryover">Submit Carry Over</button>
      `
    });

    const typeSelect = overlay.querySelector('#carryover-leave-type');
    const daysInput = overlay.querySelector('#carryover-days');
    const infoDiv = overlay.querySelector('#carryover-info');

    const updateInfo = () => {
      const selectedOption = typeSelect.selectedOptions[0];
      const maxBalance = selectedOption ? parseFloat(selectedOption.dataset.balance || 0) : 0;
      const maxAcc = selectedOption ? selectedOption.dataset.max : '';
      const days = parseFloat(daysInput.value) || 0;
      if (days > 0) {
        const valid = days <= maxBalance;
        infoDiv.style.display = 'block';
        infoDiv.style.borderColor = valid ? '#A7F3D0' : '#FCA5A5';
        infoDiv.style.background = valid ? '#ECFDF5' : '#FEF2F2';
        infoDiv.innerHTML = `
          <div style="font-size:13px;color:${valid ? '#059669' : '#DC2626'}">
            <strong>${days} days</strong> will be carried over to the next cycle.
            ${maxAcc ? `<br>Max accumulation: ${maxAcc} days` : ''}
            ${!valid ? '<br>Days exceed available balance.' : ''}
          </div>
        `;
      } else {
        infoDiv.style.display = 'none';
      }
    };

    typeSelect.addEventListener('change', updateInfo);
    daysInput.addEventListener('input', updateInfo);

    overlay.querySelector('#btn-submit-carryover')?.addEventListener('click', async () => {
      const leave_type_id = typeSelect.value;
      const days = parseFloat(daysInput.value);

      if (!leave_type_id) {
        UI.toast('warning', 'Required', 'Please select a leave type');
        return;
      }
      if (!days || days <= 0) {
        UI.toast('warning', 'Required', 'Please enter the number of days to carry over');
        return;
      }

      const selectedOption = typeSelect.selectedOptions[0];
      const maxBalance = parseFloat(selectedOption?.dataset.balance || 0);
      if (days > maxBalance) {
        UI.toast('error', 'Invalid', 'Days exceed available balance');
        return;
      }

      const submitBtn = overlay.querySelector('#btn-submit-carryover');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing...'; }

      try {
        const result = await apiPost('/leave/carry-over', { employee_id: parseInt(empId), leave_type_id: parseInt(leave_type_id), days });
        UI.closeModal();
        UI.toast('success', 'Carry Over Complete', result.message || `${days} days carried over successfully`);
        await this.loadEmployeeBalances(empId);
      } catch (err) {
        UI.toast('error', 'Carry Over Failed', err.message || 'Failed to process carry over');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Carry Over'; }
      }
    });
  },

  async renderCalendarView(year, month) {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    const now = new Date();
    const selYear = year || now.getFullYear();
    const selMonth = month !== undefined ? month : now.getMonth() + 1;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();

    const yearOptions = [];
    for (let y = selYear - 2; y <= selYear + 2; y++) {
      yearOptions.push(`<option value="${y}" ${y === selYear ? 'selected' : ''}>${y}</option>`);
    }
    const monthOptions = monthNames.map((m, i) =>
      `<option value="${i + 1}" ${(i + 1) === selMonth ? 'selected' : ''}>${m}</option>`
    ).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="action-btn" id="cal-prev-month" title="Previous Month">${icon('chevronLeft',16)}</button>
          <select id="cal-month-select" class="form-control" style="width:140px">${monthOptions}</select>
          <select id="cal-year-select" class="form-control" style="width:100px">${yearOptions.join('')}</select>
          <button class="action-btn" id="cal-next-month" title="Next Month">${icon('chevronRight',16)}</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge badge-info" style="background:#DBEAFE;color:#1D4ED8">Annual</span>
          <span class="badge badge-warning" style="background:#FEF3C7;color:#92400E">Sick</span>
          <span class="badge badge-success" style="background:#D1FAE5;color:#065F46">Family</span>
          <span class="badge" style="background:#EDE9FE;color:#5B21B6">Maternity</span>
          <span class="badge" style="background:#FEF3C7;color:#92400E">Holiday</span>
        </div>
      </div>
      <div id="cal-grid-container"><div class="loading"><div class="spinner"></div>Loading calendar...</div></div>
    `;

    const navMonth = (delta) => {
      let nm = selMonth + delta;
      let ny = selYear;
      if (nm < 1) { nm = 12; ny--; }
      if (nm > 12) { nm = 1; ny++; }
      this.renderCalendarView(ny, nm);
    };

    container.querySelector('#cal-prev-month')?.addEventListener('click', () => navMonth(-1));
    container.querySelector('#cal-next-month')?.addEventListener('click', () => navMonth(1));
    container.querySelector('#cal-month-select')?.addEventListener('change', (e) => {
      this.renderCalendarView(selYear, parseInt(e.target.value));
    });
    container.querySelector('#cal-year-select')?.addEventListener('change', (e) => {
      this.renderCalendarView(parseInt(e.target.value), selMonth);
    });

    const gridContainer = container.querySelector('#cal-grid-container');

    try {
      let calData;
      try {
        calData = await api(`/leave/calendar/${selYear}/${selMonth}`);
      } catch {
        const [txnData, holidayData] = await Promise.all([
          api(`/leave/transactions?limit=500&status=APPROVED`),
          api('/leave/holidays').catch(() => ({ data: [] }))
        ]);
        calData = { data: { employees: [], holidays: holidayData.data || [] } };
        const transactions = txnData.data || [];
        const empMap = {};
        transactions.forEach(t => {
          const start = new Date(t.start_date);
          const end = new Date(t.end_date);
          if (start.getMonth() + 1 !== selMonth && end.getMonth() + 1 !== selMonth) return;
          const key = t.employee_id || `${t.first_name}_${t.surname}`;
          if (!empMap[key]) {
            empMap[key] = { employee_id: t.employee_id, employee_code: t.employee_code, first_name: t.first_name, surname: t.surname, leaves: [] };
          }
          empMap[key].leaves.push(t);
        });
        calData.data.employees = Object.values(empMap);
      }

      const employees = calData.data?.employees || [];
      const holidays = calData.data?.holidays || [];

      const holidaysByDay = {};
      holidays.forEach(h => {
        const d = new Date(h.holiday_date || h.date);
        if (d.getMonth() + 1 === selMonth && d.getFullYear() === selYear) {
          holidaysByDay[d.getDate()] = h.name || h.holiday_name;
        }
      });

      const leaveColorMap = { 'AL': '#3B82F6', 'SL': '#F59E0B', 'FL': '#10B981', 'ML': '#8B5CF6', 'PL': '#EC4899', 'SDL': '#06B6D4', 'UPL': '#6B7280', 'CL': '#14B8A6' };

      let dayHeaders = '<th style="min-width:160px;position:sticky;left:0;background:#F8F9FB;z-index:2">Employee</th>';
      for (let d = 1; d <= daysInMonth; d++) {
        const dow = new Date(selYear, selMonth - 1, d).getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isHoliday = holidaysByDay[d];
        let bgStyle = '';
        if (isHoliday) bgStyle = 'background:#FEF3C7;';
        else if (isWeekend) bgStyle = 'background:#F3F4F6;';
        dayHeaders += `<th style="text-align:center;min-width:32px;font-size:11px;${bgStyle}" title="${isHoliday || ''}">${d}</th>`;
      }

      let bodyRows = '';
      if (employees.length === 0) {
        bodyRows = `<tr><td colspan="${daysInMonth + 1}" style="text-align:center;color:var(--text-muted);padding:40px">No leave data for this period</td></tr>`;
      } else {
        employees.forEach(emp => {
          const leaveDays = {};
          (emp.leaves || []).forEach(l => {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date);
            const cur = new Date(start);
            while (cur <= end) {
              if (cur.getMonth() + 1 === selMonth && cur.getFullYear() === selYear) {
                leaveDays[cur.getDate()] = { code: l.leave_type_code || 'AL', name: l.leave_type_name || 'Leave' };
              }
              cur.setDate(cur.getDate() + 1);
            }
          });

          let cells = `<td style="position:sticky;left:0;background:#fff;z-index:1;font-size:13px"><strong>${emp.employee_code || ''}</strong> ${emp.first_name || ''} ${emp.surname || ''}</td>`;
          for (let d = 1; d <= daysInMonth; d++) {
            const dow = new Date(selYear, selMonth - 1, d).getDay();
            const isWeekend = dow === 0 || dow === 6;
            const isHoliday = holidaysByDay[d];
            const leave = leaveDays[d];
            let cellStyle = 'text-align:center;font-size:10px;';
            let cellContent = '';
            if (leave) {
              const color = leaveColorMap[leave.code] || '#4F6AFF';
              cellStyle += `background:${color}20;color:${color};font-weight:600;`;
              cellContent = leave.code;
            } else if (isHoliday) {
              cellStyle += 'background:#FEF3C7;';
            } else if (isWeekend) {
              cellStyle += 'background:#F3F4F6;';
            }
            cells += `<td style="${cellStyle}" title="${leave ? leave.name : (isHoliday || '')}">${cellContent}</td>`;
          }
          bodyRows += `<tr>${cells}</tr>`;
        });
      }

      gridContainer.innerHTML = `
        <div class="data-grid" style="overflow-x:auto">
          <table style="font-size:12px">
            <thead><tr>${dayHeaders}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      gridContainer.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading calendar: ${err.message}</div>`;
    }
  },

  getLeaveColor(code) {
    const colors = {
      'AL': '#3B82F6', 'SL': '#EF4444', 'FL': '#8B5CF6',
      'ML': '#EC4899', 'PL': '#F59E0B', 'SDL': '#06B6D4',
      'UPL': '#6B7280', 'CL': '#10B981',
    };
    return colors[code] || '#4F6AFF';
  },

  async renderPolicies() {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading leave policies...</div>';

    try {
      let policies = [];
      try {
        const data = await api('/leave/policies');
        policies = data.data || [];
      } catch {
        policies = this.state.leaveTypes.map(t => ({
          id: t.id,
          leave_type_name: t.name,
          accrual_method: t.accrual_frequency || 'Monthly',
          accrual_amount: t.accrual_days || 0,
          max_balance: t.max_accumulation || 0,
          carry_over_limit: t.carry_over_limit || 0,
          cycle_months: t.cycle_months || 12,
          cycle_entitlement: t.accrual_days || 0
        }));
      }

      const rows = policies.map(p => `
        <tr>
          <td><strong>${p.leave_type_name || '-'}</strong></td>
          <td>${p.accrual_method || '-'}</td>
          <td style="text-align:center">${p.accrual_amount || '-'}</td>
          <td style="text-align:center">${p.max_balance || '-'}</td>
          <td style="text-align:center">${p.carry_over_limit || '-'}</td>
          <td style="text-align:center">${p.cycle_months || '-'}</td>
          <td style="text-align:center">${p.cycle_entitlement || '-'}</td>
          <td>
            <button class="action-btn" data-edit-policy="${p.id}" title="Edit Policy">${icon('edit',14)}</button>
          </td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div style="margin-bottom:16px">
          <h3 style="font-size:16px;font-weight:600;color:#1E293B;margin:0 0 4px">Leave Policies</h3>
          <p style="font-size:13px;color:#64748B;margin:0">Manage accrual methods, balances and carry-over rules per leave type</p>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Accrual Method</th>
                <th style="text-align:center">Accrual Amount</th>
                <th style="text-align:center">Max Balance</th>
                <th style="text-align:center">Carry Over Limit</th>
                <th style="text-align:center">Cycle (Months)</th>
                <th style="text-align:center">Cycle Entitlement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">No leave policies configured</td></tr>'}</tbody>
          </table>
        </div>
      `;

      container.querySelectorAll('[data-edit-policy]').forEach(btn => {
        btn.addEventListener('click', () => {
          const policyId = btn.dataset.editPolicy;
          const policy = policies.find(p => p.id == policyId);
          if (policy) this.showEditPolicyModal(policy);
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading policies: ${err.message}</div>`;
    }
  },

  showEditPolicyModal(policy) {
    const formHtml = `<div class="form-grid" id="policy-edit-form">
      ${UI.buildForm([
        { type: 'section', label: 'Policy Settings', icon: icon('settings',16) },
        { id: 'pe_accrual_method', name: 'accrual_method', label: 'Accrual Method', type: 'select', options: [
          { value: 'Monthly', label: 'Monthly' },
          { value: 'Annual', label: 'Annual' },
          { value: 'Daily', label: 'Daily' },
          { value: 'None', label: 'None' }
        ], value: policy.accrual_method || 'Monthly' },
        { id: 'pe_accrual_amount', name: 'accrual_amount', label: 'Accrual Amount (Days)', type: 'number', value: policy.accrual_amount || 0, min: 0, step: 0.5 },
        { id: 'pe_max_balance', name: 'max_balance', label: 'Max Balance (Days)', type: 'number', value: policy.max_balance || 0, min: 0, step: 0.5 },
        { id: 'pe_carry_over_limit', name: 'carry_over_limit', label: 'Carry Over Limit (Days)', type: 'number', value: policy.carry_over_limit || 0, min: 0, step: 0.5 },
        { id: 'pe_forfeiture_months', name: 'forfeiture_months', label: 'Forfeiture After (Months)', type: 'number', value: policy.forfeiture_months || 0, min: 0, step: 1, hint: 'Months after which unused leave is forfeited (0 = no forfeiture)' },
        { id: 'pe_cycle_months', name: 'cycle_months', label: 'Cycle (Months)', type: 'number', value: policy.cycle_months || 12, min: 1, max: 60 },
        { id: 'pe_min_service_months', name: 'min_service_months', label: 'Min Service (Months)', type: 'number', value: policy.min_service_months || 0, min: 0, step: 1, hint: 'Minimum months of service before leave can be taken' },
        { id: 'pe_requires_medical_cert_after_days', name: 'requires_medical_cert_after_days', label: 'Medical Cert After (Days)', type: 'number', value: policy.requires_medical_cert_after_days || 0, min: 0, step: 1, hint: 'Days of sick leave after which a medical certificate is required' },
        { type: 'section', label: 'Exclusions & Restrictions', icon: icon('settings',16) },
        { id: 'pe_exclude_holidays', name: 'exclude_holidays', label: 'Exclude Public Holidays', type: 'checkbox', value: policy.exclude_holidays || false, checkLabel: 'Do not count public holidays as leave days' },
        { id: 'pe_exclude_weekends', name: 'exclude_weekends', label: 'Exclude Weekends', type: 'checkbox', value: policy.exclude_weekends || false, checkLabel: 'Do not count weekends as leave days' },
        { id: 'pe_gender_restriction', name: 'gender_restriction', label: 'Gender Restriction', type: 'select', options: [
          { value: '', label: 'None (All Genders)' },
          { value: 'MALE', label: 'Male Only' },
          { value: 'FEMALE', label: 'Female Only' },
        ], value: policy.gender_restriction || '' },
        { id: 'pe_cycle_entitlement', name: 'cycle_entitlement', label: 'Cycle Entitlement (Days)', type: 'number', value: policy.cycle_entitlement || 0, min: 0, step: 0.5 },
      ])}
    </div>`;

    const overlay = UI.modal({
      title: `Edit Policy: ${policy.leave_type_name}`,
      content: formHtml,
      size: 'md',
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-save-policy">Save Policy</button>
      `
    });

    overlay.querySelector('#btn-save-policy')?.addEventListener('click', async () => {
      const form = overlay.querySelector('#policy-edit-form');
      const formData = UI.getFormData(form);
      const saveBtn = overlay.querySelector('#btn-save-policy');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

      try {
        const res = await fetch(`${API_BASE}/leave/policies/${policy.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await res.json();
        if (res.ok && (result.success !== false)) {
          UI.closeModal();
          UI.toast('success', 'Policy Updated', `Leave policy for ${policy.leave_type_name} updated successfully`);
          await this.renderPolicies();
        } else {
          UI.toast('error', 'Update Failed', result.error?.message || result.message || 'Failed to update policy');
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Policy'; }
        }
      } catch (err) {
        UI.toast('error', 'Error', err.message);
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Policy'; }
      }
    });
  },

  async renderReports() {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    const currentYear = new Date().getFullYear();

    container.innerHTML = `
      <div style="margin-bottom:20px">
        <h3 style="font-size:16px;font-weight:600;color:#1E293B;margin:0 0 4px">Leave Reports</h3>
        <p style="font-size:13px;color:#64748B;margin:0">Generate and view leave reports across the organisation</p>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-bottom:24px">
        <div class="leave-balance-card" style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:20px;cursor:pointer" id="rpt-balance">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="width:40px;height:40px;border-radius:8px;background:#DBEAFE;display:flex;align-items:center;justify-content:center;color:#1D4ED8">${icon('users',20)}</div>
            <div>
              <div style="font-weight:600;font-size:15px;color:#1E293B">Balance Report</div>
              <div style="font-size:12px;color:#64748B">Employee leave balances by type</div>
            </div>
          </div>
        </div>
        <div class="leave-balance-card" style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:20px;cursor:pointer" id="rpt-utilisation">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="width:40px;height:40px;border-radius:8px;background:#D1FAE5;display:flex;align-items:center;justify-content:center;color:#065F46">${icon('barChart2',20)}</div>
            <div>
              <div style="font-weight:600;font-size:15px;color:#1E293B">Utilisation Report</div>
              <div style="font-size:12px;color:#64748B">Leave usage by type and status</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <select id="rpt-util-year" class="form-control" style="width:120px">
              ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="leave-balance-card" style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:20px;cursor:pointer" id="rpt-liability">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="width:40px;height:40px;border-radius:8px;background:#FEF3C7;display:flex;align-items:center;justify-content:center;color:#92400E">${icon('dollarSign',20)}</div>
            <div>
              <div style="font-weight:600;font-size:15px;color:#1E293B">Leave Liability</div>
              <div style="font-size:12px;color:#64748B">Calculate total leave liability amount</div>
            </div>
          </div>
        </div>
      </div>
      <div id="report-results"></div>
    `;

    container.querySelector('#rpt-balance')?.addEventListener('click', () => this.loadBalanceReport());
    container.querySelector('#rpt-utilisation')?.addEventListener('click', () => {
      const year = container.querySelector('#rpt-util-year')?.value || currentYear;
      this.loadUtilisationReport(year);
    });
    container.querySelector('#rpt-liability')?.addEventListener('click', () => this.loadLeaveLiability());
  },

  async loadBalanceReport() {
    const resultsDiv = document.getElementById('report-results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Loading balance report...</div>';

    try {
      let balances = [];
      try {
        const data = await api('/leave/reports/balance');
        balances = data.data || [];
      } catch {
        const empBalances = [];
        for (const emp of this.state.employees.slice(0, 50)) {
          try {
            const bData = await api(`/leave/balances/${emp.id}`);
            (bData.data || []).forEach(b => {
              empBalances.push({
                employee_code: emp.employee_code,
                first_name: emp.first_name,
                surname: emp.surname,
                leave_type: b.leave_type || b.code,
                balance: parseFloat(b.balance_days || 0).toFixed(1)
              });
            });
          } catch {}
        }
        balances = empBalances;
      }

      const rows = balances.map(b => `
        <tr>
          <td><strong>${b.employee_code || ''}</strong> ${b.first_name || ''} ${b.surname || ''}</td>
          <td>${b.leave_type || '-'}</td>
          <td style="text-align:center;font-weight:600;color:${parseFloat(b.balance) < 0 ? '#EF4444' : '#10B981'}">${b.balance}</td>
        </tr>
      `).join('');

      resultsDiv.innerHTML = `
        <h4 style="margin-bottom:12px;font-size:15px;font-weight:600">${icon('fileText',16)} Balance Report</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Employee</th><th>Leave Type</th><th style="text-align:center">Balance (Days)</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:40px">No balance data available</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsDiv.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading balance report: ${err.message}</div>`;
    }
  },

  async loadUtilisationReport(year) {
    const resultsDiv = document.getElementById('report-results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Loading utilisation report...</div>';

    try {
      let utilData = [];
      try {
        const data = await api(`/leave/reports/utilisation?year=${year}`);
        utilData = data.data || [];
      } catch {
        const txnData = await api(`/leave/transactions?limit=500`);
        const transactions = txnData.data || [];
        const yearTxns = transactions.filter(t => {
          const d = new Date(t.start_date);
          return d.getFullYear() === parseInt(year);
        });
        const typeMap = {};
        yearTxns.forEach(t => {
          const key = t.leave_type_name || t.leave_type_code || 'Unknown';
          if (!typeMap[key]) typeMap[key] = { leave_type: key, total_days: 0, approved: 0, rejected: 0, pending: 0 };
          typeMap[key].total_days += parseFloat(t.days || 0);
          if (t.status === 'APPROVED') typeMap[key].approved++;
          else if (t.status === 'REJECTED') typeMap[key].rejected++;
          else if (t.status === 'PENDING') typeMap[key].pending++;
        });
        utilData = Object.values(typeMap);
      }

      const rows = utilData.map(u => `
        <tr>
          <td><strong>${u.leave_type || '-'}</strong></td>
          <td style="text-align:center">${parseFloat(u.total_days || 0).toFixed(1)}</td>
          <td style="text-align:center"><span class="badge badge-success">${u.approved || 0}</span></td>
          <td style="text-align:center"><span class="badge badge-danger">${u.rejected || 0}</span></td>
          <td style="text-align:center"><span class="badge badge-warning">${u.pending || 0}</span></td>
        </tr>
      `).join('');

      resultsDiv.innerHTML = `
        <h4 style="margin-bottom:12px;font-size:15px;font-weight:600">${icon('barChart2',16)} Utilisation Report - ${year}</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Leave Type</th><th style="text-align:center">Total Days</th><th style="text-align:center">Approved</th><th style="text-align:center">Rejected</th><th style="text-align:center">Pending</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:40px">No utilisation data for this year</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      resultsDiv.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading utilisation report: ${err.message}</div>`;
    }
  },

  async loadLeaveLiability() {
    const resultsDiv = document.getElementById('report-results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating leave liability...</div>';

    try {
      const data = await apiPost('/payroll/leave-liability', {});
      const liability = data.data || data;
      const totalAmount = liability.total_liability || liability.total || 0;
      const details = liability.details || liability.employees || [];

      let detailRows = '';
      if (details.length > 0) {
        detailRows = details.map(d => `
          <tr>
            <td><strong>${d.employee_code || ''}</strong> ${d.first_name || ''} ${d.surname || ''}</td>
            <td>${d.leave_type || '-'}</td>
            <td style="text-align:center">${parseFloat(d.days || d.balance || 0).toFixed(1)}</td>
            <td style="text-align:right;font-weight:600">${formatCurrency(d.amount || d.liability || 0)}</td>
          </tr>
        `).join('');
      }

      resultsDiv.innerHTML = `
        ${UI.statCards([
          { label: 'Total Leave Liability', value: formatCurrency(totalAmount), color: '#F59E0B' },
        ])}
        ${details.length > 0 ? `
          <h4 style="margin:16px 0 12px;font-size:15px;font-weight:600">${icon('dollarSign',16)} Liability Breakdown</h4>
          <div class="data-grid">
            <table>
              <thead><tr><th>Employee</th><th>Leave Type</th><th style="text-align:center">Days</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>${detailRows}</tbody>
            </table>
          </div>
        ` : ''}
      `;
    } catch (err) {
      resultsDiv.innerHTML = `<div class="loading" style="color:var(--danger)">Error calculating liability: ${err.message}</div>`;
    }
  },

  renderTypesView() {
    const container = document.getElementById('leave-view-content');
    if (!container) return;

    const rows = this.state.leaveTypes.map(t => `
      <tr>
        <td><span class="badge badge-info">${t.code}</span></td>
        <td><strong>${t.name}</strong></td>
        <td>${t.scheme_name || '-'}</td>
        <td style="text-align:center">${t.accrual_days || '-'}</td>
        <td style="text-align:center">${t.max_accumulation || '-'}</td>
        <td style="text-align:center">${t.accrual_frequency || '-'}</td>
        <td style="text-align:center">${t.requires_documentation ? 'Yes' : 'No'}</td>
        <td style="text-align:center">${t.paid ? 'Yes' : 'No'}</td>
        <td style="text-align:center"><span class="status-badge status-${t.enabled ? 'active' : 'inactive'}">${t.enabled ? 'Active' : 'Inactive'}</span></td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h3 style="font-size:16px;font-weight:600;color:#1E293B;margin:0 0 4px">Leave Type Configuration</h3>
          <p style="font-size:13px;color:#64748B;margin:0">BCEA-compliant leave types with accrual rules and limits</p>
        </div>
        <a href="#" onclick="event.preventDefault();document.querySelector('[data-module=settings]').click();setTimeout(()=>document.querySelector('[data-tab=leave]')?.click(),100)" style="font-size:12px;color:var(--accent)">${icon('settings',12)} Manage in Settings</a>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Leave Type</th>
              <th>Scheme</th>
              <th style="text-align:center">Annual Days</th>
              <th style="text-align:center">Max Accumulation</th>
              <th style="text-align:center">Accrual Freq</th>
              <th style="text-align:center">Docs Required</th>
              <th style="text-align:center">Paid</th>
              <th style="text-align:center">Status</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:40px">No leave types configured</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  updateStatCards() {
    const el = document.getElementById('module-body');
    if (!el) return;
    const statCardsEl = el.querySelector('.stat-cards');
    if (!statCardsEl) return;

    const statusCounts = this.getStatusCounts();
    const newHtml = UI.statCards([
      { label: 'Total Requests', value: this.state.pagination.total, color: '#4F6AFF' },
      { label: 'Pending', value: statusCounts.PENDING || 0, color: '#F59E0B' },
      { label: 'Approved', value: statusCounts.APPROVED || 0, color: '#10B981' },
      { label: 'Rejected', value: statusCounts.REJECTED || 0, color: '#EF4444' },
    ]);
    const temp = document.createElement('div');
    temp.innerHTML = newHtml;
    statCardsEl.replaceWith(temp.firstElementChild);
  },
};
