const PayrollModule = {
  state: {
    runs: [],
    cycles: [],
    periods: [],
    currentRun: null,
    activeTab: 'runs',
    filters: { status: '', cycle_id: '' },
    pagination: { page: 1, limit: 20, total: 0 }
  },

  async render(el) {
    this.container = el;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading payroll module...</div>';
    try {
      await this.loadCycles();
      this.renderMain();
      await this.loadRuns();
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadCycles() {
    const res = await api('/payroll/cycles');
    this.state.cycles = res.data || [];
  },

  async loadPeriods(cycleId, forNewRun) {
    if (!cycleId) { this.state.periods = []; return; }
    let url = `/payroll/periods?cycle_id=${cycleId}&status=OPEN`;
    if (forNewRun) url += '&available_for_run=true';
    const res = await api(url);
    this.state.periods = res.data || [];
  },

  async loadRuns() {
    const { status, cycle_id } = this.state.filters;
    const { page, limit } = this.state.pagination;
    let url = `/payroll/runs?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (cycle_id) url += `&cycle_id=${cycle_id}`;
    const res = await api(url);
    this.state.runs = res.data || [];
    this.state.pagination.total = res.meta?.total || 0;
    this.renderRunsList();
  },

  renderMain() {
    const tabs = [
      { id: 'runs', label: 'Payroll Runs', icon: icon('dollar',14) },
      { id: 'salaryincreases', label: 'Salary Increases', icon: icon('trendingUp',14) },
      { id: 'variance', label: 'Variance', icon: icon('barChart',14) },
      { id: 'gl', label: 'GL & Sub-Ledger', icon: icon('book',14) },
      { id: 'grap25', label: 'GRAP 25', icon: icon('shield',14) },
      { id: 'payments', label: 'Payments', icon: icon('creditCard',14) },
      { id: 'councillor', label: 'Councillor Register', icon: icon('users',14) },
      { id: 'tax', label: 'Tax Tables', icon: icon('fileText',14) },
      { id: 'thirdparty', label: 'Third Party Payments', icon: icon('users',14) },
      { id: 'salaryheads', label: 'Salary Heads', icon: icon('clipboard',14) }
    ];

    this.container.innerHTML = `
      ${UI.detailTabs(tabs, this.state.activeTab)}
      <div id="payroll-tab-content"></div>
    `;

    this.container.querySelectorAll('[data-detail-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.activeTab = tab.dataset.detailTab;
        this.container.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderTabContent();
      });
    });

    this.renderTabContent();
  },

  async renderTabContent() {
    const el = document.getElementById('payroll-tab-content');
    if (!el) return;

    switch (this.state.activeTab) {
      case 'runs': this.renderRunsTab(el); await this.loadRuns(); break;
      case 'salaryincreases': await this.renderSalaryIncreasesTab(el); break;
      case 'variance': await this.renderVarianceTab(el); break;
      case 'gl': await this.renderGLSubLedgerTab(el); break;
      case 'grap25': await this.renderGRAP25Tab(el); break;
      case 'payments': await this.renderPaymentsTab(el); break;
      case 'councillor': await this.renderCouncillorRegisterTab(el); break;
      case 'tax': await this.renderTaxTab(el); break;
      case 'thirdparty': await this.renderThirdPartyTab(el); break;
      case 'salaryheads': await this.renderSalaryHeadsTab(el); break;
    }
  },

  renderRunsTab(el) {
    const statusOptions = [
      { value: '', label: 'All Statuses' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'PROCESSING', label: 'Processing' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'LOCKED', label: 'Locked' },
      { value: 'APPROVED', label: 'Approved' },
      { value: 'FAILED', label: 'Failed' }
    ];

    const cycleOptions = [{ value: '', label: 'All Cycles' }, ...this.state.cycles.map(c => ({ value: c.id, label: c.name }))];

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-filter">
          <select id="payroll-filter-status" class="toolbar-filter-select">
            ${statusOptions.map(o => `<option value="${o.value}" ${this.state.filters.status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
          <select id="payroll-filter-cycle" class="toolbar-filter-select">
            ${cycleOptions.map(o => `<option value="${o.value}" ${this.state.filters.cycle_id == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn" id="btn-mock-payslip">${icon('fileText',14)} Mock Payslip</button>
          <button class="btn btn-primary" id="btn-create-run">&#43; Create Payroll Run</button>
        </div>
      </div>
      <div id="payroll-pipeline"></div>
      <div id="payroll-runs-list">
        <div class="loading"><div class="spinner"></div>Loading runs...</div>
      </div>
      <div id="payroll-pagination"></div>
    `;

    document.getElementById('payroll-filter-status').addEventListener('change', (e) => {
      this.state.filters.status = e.target.value;
      this.state.pagination.page = 1;
      this.loadRuns();
    });
    document.getElementById('payroll-filter-cycle').addEventListener('change', (e) => {
      this.state.filters.cycle_id = e.target.value;
      this.state.pagination.page = 1;
      this.loadRuns();
    });
    document.getElementById('btn-create-run').addEventListener('click', () => this.showCreateRunModal());
    document.getElementById('btn-mock-payslip').addEventListener('click', () => this.showMockPayslipModal());
  },

  renderRunsList() {
    const listEl = document.getElementById('payroll-runs-list');
    const pagEl = document.getElementById('payroll-pagination');
    const pipeEl = document.getElementById('payroll-pipeline');
    if (!listEl) return;

    const runs = this.state.runs;

    if (pipeEl) {
      const counts = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, LOCKED: 0, APPROVED: 0 };
      const trialCompleted = runs.filter(r => ['TRIAL','ADHOC_TRIAL'].includes(r.run_type) && r.status === 'COMPLETED').length;
      runs.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
      pipeEl.innerHTML = UI.workflowSteps([
        { label: 'Trial', count: counts.PENDING + counts.PROCESSING + trialCompleted, status: (counts.PENDING + counts.PROCESSING + trialCompleted) > 0 ? 'active' : 'pending' },
        { label: 'Reviewed', count: counts.COMPLETED - trialCompleted, status: (counts.COMPLETED - trialCompleted) > 0 ? 'completed' : 'pending' },
        { label: 'Locked', count: counts.LOCKED, status: counts.LOCKED > 0 ? 'completed' : 'pending' },
        { label: 'Approved', count: counts.APPROVED, status: counts.APPROVED > 0 ? 'completed' : 'pending' }
      ]);
    }

    if (runs.length === 0) {
      listEl.innerHTML = UI.emptyState(icon('dollar',32), 'No Payroll Runs', 'Create a new payroll run to get started');
      if (pagEl) pagEl.innerHTML = '';
      return;
    }

    const rows = runs.map(r => {
      const isTrial = ['TRIAL','ADHOC_TRIAL'].includes(r.run_type);
      return `
      <tr class="clickable-row" data-run-id="${r.id}">
        <td><strong>#${r.id}</strong></td>
        <td>${r.cycle_name || '-'}</td>
        <td>Period ${r.period_number} (${r.tax_year})</td>
        <td><span class="badge badge-${isTrial ? 'info' : 'danger'}">${r.run_type}</span></td>
        <td>${r.employee_count || 0}</td>
        <td style="text-align:right">${formatCurrency(r.total_earnings || 0)}</td>
        <td style="text-align:right">${formatCurrency(r.total_deductions || 0)}</td>
        <td style="text-align:right;font-weight:600">${formatCurrency(r.total_nett || 0)}</td>
        <td><span class="status-badge status-${(r.status || '').toLowerCase()}">${r.status}</span></td>
        <td>
          <div class="action-bar">
            ${['PENDING','FAILED'].includes(r.status) ? `<button class="action-btn" data-action="execute" data-id="${r.id}" title="Execute">${icon('activity',14)}</button>` : ''}
            ${r.status === 'PROCESSING' ? `<button class="action-btn" data-action="progress" data-id="${r.id}" title="View Progress" style="color:#2e7d32">${icon('eye',14)}</button>` : ''}
            ${r.status === 'COMPLETED' ? `<button class="action-btn" data-action="execute" data-id="${r.id}" title="Re-execute">${icon('refresh',14)}</button>` : ''}
            ${r.status === 'COMPLETED' && isTrial ? `<button class="action-btn success" data-action="promote" data-id="${r.id}" title="Promote to Final & Lock">${icon('arrowRight',14)}</button>` : ''}
            ${r.status === 'COMPLETED' && !isTrial ? `<button class="action-btn success" data-action="lock" data-id="${r.id}" title="Lock">${icon('lock',14)}</button>` : ''}
            ${r.status === 'LOCKED' ? `<button class="action-btn" data-action="unlock" data-id="${r.id}" title="Unlock (revert to Trial)">${icon('rotateCcw',14)}</button>` : ''}
            ${r.status === 'LOCKED' ? `<button class="action-btn success" data-action="approve" data-id="${r.id}" title="Approve">${icon('check',14)}</button>` : ''}
            ${r.status === 'COMPLETED' ? `<button class="action-btn danger" data-action="void" data-id="${r.id}" title="Void">${icon('xCircle',14)}</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    listEl.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Run #</th><th>Cycle</th><th>Period</th><th>Type</th><th>Employees</th>
              <th style="text-align:right">Gross</th><th style="text-align:right">Deductions</th>
              <th style="text-align:right">Nett Pay</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    listEl.querySelectorAll('.clickable-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        this.showRunDetail(parseInt(row.dataset.runId));
      });
    });

    listEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'execute') this.executeRun(id);
        else if (action === 'progress') this.showProgressModal(id, true);
        else if (action === 'promote') this.promoteRun(id);
        else if (action === 'lock') this.lockRun(id);
        else if (action === 'unlock') this.unlockRun(id);
        else if (action === 'approve') this.approveRun(id);
        else if (action === 'void') this.voidRun(id);
        else if (action === 'reverse') this.reverseRun(id);
      });
    });

    if (pagEl && this.state.pagination.total > this.state.pagination.limit) {
      pagEl.innerHTML = UI.pagination({
        page: this.state.pagination.page,
        limit: this.state.pagination.limit,
        total: this.state.pagination.total,
        onPageChange: 'PayrollModule.goToPage'
      });
    } else if (pagEl) {
      pagEl.innerHTML = '';
    }
  },

  goToPage(page) {
    this.state.pagination.page = page;
    this.loadRuns();
  },

  async showCreateRunModal() {
    const cycleOpts = this.state.cycles.map(c => ({ value: c.id, label: c.name }));

    const formFields = UI.buildForm([
      { type: 'section', label: 'Payroll Run Configuration', icon: icon('settings',16) },
      { id: 'pr_cycle_id', label: 'Payroll Cycle', type: 'select', options: cycleOpts, required: true },
      { id: 'pr_period_id', label: 'Payroll Period', type: 'select', options: [], required: true, hint: 'Select a cycle first' },
      { id: 'pr_run_type', label: 'Run Type', type: 'select', options: [
        { value: 'TRIAL', label: 'Trial Run (promoted to Final after review)' },
        { value: 'ADHOC_TRIAL', label: 'Ad Hoc Trial (once-off calculation)' },
        { value: 'NORMAL', label: 'Normal (standard payroll run)' },
        { value: 'SUPPLEMENTARY', label: 'Supplementary (selected heads only)' },
        { value: 'BONUS_13TH_CHEQUE', label: 'Bonus 13th Cheque' },
        { value: 'LEAVE_ENCASHMENT', label: 'Leave Encashment' },
      ], required: true, hint: 'Runs start as Trial. Promote to Final after reviewing results.' },
      { id: 'pr_payment_date', label: 'Payment Date', type: 'date' }
    ]);

    const overlay = UI.modal({
      title: 'Create Payroll Run',
      size: 'lg',
      content: `<div class="form-grid" id="create-run-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-submit-run">Create Run</button>`
    });

    const cycleSelect = document.getElementById('pr_cycle_id');
    const periodSelect = document.getElementById('pr_period_id');

    cycleSelect.addEventListener('change', async () => {
      const cycleId = cycleSelect.value;
      periodSelect.innerHTML = '<option value="">Loading...</option>';
      if (cycleId) {
        await this.loadPeriods(cycleId, true);
        if (this.state.periods.length === 0) {
          periodSelect.innerHTML = '<option value="">No available periods (all finalised)</option>';
        } else {
          const opts = this.state.periods.map(p => `<option value="${p.id}">Period ${p.period_number} - Tax Year ${p.tax_year} (${p.start_date?.split('T')[0]} to ${p.end_date?.split('T')[0]})</option>`);
          periodSelect.innerHTML = (this.state.periods.length > 1 ? '<option value="">-- Select Period --</option>' : '') + opts.join('');
        }
      } else {
        periodSelect.innerHTML = '<option value="">-- Select Cycle First --</option>';
      }
    });

    document.getElementById('btn-submit-run').addEventListener('click', async () => {
      const form = document.getElementById('create-run-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) {
        UI.toast('error', 'Validation Error', errors[0]);
        return;
      }
      const data = UI.getFormData(form);
      try {
        const res = await apiPost('/payroll/runs', {
          cycle_id: parseInt(data.pr_cycle_id),
          period_id: parseInt(data.pr_period_id),
          run_type: data.pr_run_type,
          payment_date: data.pr_payment_date || null
        });
        UI.closeModal();
        UI.toast('success', 'Payroll Run Created', `Run #${res.data.id} created as ${data.pr_run_type}`);
        this.loadRuns();
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  _activePollers: {},

  showProgressModal(id, isResumed) {
    const self = this;
    if (self._activePollers[id]) { clearInterval(self._activePollers[id]); delete self._activePollers[id]; }

    UI.modal({
      title: 'Payroll Execution',
      size: 'md',
      content: `
        <div id="payroll-progress-container" style="padding:16px 0">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div class="spinner" id="progress-spinner"></div>
            <div>
              <div id="progress-title" style="font-weight:600;font-size:15px;color:var(--primary-dark)">${isResumed ? 'Payroll run #' + id + ' in progress...' : 'Initialising payroll run #' + id + '...'}</div>
              <div id="progress-subtitle" style="font-size:12px;color:var(--text-muted);margin-top:2px">${isResumed ? 'Reconnecting to running payroll' : 'Preparing employee data'}</div>
            </div>
          </div>
          <div style="background:var(--bg);border-radius:8px;height:24px;overflow:hidden;border:1px solid var(--border)">
            <div id="progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#2e7d32,#4caf50);border-radius:8px;transition:width 0.3s ease;display:flex;align-items:center;justify-content:center">
              <span id="progress-pct-inner" style="font-size:11px;font-weight:600;color:#fff"></span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px">
            <span id="progress-count" style="font-size:12px;color:var(--text-secondary)">0 / 0 employees</span>
            <span id="progress-eta" style="font-size:12px;color:var(--text-muted)"></span>
          </div>
          <div id="progress-current" style="font-size:12px;color:var(--text-muted);margin-top:8px;min-height:16px"></div>
          <div id="progress-errors" style="font-size:12px;color:var(--danger);margin-top:4px;display:none"></div>
          <div id="progress-note" style="font-size:11px;color:var(--text-muted);margin-top:12px;padding:8px;background:#f8f9fb;border-radius:6px;border:1px solid var(--border)">
            ${icon('activity',14)} You can close this window — the payroll will continue processing in the background. Click the ${icon('eye',14)} progress button on the run to reopen this view.
          </div>
        </div>
      `,
      footer: `<button class="btn" onclick="UI.closeModal();PayrollModule.loadRuns();">Close</button>`
    });

    const pollInterval = setInterval(async () => {
      try {
        const prog = await api(`/payroll/runs/${id}/progress`);
        const d = prog.data;
        const bar = document.getElementById('progress-bar');
        const pctInner = document.getElementById('progress-pct-inner');
        const countEl = document.getElementById('progress-count');
        const etaEl = document.getElementById('progress-eta');
        const currentEl = document.getElementById('progress-current');
        const errEl = document.getElementById('progress-errors');
        const subtitle = document.getElementById('progress-subtitle');
        const titleEl = document.getElementById('progress-title');

        if (!bar) { clearInterval(pollInterval); delete self._activePollers[id]; return; }

        bar.style.width = `${d.percent}%`;
        pctInner.textContent = d.percent > 8 ? `${d.percent}%` : '';
        countEl.textContent = `${d.processed.toLocaleString()} / ${d.total.toLocaleString()} employees`;
        if (d.currentEmployee) currentEl.textContent = `Processing: ${d.currentEmployee}`;
        if (d.eta_seconds != null && d.eta_seconds > 0) {
          const mins = Math.floor(d.eta_seconds / 60);
          const secs = d.eta_seconds % 60;
          etaEl.textContent = mins > 0 ? `ETA: ${mins}m ${secs}s` : `ETA: ${secs}s`;
        }
        if (d.errors > 0) { errEl.style.display = 'block'; errEl.textContent = `${d.errors} error(s) encountered`; }
        if (d.total > 0) {
          titleEl.textContent = `Processing payroll run #${id}`;
          subtitle.textContent = `Calculating ${d.total.toLocaleString()} employees`;
        }

        if (d.status === 'COMPLETED' || d.status === 'FAILED') {
          clearInterval(pollInterval);
          delete self._activePollers[id];
          const noteEl = document.getElementById('progress-note');
          if (noteEl) noteEl.style.display = 'none';
          if (d.status === 'COMPLETED') {
            bar.style.width = '100%';
            bar.style.background = 'linear-gradient(90deg,#2e7d32,#4caf50)';
            pctInner.textContent = '100%';
            titleEl.textContent = `Payroll run #${id} completed`;
            subtitle.textContent = `${d.total.toLocaleString()} employees processed successfully`;
            currentEl.textContent = '';
            etaEl.textContent = d.elapsed_ms ? `Completed in ${Math.round(d.elapsed_ms / 1000)}s` : '';
            const spinner = document.getElementById('progress-spinner');
            if (spinner) spinner.outerHTML = `<span style="color:var(--success)">${icon('check',24)}</span>`;
            UI.toast('success', 'Payroll Executed', `Processed ${d.total.toLocaleString()} employees`);
          } else {
            bar.style.background = '#e8a0a0';
            titleEl.textContent = `Payroll run #${id} failed`;
            subtitle.textContent = 'Payroll run encountered errors';
            const spinner = document.getElementById('progress-spinner');
            if (spinner) spinner.outerHTML = `<span style="color:var(--danger)">${icon('alertTriangle',24)}</span>`;
            UI.toast('error', 'Execution Failed', 'Payroll run encountered errors');
          }
        }
      } catch (pollErr) {
        console.error('Progress poll error:', pollErr);
      }
    }, 1500);

    self._activePollers[id] = pollInterval;
  },

  async executeRun(id) {
    const confirmed = await UI.confirm({
      title: 'Execute Payroll Run',
      message: `This will calculate payroll for all active employees in Run #${id}. Any existing results will be recalculated. Continue?`,
      icon: icon('alertTriangle', 28),
      confirmText: 'Execute',
      danger: false
    });
    if (!confirmed) return;

    this.showProgressModal(id, false);

    try {
      await apiPost(`/payroll/runs/${id}/execute`, { async: true });
    } catch (err) {
      if (this._activePollers[id]) { clearInterval(this._activePollers[id]); delete this._activePollers[id]; }
      const container = document.getElementById('payroll-progress-container');
      if (container) container.innerHTML = `<div style="text-align:center;color:var(--danger);padding:20px">${icon('alertTriangle',28)}<br><strong>Execution Failed</strong><br>${err.message}</div>`;
    }
  },

  async lockRun(id) {
    const confirmed = await UI.confirm({
      title: 'Lock Payroll Run',
      message: `Locking Run #${id} will prevent further changes. This action requires approval to proceed to payment. Continue?`,
      icon: icon('alertTriangle', 28),
      confirmText: 'Lock Run',
      danger: true
    });
    if (!confirmed) return;

    try {
      await apiPost(`/payroll/runs/${id}/lock`);
      UI.toast('success', 'Run Locked', `Payroll Run #${id} has been locked`);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'Lock Failed', err.message);
    }
  },

  async promoteRun(id) {
    const confirmed = await UI.confirm({
      title: 'Promote to Final Run',
      message: `This will promote Trial Run #${id} to a <strong>FINAL</strong> run and lock it for approval. The payroll results remain unchanged -- no recalculation needed.<br><br>You can still unlock and revert to trial if needed before approval.`,
      icon: icon('arrowRight', 28),
      confirmText: 'Promote & Lock',
      danger: false
    });
    if (!confirmed) return;

    try {
      await apiPost(`/payroll/runs/${id}/promote`);
      UI.toast('success', 'Promoted to Final', `Run #${id} is now a FINAL run and locked for approval`);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'Promote Failed', err.message);
    }
  },

  async unlockRun(id) {
    const confirmed = await UI.confirm({
      title: 'Unlock Payroll Run',
      message: `Unlocking Run #${id} will revert it to a <strong>TRIAL</strong> run, allowing re-execution and changes. The existing results are preserved but the run will need to be promoted again before approval.`,
      icon: icon('rotateCcw', 28),
      confirmText: 'Unlock',
      danger: true
    });
    if (!confirmed) return;

    try {
      await apiPost(`/payroll/runs/${id}/unlock`);
      UI.toast('success', 'Run Unlocked', `Run #${id} reverted to trial status`);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'Unlock Failed', err.message);
    }
  },

  async approveRun(id) {
    const confirmed = await UI.confirm({
      title: 'Approve Payroll Run',
      message: `Approving Run #${id} authorises this payroll for payment processing. This action is <strong>permanent</strong> and cannot be reversed. Continue?`,
      icon: icon('alertTriangle', 28),
      confirmText: 'Approve',
      danger: true
    });
    if (!confirmed) return;

    try {
      await apiPost(`/payroll/runs/${id}/approve`);
      UI.toast('success', 'Run Approved', `Payroll Run #${id} has been approved`);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'Approval Failed', err.message);
    }
  },

  async showRunDetail(id) {
    const overlay = UI.modal({
      title: `Payroll Run #${id}`,
      size: 'xl',
      content: '<div class="loading"><div class="spinner"></div>Loading run details...</div>'
    });

    try {
      const [runRes, resultsRes, errorsRes] = await Promise.all([
        api(`/payroll/runs/${id}`),
        api(`/payroll/runs/${id}/results?limit=200`),
        api(`/payroll/runs/${id}/errors`)
      ]);

      const run = runRes.data;
      const results = resultsRes.data || [];
      const errors = errorsRes.data || [];

      const body = overlay.querySelector('.modal-body');

      let totalPaye = 0, totalUifEe = 0, totalSdl = 0, totalEtiCalc = 0;
      results.forEach(r => {
        if (r.salary_head_code === 'PAYE') totalPaye += parseFloat(r.amount) || 0;
        else if (r.salary_head_code === 'UIF_EE') totalUifEe += parseFloat(r.amount) || 0;
        else if (r.salary_head_code === 'SDL') totalSdl += parseFloat(r.amount) || 0;
        if (r.salary_head_code === 'ETI' || (r.salary_head_name && r.salary_head_name.includes('ETI'))) totalEtiCalc += parseFloat(r.amount) || 0;
      });

      const etiAmount = parseFloat(run.eti_amount) || totalEtiCalc || 0;
      const summaryCards = UI.statCards([
        { label: 'Employees', value: run.employee_count || 0, color: '#4F6AFF' },
        { label: 'Total Gross', value: formatCurrency(run.total_earnings || 0), color: '#10B981' },
        { label: 'Deductions', value: formatCurrency(run.total_deductions || 0), color: '#F59E0B' },
        { label: 'Nett Pay', value: formatCurrency(run.total_nett || 0), color: '#4F6AFF' },
        { label: 'PAYE', value: formatCurrency(totalPaye), color: '#EF4444' },
        { label: 'UIF (Employee)', value: formatCurrency(totalUifEe), color: '#F59E0B' },
        { label: 'SDL', value: formatCurrency(totalSdl), color: '#8B5CF6' },
        { label: 'ETI Credit', value: formatCurrency(etiAmount), color: '#2e7d32' },
        { label: 'Errors', value: run.errors_count || 0, color: (run.errors_count || 0) > 0 ? '#EF4444' : '#10B981' }
      ]);

      const statusSteps = ['PENDING', 'PROCESSING', 'COMPLETED', 'LOCKED', 'APPROVED'];
      const currentIdx = statusSteps.indexOf(run.status);
      const workflowHtml = UI.workflowSteps(statusSteps.map((s, i) => ({
        label: s,
        icon: i <= currentIdx ? '✓' : (i + 1),
        status: i < currentIdx ? 'completed' : i === currentIdx ? 'active' : 'pending'
      })));

      const empMap = {};
      let totalEti = 0;
      results.forEach(r => {
        if (!empMap[r.employee_id]) {
          empMap[r.employee_id] = {
            code: r.employee_code,
            name: `${r.first_name} ${r.surname}`,
            earnings: 0,
            deductions: 0,
            company: 0,
            eti: 0,
            hasArrears: false,
            hasOvertime: false,
            hasInstalment: false,
            items: []
          };
        }
        const emp = empMap[r.employee_id];
        if (r.transaction_type === 'EARNING') emp.earnings += parseFloat(r.amount) || 0;
        else if (r.transaction_type === 'DEDUCTION') emp.deductions += parseFloat(r.amount) || 0;
        else if (r.transaction_type === 'COMPANY_CONTRIBUTION') emp.company += parseFloat(r.amount) || 0;
        if (r.salary_head_code === 'ETI' || (r.salary_head_name && r.salary_head_name.includes('ETI'))) {
          emp.eti += parseFloat(r.amount) || 0;
          totalEti += parseFloat(r.amount) || 0;
        }
        if (r.salary_head_code === 'ARREARS' || (r.salary_head_name && r.salary_head_name.includes('Arrear'))) emp.hasArrears = true;
        if (r.salary_head_code === 'OT' || (r.salary_head_name && r.salary_head_name.includes('Overtime'))) emp.hasOvertime = true;
        if (r.salary_head_name && (r.salary_head_name.includes('Instalment') || r.salary_head_name.includes('Garnish'))) emp.hasInstalment = true;
        emp.items.push(r);
      });

      const empEntries = Object.entries(empMap);
      const empRows = empEntries.map(([empId, emp]) => {
        const indicators = [];
        if (emp.eti > 0) indicators.push(`<span class="badge badge-success" title="ETI: ${formatCurrency(emp.eti)}">ETI</span>`);
        if (emp.hasArrears) indicators.push('<span class="badge badge-warning" title="Has arrears recovery">ARR</span>');
        if (emp.hasOvertime) indicators.push('<span class="badge badge-info" title="Overtime included">OT</span>');
        if (emp.hasInstalment) indicators.push('<span class="badge badge-danger" title="Instalment deduction">INST</span>');
        return `
        <tr class="clickable-row" data-emp-id="${empId}" style="cursor:pointer" title="Click to view payslip">
          <td><strong>${emp.code}</strong></td>
          <td>${emp.name}</td>
          <td style="text-align:right">${formatCurrency(emp.earnings)}</td>
          <td style="text-align:right">${formatCurrency(emp.deductions)}</td>
          <td style="text-align:right">${formatCurrency(emp.company)}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(emp.earnings - emp.deductions)}</td>
          <td>${indicators.join(' ')}</td>
        </tr>`;
      }).join('');

      const scoaMap = {};
      results.forEach(r => {
        if (r.scoa_item_id) {
          const key = r.scoa_item_id;
          if (!scoaMap[key]) scoaMap[key] = { scoa_item_id: key, total: 0, count: 0, type: r.transaction_type };
          scoaMap[key].total += parseFloat(r.amount) || 0;
          scoaMap[key].count++;
        }
      });
      const scoaEntries = Object.values(scoaMap);

      const errorRows = errors.length > 0 ? errors.map(e => `
        <tr>
          <td>${e.employee_code || '-'}</td>
          <td>${e.first_name || ''} ${e.surname || ''}</td>
          <td><span class="badge badge-${e.severity === 'ERROR' ? 'danger' : 'warning'}">${e.severity}</span></td>
          <td>${e.error_type}</td>
          <td>${e.error_message}</td>
        </tr>
      `).join('') : '';

      const detailTabs = UI.detailTabs([
        { id: 'detail-summary', label: 'Summary', icon: icon('clipboard',14) },
        { id: 'detail-employees', label: `Employees (${Object.keys(empMap).length})`, icon: icon('users',14) },
        { id: 'detail-results', label: `Line Items (${results.length})`, icon: icon('fileText',14) },
        ...(scoaEntries.length > 0 ? [{ id: 'detail-scoa', label: 'mSCOA Allocation', icon: icon('grid',14) }] : []),
        { id: 'detail-gl', label: 'GL Journals', icon: icon('book',14) },
        ...(errors.length > 0 ? [{ id: 'detail-errors', label: `Errors (${errors.length})`, icon: icon('alertTriangle',14) }] : [])
      ], 'detail-summary');

      const infoGrid = `
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Cycle</div><div class="info-value">${run.cycle_name}</div></div>
          <div class="info-item"><div class="info-label">Period</div><div class="info-value">Period ${run.period_number} (${run.tax_year})</div></div>
          <div class="info-item"><div class="info-label">Run Type</div><div class="info-value">${run.run_type}</div></div>
          <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(run.status||'').toLowerCase()}">${run.status}</span></div></div>
          <div class="info-item"><div class="info-label">Period Start</div><div class="info-value">${run.period_start?.split('T')[0] || '-'}</div></div>
          <div class="info-item"><div class="info-label">Period End</div><div class="info-value">${run.period_end?.split('T')[0] || '-'}</div></div>
          <div class="info-item"><div class="info-label">Payment Date</div><div class="info-value">${run.payment_date?.split('T')[0] || '-'}</div></div>
          <div class="info-item"><div class="info-label">Run Date</div><div class="info-value">${run.run_date?.split('T')[0] || '-'}</div></div>
        </div>
      `;

      const lineItemRows = results.map(r => `
        <tr>
          <td>${r.employee_code}</td>
          <td>${r.first_name} ${r.surname}</td>
          <td>${r.salary_head_code}</td>
          <td>${r.salary_head_name}</td>
          <td><span class="badge badge-${r.transaction_type === 'EARNING' ? 'success' : r.transaction_type === 'DEDUCTION' ? 'danger' : 'info'}">${r.transaction_type}</span></td>
          <td style="text-align:right;font-weight:500">${formatCurrency(r.amount)}</td>
        </tr>
      `).join('');

      const isTrial = ['TRIAL','ADHOC_TRIAL'].includes(run.run_type);
      const actionButtons = `
        ${isTrial && run.status === 'COMPLETED' ? '<div style="padding:10px 14px;background:var(--info-bg);border-radius:var(--radius-sm);margin-top:12px;font-size:12px;display:flex;align-items:center;gap:8px;color:var(--info-dark)">' + icon('activity',16) + ' Trial run complete. Review results below, then <strong>Promote to Final</strong> to lock down for approval.</div>' : ''}
        ${run.status === 'LOCKED' ? '<div style="padding:10px 14px;background:var(--success-bg);border-radius:var(--radius-sm);margin-top:12px;font-size:12px;display:flex;align-items:center;gap:8px;color:var(--success-dark)">' + icon('lock',16) + ' Run is locked as FINAL. Approve to authorise payment, or Unlock to revert to trial for changes.</div>' : ''}
        <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap">
          ${['PENDING','COMPLETED'].includes(run.status) ? `<button class="btn" id="detail-single-emp-btn">${icon('user',14)} Run Single Employee</button>` : ''}
          ${['PENDING','FAILED','PROCESSING'].includes(run.status) ? `<button class="btn btn-primary" id="detail-execute-btn">${icon('activity',14)} ${run.status === 'PENDING' ? 'Execute' : 'Re-execute'} Run</button>` : ''}
          ${run.status === 'PENDING' || run.status === 'PROCESSING' ? `<button class="btn btn-primary" id="detail-prorate-btn">${icon('clock',14)} Prorate</button>` : ''}
          ${run.status === 'COMPLETED' ? `<button class="btn btn-primary" id="detail-rerun-btn">${icon('refresh',14)} Re-execute</button>` : ''}
          ${run.status === 'COMPLETED' && isTrial ? `<button class="btn btn-primary" id="detail-promote-btn">${icon('arrowRight',14)} Promote to Final</button>` : ''}
          ${run.status === 'COMPLETED' && !isTrial ? `<button class="btn btn-primary" id="detail-lock-btn">${icon('lock',14)} Lock Run</button>` : ''}
          ${run.status === 'LOCKED' ? `<button class="btn" id="detail-unlock-btn" style="border-color:var(--warning);color:var(--warning)">${icon('rotateCcw',14)} Unlock</button>` : ''}
          ${run.status === 'LOCKED' ? `<button class="btn btn-primary" id="detail-approve-btn">${icon('check',14)} Approve Run</button>` : ''}
          ${run.status === 'LOCKED' || run.status === 'COMPLETED' ? `<button class="btn btn-primary" id="detail-glpost-btn">${icon('fileText',14)} GL Post</button>` : ''}
          ${run.status === 'COMPLETED' ? `<button class="btn" id="detail-void-btn" style="border-color:var(--danger);color:var(--danger)">${icon('xCircle',14)} Void</button>` : ''}
        </div>
      `;

      body.innerHTML = `
        ${workflowHtml}
        ${summaryCards}
        ${detailTabs}

        <div class="detail-panel active" id="panel-detail-summary">
          ${infoGrid}
          ${actionButtons}
        </div>

        <div class="detail-panel" id="panel-detail-employees">
          ${Object.keys(empMap).length > 0 ? `
            <div class="data-grid">
              <table>
                <thead><tr><th>Code</th><th>Employee</th><th style="text-align:right">Earnings</th><th style="text-align:right">Deductions</th><th style="text-align:right">Company</th><th style="text-align:right">Nett Pay</th><th>Indicators</th></tr></thead>
                <tbody>${empRows}</tbody>
              </table>
            </div>
          ` : UI.emptyState(icon('users',32), 'No Employee Results', 'Execute the payroll run to generate results')}
        </div>

        <div class="detail-panel" id="panel-detail-results">
          ${results.length > 0 ? `
            <div class="data-grid">
              <table>
                <thead><tr><th>Code</th><th>Employee</th><th>Head Code</th><th>Salary Head</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>${lineItemRows}</tbody>
              </table>
            </div>
          ` : UI.emptyState(icon('fileText',32), 'No Line Items', 'Execute the payroll run to generate results')}
        </div>

        ${scoaEntries.length > 0 ? `
          <div class="detail-panel" id="panel-detail-scoa">
            <h4 style="margin:0 0 12px;font-size:14px">mSCOA Segment Allocation Summary</h4>
            <div class="data-grid">
              <table>
                <thead><tr><th>mSCOA Item ID</th><th>Transaction Type</th><th>Transactions</th><th style="text-align:right">Total Amount</th></tr></thead>
                <tbody>${scoaEntries.map(s => `
                  <tr>
                    <td><strong>${s.scoa_item_id}</strong></td>
                    <td><span class="badge badge-${s.type === 'EARNING' ? 'success' : s.type === 'DEDUCTION' ? 'danger' : 'info'}">${s.type}</span></td>
                    <td>${s.count}</td>
                    <td style="text-align:right;font-weight:500">${formatCurrency(s.total)}</td>
                  </tr>
                `).join('')}</tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <div class="detail-panel" id="panel-detail-gl">
          <div id="gl-journals-container">
            <div style="text-align:center;padding:32px;color:var(--text-muted)">
              ${icon('book',24)}
              <p style="margin:8px 0 0">Click to load GL journal entries for this run</p>
              <button class="btn btn-primary btn-sm" id="btn-load-gl-journals" style="margin-top:12px">${icon('refresh',14)} Load GL Journals</button>
            </div>
          </div>
        </div>

        ${errors.length > 0 ? `
          <div class="detail-panel" id="panel-detail-errors">
            <div class="data-grid">
              <table>
                <thead><tr><th>Code</th><th>Employee</th><th>Severity</th><th>Type</th><th>Message</th></tr></thead>
                <tbody>${errorRows}</tbody>
              </table>
            </div>
          </div>
        ` : ''}
      `;

      body.querySelectorAll('[data-detail-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
          body.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
          body.querySelectorAll('.detail-panel').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const panel = body.querySelector(`#panel-${tab.dataset.detailTab}`);
          if (panel) panel.classList.add('active');
        });
      });

      const execBtn = document.getElementById('detail-execute-btn') || document.getElementById('detail-rerun-btn');
      if (execBtn) execBtn.addEventListener('click', () => { UI.closeModal(); this.executeRun(id); });

      const promoteBtn = document.getElementById('detail-promote-btn');
      if (promoteBtn) promoteBtn.addEventListener('click', () => { UI.closeModal(); this.promoteRun(id); });

      const lockBtn = document.getElementById('detail-lock-btn');
      if (lockBtn) lockBtn.addEventListener('click', () => { UI.closeModal(); this.lockRun(id); });

      const unlockBtn = document.getElementById('detail-unlock-btn');
      if (unlockBtn) unlockBtn.addEventListener('click', () => { UI.closeModal(); this.unlockRun(id); });

      const approveBtn = document.getElementById('detail-approve-btn');
      if (approveBtn) approveBtn.addEventListener('click', () => { UI.closeModal(); this.approveRun(id); });

      const glPostBtn = document.getElementById('detail-glpost-btn');
      if (glPostBtn) glPostBtn.addEventListener('click', () => { UI.closeModal(); this.glPostRun(id); });

      const voidBtn = document.getElementById('detail-void-btn');
      if (voidBtn) voidBtn.addEventListener('click', () => { UI.closeModal(); this.voidRun(id); });

      const prorateBtn = document.getElementById('detail-prorate-btn');
      if (prorateBtn) prorateBtn.addEventListener('click', () => { UI.closeModal(); this.prorateRun(id); });

      const singleEmpBtn = document.getElementById('detail-single-emp-btn');
      if (singleEmpBtn) singleEmpBtn.addEventListener('click', () => { UI.closeModal(); this.showSingleEmployeeRunModal(id); });

      const glLoadBtn = document.getElementById('btn-load-gl-journals');
      if (glLoadBtn) glLoadBtn.addEventListener('click', () => this.loadGLJournals(id));

      body.querySelectorAll('[data-emp-id]').forEach(row => {
        row.addEventListener('click', () => {
          const empId = row.dataset.empId;
          this.showPayslipPreview(id, parseInt(empId));
        });
      });

    } catch (err) {
      const body = overlay.querySelector('.modal-body');
      body.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load run details: ${err.message}</div>`;
    }
  },

  async renderTaxTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading tax tables...</div>';
    try {
      const res = await api('/payroll/tax-tables');
      const data = res.data;

      const bracketRows = (data.brackets || []).map(b => `
        <tr>
          <td>${b.bracket_number}</td>
          <td style="text-align:right">${formatCurrency(b.min_income)}</td>
          <td style="text-align:right">${formatCurrency(b.max_income)}</td>
          <td style="text-align:right">${b.rate}%</td>
          <td style="text-align:right">${formatCurrency(b.base_tax)}</td>
        </tr>
      `).join('');

      const rebateRows = (data.rebates || []).map(r => `
        <tr>
          <td>${r.rebate_type}</td>
          <td>${r.age_threshold > 0 ? r.age_threshold + '+' : 'All'}</td>
          <td style="text-align:right">${formatCurrency(r.amount)}</td>
          <td style="text-align:right">${formatCurrency(parseFloat(r.amount) / 12)}</td>
        </tr>
      `).join('');

      const thresholdRows = (data.thresholds || []).map(t => `
        <tr>
          <td>${t.threshold_type || t.age_group || '-'}</td>
          <td style="text-align:right">${formatCurrency(t.amount)}</td>
          <td style="text-align:right">${formatCurrency(parseFloat(t.amount) / 12)}</td>
        </tr>
      `).join('');

      const uif = data.uif;
      const sdl = data.sdl;

      el.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <h3 style="margin:0;font-size:16px">SARS Tax Tables - Tax Year ${data.tax_year}</h3>
          <span class="badge badge-info">Current Year</span>
          <a href="#" onclick="event.preventDefault();document.querySelector('[data-module=settings]').click();setTimeout(()=>document.querySelector('[data-tab=tax]')?.click(),100)" style="font-size:12px;color:var(--accent);margin-left:auto">${icon('settings',12)} Manage in Settings</a>
        </div>

        ${UI.statCards([
          { label: 'UIF Rate (Employee)', value: uif ? `${uif.employee_rate}%` : 'N/A' },
          { label: 'UIF Rate (Employer)', value: uif ? `${uif.employer_rate}%` : 'N/A' },
          { label: 'UIF Ceiling', value: uif ? formatCurrency(uif.ceiling) : 'N/A' },
          { label: 'SDL Rate', value: sdl ? `${sdl.rate}%` : 'N/A' },
          { label: 'SDL Threshold', value: sdl ? formatCurrency(sdl.threshold) : 'N/A' }
        ])}

        <h4 style="margin:20px 0 8px;font-size:14px">Income Tax Brackets</h4>
        <div class="data-grid" style="margin-bottom:20px">
          <table>
            <thead><tr><th>#</th><th style="text-align:right">From</th><th style="text-align:right">To</th><th style="text-align:right">Rate</th><th style="text-align:right">Base Tax</th></tr></thead>
            <tbody>${bracketRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No brackets configured</td></tr>'}</tbody>
          </table>
        </div>

        <h4 style="margin:20px 0 8px;font-size:14px">Tax Rebates</h4>
        <div class="data-grid" style="margin-bottom:20px">
          <table>
            <thead><tr><th>Type</th><th>Age</th><th style="text-align:right">Annual</th><th style="text-align:right">Monthly</th></tr></thead>
            <tbody>${rebateRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No rebates configured</td></tr>'}</tbody>
          </table>
        </div>

        <h4 style="margin:20px 0 8px;font-size:14px">Tax Thresholds</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Type</th><th style="text-align:right">Annual</th><th style="text-align:right">Monthly</th></tr></thead>
            <tbody>${thresholdRows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">No thresholds configured</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load tax tables: ${err.message}</div>`;
    }
  },

  async renderPaymentsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading approved runs...</div>';
    try {
      const runsRes = await api('/payroll/runs?limit=50');
      const runs = (runsRes.data || []).filter(r => r.status === 'APPROVED');

      if (runs.length === 0) {
        el.innerHTML = UI.emptyState(icon('creditCard',32), 'No Approved Runs', 'Approve a FINAL payroll run to manage payments here');
        return;
      }

      const selectedRun = this._paySelectedRun || runs[0].id;
      const runOptions = runs.map(r => `<option value="${r.id}" ${r.id == selectedRun ? 'selected':''}>Run #${r.id} - ${r.cycle_name || 'Payroll'} P${r.period_number || '?'} (${r.tax_year || ''}) - ${formatCurrency(r.total_nett)}</option>`).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div style="display:flex;gap:12px;align-items:center">
            <select id="pay-run-select" class="form-control" style="width:420px">${runOptions}</select>
            <button class="btn" id="pay-generate-batches">${icon('plus',13)} Generate Batches</button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn" id="pay-review-all">${icon('check',13)} Review All</button>
            <button class="btn btn-primary" id="pay-authorize-all">${icon('shield',13)} Authorize All</button>
            <button class="btn" id="pay-download-all">${icon('download',13)} Download All</button>
          </div>
        </div>
        <div id="pay-stats"></div>
        <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap" id="pay-report-btns">
          <button class="btn" data-report="nett-pay-register">${icon('fileText',13)} Nett Pay Register</button>
          <button class="btn" data-report="deduction-register">${icon('fileText',13)} Deduction Register</button>
          <button class="btn" data-report="third-party-summary">${icon('users',13)} Third-Party Summary</button>
          <button class="btn" data-report="bank-recon">${icon('shield',13)} Bank Recon</button>
          <button class="btn" data-report="variance">${icon('barChart',13)} Variance Report</button>
        </div>
        <div id="pay-batches-grid"></div>
      `;

      document.getElementById('pay-run-select')?.addEventListener('change', (e) => {
        this._paySelectedRun = e.target.value;
        this._loadPaymentBatches(e.target.value);
      });

      document.getElementById('pay-generate-batches')?.addEventListener('click', async () => {
        const runId = document.getElementById('pay-run-select')?.value;
        if (!runId) return;
        try {
          await apiPost(`/payroll/runs/${runId}/generate-batches`);
          UI.toast('success', 'Batches Generated', 'Payment batches have been created');
          this._loadPaymentBatches(runId);
        } catch (err) { UI.toast('error', 'Error', err.message || 'Failed to generate batches'); }
      });

      document.getElementById('pay-review-all')?.addEventListener('click', async () => {
        const batches = this._payBatches || [];
        const pending = batches.filter(b => b.status === 'PENDING_REVIEW');
        if (pending.length === 0) { UI.toast('info', 'Nothing to Review', 'No batches in PENDING REVIEW status'); return; }
        let reviewed = 0;
        for (const b of pending) {
          try {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${b.id}/review`, { method: 'PUT' });
            if (r.ok) reviewed++;
          } catch(e) {}
        }
        UI.toast('success', 'All Reviewed', `${reviewed} batch(es) marked as reviewed`);
        this._loadPaymentBatches(document.getElementById('pay-run-select')?.value);
      });

      document.getElementById('pay-authorize-all')?.addEventListener('click', async () => {
        const batches = this._payBatches || [];
        const pending = batches.filter(b => b.status === 'PENDING_REVIEW');
        let autoReviewed = 0;
        for (const b of pending) {
          try {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${b.id}/review`, { method: 'PUT' });
            if (r.ok) autoReviewed++;
          } catch(e) {}
        }
        if (autoReviewed > 0) await this._loadPaymentBatches(document.getElementById('pay-run-select')?.value);
        const refreshed = this._payBatches || [];
        const toAuth = refreshed.filter(b => b.status === 'REVIEWED');
        if (toAuth.length === 0) { UI.toast('info', 'Nothing to Authorize', 'No batches in REVIEWED status'); return; }
        let authorized = 0;
        for (const b of toAuth) {
          try {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${b.id}/authorize`, { method: 'PUT' });
            if (r.ok) authorized++;
          } catch(e) {}
        }
        UI.toast('success', 'All Authorized', `${autoReviewed > 0 ? autoReviewed + ' auto-reviewed, ' : ''}${authorized} batch(es) authorized`);
        this._loadPaymentBatches(document.getElementById('pay-run-select')?.value);
      });

      document.getElementById('pay-download-all')?.addEventListener('click', () => {
        const runId = document.getElementById('pay-run-select')?.value;
        if (!runId) return;
        const batches = this._payBatches || [];
        const eligible = batches.filter(b => ['REVIEWED','AUTHORIZED','SUBMITTED','PAID'].includes(b.status));
        if (eligible.length === 0) {
          UI.toast('info', 'Nothing to Download', 'No batches are eligible for download (must be at least Reviewed)');
          return;
        }
        window.open(`${API_BASE}/payroll/runs/${runId}/download-all-eft`, '_blank');
      });

      document.getElementById('pay-report-btns')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-report]');
        if (!btn) return;
        const runId = document.getElementById('pay-run-select')?.value;
        if (!runId) return;
        const reportType = btn.dataset.report;
        try {
          const res = await api(`/payroll/runs/${runId}/payment-reports/${reportType}`);
          this._showPaymentReport(res);
        } catch (err) { alert(err.message || 'Failed to load report'); }
      });

      this._loadPaymentBatches(selectedRun);
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load: ${err.message}</div>`;
    }
  },

  async _loadPaymentBatches(runId) {
    const statsEl = document.getElementById('pay-stats');
    const gridEl = document.getElementById('pay-batches-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading batches...</div>';

    try {
      const res = await api(`/payroll/runs/${runId}/payment-batches`);
      const batches = res.data || [];
      this._payBatches = batches;

      const statusCounts = {};
      const statusAmounts = {};
      for (const b of batches) {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
        statusAmounts[b.status] = (statusAmounts[b.status] || 0) + parseFloat(b.total_amount);
      }

      if (statsEl) {
        statsEl.innerHTML = UI.statCards([
          { label: `Pending Review (${statusCounts['PENDING_REVIEW']||0})`, value: formatCurrency(statusAmounts['PENDING_REVIEW']||0), color: '#F59E0B' },
          { label: `Reviewed (${statusCounts['REVIEWED']||0})`, value: formatCurrency(statusAmounts['REVIEWED']||0), color: '#3B82F6' },
          { label: `Authorized (${statusCounts['AUTHORIZED']||0})`, value: formatCurrency(statusAmounts['AUTHORIZED']||0), color: '#8B5CF6' },
          { label: `Submitted (${statusCounts['SUBMITTED']||0})`, value: formatCurrency(statusAmounts['SUBMITTED']||0), color: '#0EA5E9' },
          { label: `Paid (${statusCounts['PAID']||0})`, value: formatCurrency(statusAmounts['PAID']||0), color: '#10B981' },
        ]);
      }

      if (batches.length === 0) {
        gridEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted)">${icon('creditCard',24)}<p style="margin:8px 0 0">No payment batches for this run.</p><p style="font-size:12px;margin:4px 0 0">Click "Generate Batches" to create payment batches.</p></div>`;
        return;
      }

      const statusBadge = (s) => {
        const map = { PENDING_REVIEW:'badge-warning', REVIEWED:'badge-info', AUTHORIZED:'badge-primary', SUBMITTED:'badge-info', PAID:'badge-success' };
        return `<span class="badge ${map[s]||'badge-secondary'}">${s.replace(/_/g,' ')}</span>`;
      };

      const rows = batches.map(b => {
        let actions = `<button class="action-btn" data-action="detail" data-id="${b.id}" title="View Detail">${icon('eye',14)}</button> `;
        if (b.status === 'PENDING_REVIEW') {
          actions += `<button class="action-btn" data-action="review" data-id="${b.id}" title="Review">${icon('check',14)}</button>`;
        } else if (b.status === 'REVIEWED') {
          actions += `<button class="action-btn" data-action="authorize" data-id="${b.id}" title="Authorize" style="color:var(--primary)">${icon('shield',14)}</button>`;
          actions += ` <button class="action-btn" data-action="eft" data-id="${b.id}" title="Download EFT">${icon('download',14)}</button>`;
        } else if (b.status === 'AUTHORIZED') {
          actions += `<button class="action-btn" data-action="eft" data-id="${b.id}" title="Download EFT">${icon('download',14)}</button>`;
          actions += ` <button class="action-btn" data-action="mark-paid" data-id="${b.id}" title="Mark Paid" style="color:var(--success)">${icon('check',14)}</button>`;
        } else if (b.status === 'SUBMITTED') {
          actions += `<span style="font-size:11px;font-family:monospace;color:var(--text-muted)">${b.h2h_reference || ''}</span> `;
          actions += `<button class="action-btn" data-action="mark-paid" data-id="${b.id}" title="Mark Paid" style="color:var(--success)">${icon('check',14)}</button>`;
          actions += ` <button class="action-btn" data-action="eft" data-id="${b.id}" title="Download EFT">${icon('download',14)}</button>`;
        } else if (b.status === 'PAID') {
          actions += `<span style="font-size:11px;color:var(--success)">${icon('check',12)} Paid</span>`;
          actions += ` <button class="action-btn" data-action="eft" data-id="${b.id}" title="Download EFT">${icon('download',14)}</button>`;
        }
        return `<tr style="cursor:pointer" data-batch-id="${b.id}">
          <td><span class="badge ${b.batch_type==='EMPLOYEE_NETT'?'badge-primary':'badge-info'}">${b.batch_type.replace(/_/g,' ')}</span></td>
          <td>${b.vendor_name || '-'}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(b.total_amount)}</td>
          <td style="text-align:center">${b.employee_count}</td>
          <td>${statusBadge(b.status)}</td>
          <td>${b.payment_method === 'HOST_TO_HOST' ? 'H2H' : 'Manual EFT'}</td>
          <td>${b.eft_file_generated ? icon('check',12) : ''}</td>
          <td>${actions}</td>
        </tr>`;
      }).join('');

      gridEl.innerHTML = `
        <div class="data-grid">
          <table>
            <thead><tr>
              <th>Type</th><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:center">Employees</th>
              <th>Status</th><th>Method</th><th>EFT</th><th>Actions</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;

      gridEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        try {
          if (action === 'detail') {
            this._showBatchDetail(id);
            return;
          }
          if (action === 'review') {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${id}/review`, { method: 'PUT' });
            if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error?.message || 'Review failed'); }
            UI.toast('success', 'Reviewed', 'Batch marked as reviewed');
          } else if (action === 'authorize') {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${id}/authorize`, { method: 'PUT' });
            if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error?.message || 'Authorize failed'); }
            UI.toast('success', 'Authorized', 'Batch authorized for payment');
          } else if (action === 'mark-paid') {
            const r = await fetch(`${API_BASE}/payroll/payment-batches/${id}/mark-paid`, { method: 'PUT' });
            if (!r.ok) { const j = await r.json().catch(()=>({})); throw new Error(j.error?.message || 'Mark paid failed'); }
            UI.toast('success', 'Paid', 'Batch marked as paid');
          } else if (action === 'eft') {
            window.open(`${API_BASE}/payroll/payment-batches/${id}/eft-file`, '_blank');
            return;
          }
          this._loadPaymentBatches(document.getElementById('pay-run-select')?.value);
        } catch (err) { UI.toast('error', 'Error', err.message || 'Action failed'); }
      });
    } catch (err) {
      gridEl.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load batches: ${err.message}</div>`;
    }
  },

  async _showBatchDetail(batchId) {
    try {
      const res = await api(`/payroll/payment-batches/${batchId}/detail?limit=100`);
      const b = res.batch;
      const emps = res.employees || [];
      const pg = res.pagination;
      const isNett = b.batch_type === 'EMPLOYEE_NETT';

      const statusMap = { PENDING_REVIEW:'badge-warning', REVIEWED:'badge-info', AUTHORIZED:'badge-primary', SUBMITTED:'badge-info', PAID:'badge-success' };
      const statusLabel = (b.status || '').replace(/_/g, ' ');

      let empRows = '';
      if (isNett) {
        empRows = emps.map((e, i) => `<tr>
          <td style="text-align:center;color:var(--text-muted)">${i+1}</td>
          <td style="font-family:monospace;font-size:12px">${e.employee_code || '-'}</td>
          <td>${e.first_name} ${e.surname}</td>
          <td>${e.department_name || '-'}</td>
          <td style="text-align:right">${formatCurrency(e.total_earnings)}</td>
          <td style="text-align:right;color:var(--danger)">${formatCurrency(e.total_deductions)}</td>
          <td style="text-align:right;font-weight:700">${formatCurrency(e.nett_pay)}</td>
          <td style="font-size:11px">${e.bank_name || '-'}</td>
          <td style="font-family:monospace;font-size:11px">${e.account_number ? '***' + e.account_number.slice(-4) : '-'}</td>
        </tr>`).join('');
      } else {
        empRows = emps.map((e, i) => `<tr>
          <td style="text-align:center;color:var(--text-muted)">${i+1}</td>
          <td style="font-family:monospace;font-size:12px">${e.employee_code || '-'}</td>
          <td>${e.first_name} ${e.surname}</td>
          <td>${e.department_name || '-'}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(e.amount)}</td>
        </tr>`).join('');
      }

      const batchSummary = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Batch Type</div>
            <div style="font-weight:600">${b.batch_type.replace(/_/g,' ')}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Description</div>
            <div style="font-weight:600">${b.vendor_name || '-'}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Total Amount</div>
            <div style="font-weight:700;font-size:16px">${formatCurrency(b.total_amount)}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Employees</div>
            <div style="font-weight:600">${b.employee_count}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Status</div>
            <div><span class="badge ${statusMap[b.status]||'badge-secondary'}">${statusLabel}</span></div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:11px;color:var(--text-muted)">Payment Method</div>
            <div style="font-weight:600">${b.payment_method === 'HOST_TO_HOST' ? 'Host-to-Host' : 'Manual EFT'}</div>
          </div>
        </div>
      `;

      const nettHeaders = '<th style="text-align:center">#</th><th>Code</th><th>Employee</th><th>Department</th><th style="text-align:right">Earnings</th><th style="text-align:right">Deductions</th><th style="text-align:right">Nett Pay</th><th>Bank</th><th>Account</th>';
      const thirdHeaders = '<th style="text-align:center">#</th><th>Code</th><th>Employee</th><th>Department</th><th style="text-align:right">Amount</th>';

      const content = `
        ${batchSummary}
        ${b.reviewed_at ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${icon('check',12)} Reviewed: ${new Date(b.reviewed_at).toLocaleString('en-ZA')}</div>` : ''}
        ${b.authorized_at ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${icon('shield',12)} Authorized: ${new Date(b.authorized_at).toLocaleString('en-ZA')}</div>` : ''}
        ${b.h2h_reference ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${icon('link',12)} H2H Reference: <strong>${b.h2h_reference}</strong></div>` : ''}
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Showing ${emps.length} of ${pg.total} employee(s)</div>
        <div class="data-grid" style="max-height:400px;overflow:auto">
          <table>
            <thead><tr>${isNett ? nettHeaders : thirdHeaders}</tr></thead>
            <tbody>${empRows}</tbody>
          </table>
        </div>
      `;

      let footerBtns = '<button class="btn" data-close-modal>Close</button>';
      if (['REVIEWED', 'AUTHORIZED', 'SUBMITTED', 'PAID'].includes(b.status)) {
        footerBtns += ` <button class="btn" onclick="window.open('${API_BASE}/payroll/payment-batches/${batchId}/eft-file','_blank')">${icon('download',13)} Download EFT File</button>`;
      }
      footerBtns += ` <button class="btn btn-primary" onclick="window.print()">${icon('fileText',13)} Print Report</button>`;

      UI.modal({
        title: `Payment Batch Detail - ${b.vendor_name || b.batch_type.replace(/_/g,' ')}`,
        size: 'xl',
        content,
        footer: footerBtns
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message || 'Failed to load batch detail');
    }
  },

  _showPaymentReport(res) {
    const title = res.title || 'Report';
    const data = res.data;
    const reportType = res.report_type;
    let content = '';

    if (reportType === 'bank-recon') {
      const d = data;
      content = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:12px;color:var(--text-muted)">Run Nett Total</div>
            <div style="font-size:18px;font-weight:700">${formatCurrency(d.run_nett_total)}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:12px;color:var(--text-muted)">EFT Batch Total</div>
            <div style="font-size:18px;font-weight:700">${formatCurrency(d.eft_batch_total)}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:12px;color:var(--text-muted)">Results Nett Total</div>
            <div style="font-size:18px;font-weight:700">${formatCurrency(d.results_nett_total)}</div>
          </div>
          <div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
            <div style="font-size:12px;color:var(--text-muted)">Variance</div>
            <div style="font-size:18px;font-weight:700;color:${d.variance === 0 ? 'var(--success)':'var(--danger)'}">${formatCurrency(d.variance)}</div>
          </div>
        </div>
        <div class="data-grid"><table>
          <thead><tr><th>Metric</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            <tr><td>Total Employees</td><td style="text-align:right">${d.employees_total}</td></tr>
            <tr><td>Employees with Bank Details</td><td style="text-align:right">${d.employees_with_bank}</td></tr>
            <tr><td>Employees without Bank Details</td><td style="text-align:right;color:${d.employees_without_bank > 0 ? 'var(--danger)':'inherit'}">${d.employees_without_bank}</td></tr>
          </tbody>
        </table></div>`;
    } else if (reportType === 'variance') {
      if (!res.has_previous) {
        content = '<div style="text-align:center;padding:24px;color:var(--text-muted)">No previous period to compare against.</div>';
      } else {
        const rows = (data||[]).map(r => `<tr>
          <td>${r.field}</td>
          <td style="text-align:right">${typeof r.current === 'number' && r.field !== 'Employee Count' ? formatCurrency(r.current) : r.current}</td>
          <td style="text-align:right">${typeof r.previous === 'number' && r.field !== 'Employee Count' ? formatCurrency(r.previous) : r.previous}</td>
          <td style="text-align:right;color:${r.variance > 0 ? 'var(--danger)':r.variance < 0 ? 'var(--success)':'inherit'};font-weight:600">
            ${typeof r.variance === 'number' && r.field !== 'Employee Count' ? formatCurrency(r.variance) : r.variance}
          </td>
          <td style="text-align:right">${r.variance_pct !== null ? r.variance_pct + '%' : '-'}</td>
        </tr>`).join('');
        content = `<div class="data-grid"><table>
          <thead><tr><th>Metric</th><th style="text-align:right">Current</th><th style="text-align:right">Previous</th><th style="text-align:right">Variance</th><th style="text-align:right">%</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
      }
    } else {
      const arr = Array.isArray(data) ? data : [];
      if (arr.length === 0) {
        content = '<div style="text-align:center;padding:24px;color:var(--text-muted)">No data available.</div>';
      } else {
        const cols = Object.keys(arr[0]);
        const headers = cols.map(c => `<th>${c.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`).join('');
        const rows = arr.map(row => '<tr>' + cols.map(c => {
          const v = row[c];
          if (typeof v === 'number' && (c.includes('amount') || c.includes('gross') || c.includes('nett') || c.includes('deductions')))
            return `<td style="text-align:right;font-weight:600">${formatCurrency(v)}</td>`;
          return `<td>${v ?? '-'}</td>`;
        }).join('') + '</tr>').join('');
        content = `<div class="data-grid"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
      }
    }

    UI.modal({ title, content: `<div style="max-height:70vh;overflow:auto">${content}</div>`, size: 'large' });
  },

  async renderGLSubLedgerTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading payroll runs...</div>';
    try {
      const runsRes = await api('/payroll/runs?limit=50');
      const runs = (runsRes.data || []).filter(r => ['COMPLETED','LOCKED','APPROVED'].includes(r.status) && !['TRIAL','ADHOC_TRIAL'].includes(r.run_type));

      if (runs.length === 0) {
        el.innerHTML = UI.emptyState(icon('book',32), 'No GL Postings', 'Complete a FINAL payroll run and post to GL to see postings here');
        return;
      }

      const runOptions = runs.map(r => `<option value="${r.id}">Run #${r.id} - ${r.cycle_name || 'Payroll'} - Period ${r.period_number || '?'} (${r.tax_year || ''}) - ${r.status}</option>`).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div style="display:flex;gap:12px;align-items:center">
            <select id="gl-run-select" class="form-control" style="width:400px">${runOptions}</select>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn${this._glView !== 'subledger' && this._glView !== 'reconcile' ? ' btn-primary' : ''}" id="gl-view-gl">GL Postings (Rolled Up)</button>
            <button class="btn${this._glView === 'subledger' ? ' btn-primary' : ''}" id="gl-view-sl">Sub-Ledger (Detailed)</button>
            <button class="btn${this._glView === 'reconcile' ? ' btn-primary' : ''}" id="gl-view-recon" style="border-color:#c9a84c;color:#c9a84c">${icon('shield',13)} Reconcile</button>
          </div>
        </div>
        <div id="gl-sl-content" style="margin-top:12px"></div>
      `;

      const loadData = () => {
        const runId = document.getElementById('gl-run-select')?.value;
        if (!runId) return;
        if (this._glView === 'subledger') {
          this.loadSubLedgerView(runId);
        } else if (this._glView === 'reconcile') {
          this.loadReconcileView(runId);
        } else {
          this.loadGLPostingsView(runId);
        }
      };

      document.getElementById('gl-run-select')?.addEventListener('change', loadData);
      document.getElementById('gl-view-gl')?.addEventListener('click', () => {
        this._glView = 'gl';
        document.getElementById('gl-view-gl')?.classList.add('btn-primary');
        document.getElementById('gl-view-sl')?.classList.remove('btn-primary');
        document.getElementById('gl-view-recon')?.classList.remove('btn-primary');
        loadData();
      });
      document.getElementById('gl-view-sl')?.addEventListener('click', () => {
        this._glView = 'subledger';
        document.getElementById('gl-view-sl')?.classList.add('btn-primary');
        document.getElementById('gl-view-gl')?.classList.remove('btn-primary');
        document.getElementById('gl-view-recon')?.classList.remove('btn-primary');
        loadData();
      });
      document.getElementById('gl-view-recon')?.addEventListener('click', () => {
        this._glView = 'reconcile';
        document.getElementById('gl-view-recon')?.classList.add('btn-primary');
        document.getElementById('gl-view-gl')?.classList.remove('btn-primary');
        document.getElementById('gl-view-sl')?.classList.remove('btn-primary');
        loadData();
      });

      if (!this._glView) this._glView = 'gl';
      loadData();
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load: ${err.message}</div>`;
    }
  },

  async loadGLPostingsView(runId) {
    const container = document.getElementById('gl-sl-content');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading GL postings...</div>';

    try {
      const res = await api(`/payroll/runs/${runId}/gl-journals`);
      const journals = res.data || [];
      const glSummary = res.gl_summary || [];
      const totals = res.totals || {};

      if (journals.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:32px;color:var(--text-muted)">
            ${icon('book',24)}
            <p style="margin:8px 0 0">No GL journal entries posted for this run.</p>
            <p style="font-size:12px;margin:4px 0 0">Click "GL Post" on a completed FINAL run to generate journal entries.</p>
          </div>
        `;
        return;
      }

      const summaryRows = glSummary.map(g => `
        <tr>
          <td><strong style="font-family:monospace">${g.scoa_item_id || 'UNMAPPED'}</strong></td>
          <td style="font-size:12px">${g.scoa_fund_id || '-'}</td>
          <td style="font-size:12px">${g.scoa_function_id || '-'}</td>
          <td style="font-size:12px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(g.descriptions||'').replace(/"/g,'&quot;')}">${g.descriptions || '-'}</td>
          <td style="text-align:center">${g.entry_count}</td>
          <td style="text-align:right;color:var(--danger);font-weight:600">${g.total_debit > 0 ? formatCurrency(g.total_debit) : ''}</td>
          <td style="text-align:right;color:var(--success);font-weight:600">${g.total_credit > 0 ? formatCurrency(g.total_credit) : ''}</td>
        </tr>
      `).join('');

      const detailRows = journals.map(j => `
        <tr style="font-size:12px">
          <td>${j.journal_date?.split('T')[0] || '-'}</td>
          <td><strong style="font-family:monospace">${j.scoa_item_id || '-'}</strong></td>
          <td>${j.scoa_fund_id || '-'}</td>
          <td>${j.scoa_function_id || '-'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(j.description||'').replace(/"/g,'&quot;')}">${j.description || '-'}</td>
          <td style="font-family:monospace;font-size:11px">${j.reference || '-'}</td>
          <td style="text-align:right;color:var(--danger);font-weight:500">${parseFloat(j.debit_amount) > 0 ? formatCurrency(j.debit_amount) : ''}</td>
          <td style="text-align:right;color:var(--success);font-weight:500">${parseFloat(j.credit_amount) > 0 ? formatCurrency(j.credit_amount) : ''}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        ${UI.statCards([
          { label: 'Total Debits', value: formatCurrency(totals.total_debits), color: '#EF4444' },
          { label: 'Total Credits', value: formatCurrency(totals.total_credits), color: '#10B981' },
          { label: 'Balance Check', value: totals.balanced ? 'BALANCED' : 'UNBALANCED', color: totals.balanced ? '#10B981' : '#EF4444' },
          { label: 'Journal Entries', value: totals.journal_count, color: '#4F6AFF' }
        ])}

        <h4 style="margin:16px 0 8px;font-size:14px;display:flex;align-items:center;gap:8px">
          <span class="badge badge-success">GL Summary - Rolled Up by mSCOA Account</span>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px">Best-practice roll-up for AG compliance (GRAP / mSCOA)</span>
        </h4>
        <div class="data-grid" style="margin-bottom:16px">
          <table>
            <thead><tr><th>mSCOA Item</th><th>Fund</th><th>Function</th><th>Description</th><th style="text-align:center">Entries</th><th style="text-align:right">Debit (Dr)</th><th style="text-align:right">Credit (Cr)</th></tr></thead>
            <tbody>${summaryRows}</tbody>
            <tfoot>
              <tr style="font-weight:700;border-top:2px solid var(--border)">
                <td colspan="5" style="text-align:right">GL Totals</td>
                <td style="text-align:right;color:var(--danger)">${formatCurrency(totals.total_debits)}</td>
                <td style="text-align:right;color:var(--success)">${formatCurrency(totals.total_credits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h4 style="margin:16px 0 8px;font-size:14px;display:flex;align-items:center;gap:8px">
          <span class="badge badge-info">GL Detail - All Journal Entries</span>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px">(${journals.length} entries)</span>
        </h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Date</th><th>mSCOA Item</th><th>Fund</th><th>Function</th><th>Description</th><th>Reference</th><th style="text-align:right">Debit (Dr)</th><th style="text-align:right">Credit (Cr)</th></tr></thead>
            <tbody>${detailRows}</tbody>
            <tfoot>
              <tr style="font-weight:700;border-top:2px solid var(--border)">
                <td colspan="6" style="text-align:right">Totals</td>
                <td style="text-align:right;color:var(--danger)">${formatCurrency(totals.total_debits)}</td>
                <td style="text-align:right;color:var(--success)">${formatCurrency(totals.total_credits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load GL postings: ${err.message}</div>`;
    }
  },

  _slPage: 1,
  _slRunId: null,

  async loadSubLedgerView(runId, page) {
    const container = document.getElementById('gl-sl-content');
    if (!container) return;
    this._slRunId = runId;
    this._slPage = page || 1;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading sub-ledger...</div>';

    try {
      const res = await api(`/payroll/runs/${runId}/sub-ledger?page=${this._slPage}&limit=50`);
      const byEmployee = res.by_employee || [];
      const byAccount = res.by_account || [];
      const totals = res.totals || {};
      const pg = res.pagination || {};

      if (byEmployee.length === 0 && this._slPage === 1) {
        container.innerHTML = UI.emptyState(icon('fileText',32), 'No Sub-Ledger Data', 'Execute a payroll run to generate sub-ledger entries');
        return;
      }

      const accountRows = byAccount.map(a => `
        <tr>
          <td><strong style="font-family:monospace">${a.scoa_item_id || 'UNMAPPED'}</strong></td>
          <td style="font-size:12px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(a.heads||'').replace(/"/g,'&quot;')}">${a.heads || '-'}</td>
          <td style="text-align:center">${a.line_count}</td>
          <td style="text-align:right;color:var(--danger);font-weight:600">${a.total_debit > 0 ? formatCurrency(a.total_debit) : ''}</td>
          <td style="text-align:right;color:var(--success);font-weight:600">${a.total_credit > 0 ? formatCurrency(a.total_credit) : ''}</td>
        </tr>
      `).join('');

      const totalDebitAcc = byAccount.reduce((s, a) => s + a.total_debit, 0);
      const totalCreditAcc = byAccount.reduce((s, a) => s + a.total_credit, 0);

      const empSections = byEmployee.map(emp => {
        const nett = emp.total_earnings - emp.total_deductions;
        return `
          <details class="sl-employee-detail" data-emp-id="${emp.employee_id}" data-run-id="${runId}" style="margin-bottom:8px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
            <summary style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;font-size:13px">
              <div style="display:flex;align-items:center;gap:12px">
                <strong>${emp.employee_name}</strong>
                <span style="color:var(--text-muted);font-size:11px">${emp.employee_number || ''}</span>
                <span style="color:var(--text-muted);font-size:11px">${emp.department_name || ''}</span>
              </div>
              <div style="display:flex;gap:16px;font-size:12px">
                <span style="color:var(--success)">Gross: ${formatCurrency(emp.total_earnings)}</span>
                <span style="color:var(--danger)">Deductions: ${formatCurrency(emp.total_deductions)}</span>
                <span style="font-weight:700">Nett: ${formatCurrency(nett)}</span>
              </div>
            </summary>
            <div class="sl-emp-entries" style="padding:0 16px 12px">
              <div class="loading" style="padding:12px"><div class="spinner" style="width:16px;height:16px"></div> Loading entries...</div>
            </div>
          </details>
        `;
      }).join('');

      let paginationHtml = '';
      if (pg.pages > 1) {
        const pages = [];
        for (let i = 1; i <= pg.pages; i++) {
          pages.push(`<button class="btn${i === pg.page ? ' btn-primary' : ''}" data-sl-page="${i}" style="min-width:36px;padding:4px 8px">${i}</button>`);
        }
        paginationHtml = `<div style="display:flex;gap:4px;margin-top:12px;align-items:center;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text-muted);margin-right:8px">Page ${pg.page} of ${pg.pages} (${pg.total} employees)</span>
          ${pg.page > 1 ? `<button class="btn" data-sl-page="${pg.page-1}" style="padding:4px 8px">${icon('chevronRight',12)} Prev</button>` : ''}
          ${pages.join('')}
          ${pg.page < pg.pages ? `<button class="btn" data-sl-page="${pg.page+1}" style="padding:4px 8px">Next ${icon('chevronRight',12)}</button>` : ''}
        </div>`;
      }

      container.innerHTML = `
        ${UI.statCards([
          { label: 'Employees', value: formatNumber(totals.total_employees), color: '#4F6AFF' },
          { label: 'Total Earnings', value: formatCurrency(totals.total_earnings), color: '#10B981' },
          { label: 'Total Deductions', value: formatCurrency(totals.total_deductions), color: '#EF4444' },
          { label: 'Nett Pay', value: formatCurrency(totals.total_earnings - totals.total_deductions), color: '#0f2b46' },
          { label: 'Company Contributions', value: formatCurrency(totals.total_company), color: '#F59E0B' }
        ])}

        <h4 style="margin:16px 0 8px;font-size:14px;display:flex;align-items:center;gap:8px">
          <span class="badge badge-info">Sub-Ledger Account Summary</span>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px">Aggregated by mSCOA account</span>
        </h4>
        <div class="data-grid" style="margin-bottom:16px">
          <table>
            <thead><tr><th>mSCOA Item</th><th>Salary Heads</th><th style="text-align:center">Lines</th><th style="text-align:right">Debit (Dr)</th><th style="text-align:right">Credit (Cr)</th></tr></thead>
            <tbody>${accountRows}</tbody>
            <tfoot>
              <tr style="font-weight:700;border-top:2px solid var(--border)">
                <td colspan="3" style="text-align:right">Sub-Ledger Totals</td>
                <td style="text-align:right;color:var(--danger)">${formatCurrency(totalDebitAcc)}</td>
                <td style="text-align:right;color:var(--success)">${formatCurrency(totalCreditAcc)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h4 style="margin:16px 0 8px;font-size:14px;display:flex;align-items:center;gap:8px">
          <span class="badge badge-success">Sub-Ledger by Employee</span>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px">${byEmployee.length} of ${pg.total || byEmployee.length} employees - click to expand</span>
        </h4>
        ${empSections}
        ${paginationHtml}
      `;

      container.querySelectorAll('[data-sl-page]').forEach(btn => {
        btn.addEventListener('click', () => this.loadSubLedgerView(runId, parseInt(btn.dataset.slPage)));
      });

      container.querySelectorAll('.sl-employee-detail').forEach(detail => {
        detail.addEventListener('toggle', async () => {
          if (!detail.open) return;
          const empId = detail.dataset.empId;
          const rId = detail.dataset.runId;
          const entriesEl = detail.querySelector('.sl-emp-entries');
          if (entriesEl.dataset.loaded) return;
          try {
            const r = await api(`/payroll/runs/${rId}/sub-ledger/employee/${empId}`);
            const entries = r.entries || [];
            const rows = entries.map(e => {
              const typeBadge = e.transaction_type === 'EARNING' ? 'badge-success' :
                                e.transaction_type === 'DEDUCTION' ? 'badge-danger' : 'badge-info';
              return `<tr style="font-size:12px">
                <td><span class="badge ${typeBadge}" style="font-size:9px">${e.transaction_type}</span></td>
                <td>${e.head_code}</td><td>${e.head_name}</td>
                <td style="font-family:monospace;font-size:11px">${e.scoa_item_id || '-'}</td>
                <td style="font-family:monospace;font-size:11px">${e.contra_scoa_item_id || '-'}</td>
                <td style="text-align:right;font-weight:500">${formatCurrency(e.amount)}</td>
              </tr>`;
            }).join('');
            entriesEl.innerHTML = `<table style="width:100%;border-collapse:collapse">
              <thead><tr style="font-size:11px;color:var(--text-muted)"><th style="text-align:left;padding:4px 8px">Type</th><th style="text-align:left;padding:4px 8px">Code</th><th style="text-align:left;padding:4px 8px">Head</th><th style="text-align:left;padding:4px 8px">SCOA Dr</th><th style="text-align:left;padding:4px 8px">SCOA Cr</th><th style="text-align:right;padding:4px 8px">Amount</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>`;
            entriesEl.dataset.loaded = '1';
          } catch (e) {
            entriesEl.innerHTML = `<div style="color:var(--danger);font-size:12px">Failed to load: ${e.message}</div>`;
          }
        });
      });
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load sub-ledger: ${err.message}</div>`;
    }
  },

  async loadReconcileView(runId) {
    const container = document.getElementById('gl-sl-content');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Running reconciliation checks...</div>';

    try {
      const res = await api(`/payroll/runs/${runId}/reconcile`);
      const r = res.reconciliation;
      const overall = r.overall_status;
      const overallColor = overall === 'PASS' ? '#2e7d32' : overall === 'FAIL' ? '#c62828' : '#e65100';
      const overallBg = overall === 'PASS' ? '#e8f5e9' : overall === 'FAIL' ? '#ffebee' : '#fff3e0';
      const overallIcon = overall === 'PASS' ? 'check' : 'alertTriangle';

      const checkRows = r.checks.map(c => {
        const statusColor = c.status === 'PASS' ? '#2e7d32' : c.status === 'FAIL' ? '#c62828' : c.status === 'WARNING' ? '#e65100' : '#9e9e9e';
        const statusBg = c.status === 'PASS' ? '#e8f5e9' : c.status === 'FAIL' ? '#ffebee' : c.status === 'WARNING' ? '#fff3e0' : '#f5f5f5';
        const sevColor = c.severity === 'CRITICAL' ? '#c62828' : c.severity === 'HIGH' ? '#e65100' : '#1565c0';
        return `
          <tr>
            <td>
              <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;background:${statusBg};color:${statusColor}">
                ${icon(c.status === 'PASS' ? 'check' : c.status === 'NOT_APPLICABLE' ? 'clock' : 'alertTriangle', 12)}
                ${c.status}
              </span>
            </td>
            <td><strong>${c.check}</strong></td>
            <td>${c.description}</td>
            <td><span style="font-size:11px;font-weight:600;color:${sevColor}">${c.severity}</span></td>
            <td style="font-size:12px;font-family:monospace;color:var(--text-muted)">${c.detail}</td>
          </tr>`;
      }).join('');

      const gl = r.gl_summary;
      const sl = r.sub_ledger_summary;

      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;padding:20px;border-radius:10px;background:${overallBg};border:2px solid ${overallColor};margin-bottom:16px">
          <div style="width:48px;height:48px;border-radius:50%;background:${overallColor};display:flex;align-items:center;justify-content:center;color:white">
            ${icon(overallIcon, 24)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:${overallColor}">Reconciliation: ${overall}</div>
            <div style="font-size:13px;color:var(--text-muted)">Sub-Ledger to GL integrity check for Run #${runId}</div>
          </div>
          ${r.gl_posted ? '' : '<div style="margin-left:auto;padding:8px 16px;background:#fff3e0;border-radius:8px;font-size:12px;color:#e65100;font-weight:600">' + icon('alertTriangle',13) + ' GL not yet posted for this run</div>'}
        </div>

        <div class="stats-bar" style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px;padding:14px 18px;border-radius:8px;border-left:4px solid #4F6AFF;background:white;box-shadow:0 1px 3px rgba(0,0,0,.08)">
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px">GL Debits</div>
            <div style="font-size:20px;font-weight:700;color:#c62828">${formatCurrency(gl.total_debits)}</div>
          </div>
          <div style="flex:1;min-width:180px;padding:14px 18px;border-radius:8px;border-left:4px solid #10B981;background:white;box-shadow:0 1px 3px rgba(0,0,0,.08)">
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px">GL Credits</div>
            <div style="font-size:20px;font-weight:700;color:#2e7d32">${formatCurrency(gl.total_credits)}</div>
          </div>
          <div style="flex:1;min-width:180px;padding:14px 18px;border-radius:8px;border-left:4px solid ${gl.balanced ? '#2e7d32' : '#c62828'};background:white;box-shadow:0 1px 3px rgba(0,0,0,.08)">
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px">GL Balance</div>
            <div style="font-size:20px;font-weight:700;color:${gl.balanced ? '#2e7d32' : '#c62828'}">${gl.balanced ? 'Balanced' : formatCurrency(Math.abs(gl.total_debits - gl.total_credits))}</div>
          </div>
          <div style="flex:1;min-width:180px;padding:14px 18px;border-radius:8px;border-left:4px solid #c9a84c;background:white;box-shadow:0 1px 3px rgba(0,0,0,.08)">
            <div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);letter-spacing:.5px">SL-to-GL Variance</div>
            <div style="font-size:20px;font-weight:700;color:${r.sl_to_gl_variance < 0.01 ? '#2e7d32' : '#c62828'}">R ${r.sl_to_gl_variance.toFixed(2)}</div>
          </div>
        </div>

        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th style="width:100px">Status</th>
                <th style="width:180px">Check</th>
                <th>Description</th>
                <th style="width:80px">Severity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>${checkRows}</tbody>
          </table>
        </div>

        <div style="display:flex;gap:16px;margin-top:16px">
          <div style="flex:1;padding:16px;border-radius:8px;border:1px solid var(--border);background:white">
            <h4 style="font-size:13px;margin:0 0 12px;display:flex;align-items:center;gap:6px">${icon('book',14)} GL Summary</h4>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
              <div style="display:flex;justify-content:space-between"><span>Journal Entries</span><strong>${gl.journal_count}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Total Debits</span><strong style="color:var(--danger)">${formatCurrency(gl.total_debits)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Total Credits</span><strong style="color:var(--success)">${formatCurrency(gl.total_credits)}</strong></div>
              <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border)"><span>Balanced</span><strong style="color:${gl.balanced ? '#2e7d32' : '#c62828'}">${gl.balanced ? 'Yes' : 'No'}</strong></div>
            </div>
          </div>
          <div style="flex:1;padding:16px;border-radius:8px;border:1px solid var(--border);background:white">
            <h4 style="font-size:13px;margin:0 0 12px;display:flex;align-items:center;gap:6px">${icon('fileText',14)} Sub-Ledger Summary</h4>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
              <div style="display:flex;justify-content:space-between"><span>Employees</span><strong>${sl.employee_count}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Result Lines</span><strong>${sl.line_count}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Total Earnings</span><strong style="color:var(--success)">${formatCurrency(sl.total_earnings)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Total Deductions</span><strong style="color:var(--danger)">${formatCurrency(sl.total_deductions)}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Company Contributions</span><strong style="color:#F59E0B">${formatCurrency(sl.total_company_contributions)}</strong></div>
              <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border)"><span>Total Amount</span><strong>${formatCurrency(sl.total_amount)}</strong></div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load reconciliation: ${err.message}</div>`;
    }
  },

  async renderThirdPartyTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading third party payments...</div>';
    try {
      const [paymentsRes, headsRes] = await Promise.all([
        api('/payroll/third-party-payments'),
        api('/payroll/salary-heads')
      ]);
      const payments = paymentsRes.data || [];
      this._tppSalaryHeads = (headsRes.data || []).filter(h => h.transaction_type === 'DEDUCTION' || h.transaction_type === 'COMPANY_CONTRIBUTION');

      const statusBadge = (s) => {
        const colors = { PENDING: 'badge-warning', APPROVED: 'badge-info', PAID: 'badge-success', CANCELLED: 'badge-default' };
        return `<span class="badge ${colors[s] || 'badge-default'}" style="font-size:10px">${s}</span>`;
      };

      const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      const totalApproved = payments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
      const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);

      const rows = payments.map(p => `
        <tr>
          <td><strong>${p.vendor_name || '-'}</strong></td>
          <td style="font-size:12px;color:var(--text-muted)">${p.vendor_reference || '-'}</td>
          <td>${p.salary_head_name || '-'}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(p.total_amount)}</td>
          <td style="text-align:center">${p.employee_count || 0}</td>
          <td>${p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td>${statusBadge(p.status || 'PENDING')}</td>
          <td>
            <div class="action-bar">
              ${p.status === 'PENDING' ? `<button class="action-btn" onclick="PayrollModule.showEditThirdPartyModal(${p.id})" title="Edit">${icon('edit2',14)}</button>` : ''}
              ${p.status === 'PENDING' ? `<button class="action-btn" onclick="PayrollModule.updateThirdPartyStatus(${p.id},'APPROVED')" title="Approve" style="color:var(--success)">${icon('check',14)}</button>` : ''}
              ${p.status === 'APPROVED' ? `<button class="action-btn" onclick="PayrollModule.updateThirdPartyStatus(${p.id},'PAID')" title="Mark Paid" style="color:var(--success)">${icon('dollar',14)}</button>` : ''}
              ${p.status !== 'PAID' ? `<button class="action-btn" onclick="PayrollModule.deleteThirdPartyPayment(${p.id},'${(p.vendor_name||'').replace(/'/g,'\\&#39;')}')" title="Delete" style="color:var(--danger)">${icon('trash2',14)}</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div style="display:flex;gap:16px;font-size:12px;align-items:center">
            <span style="color:var(--text-muted)">Pending: <strong style="color:var(--warning)">${formatCurrency(totalPending)}</strong></span>
            <span style="color:var(--text-muted)">Approved: <strong style="color:var(--primary)">${formatCurrency(totalApproved)}</strong></span>
            <span style="color:var(--text-muted)">Paid: <strong style="color:var(--success)">${formatCurrency(totalPaid)}</strong></span>
          </div>
          <button class="btn btn-primary" id="btn-add-tpp">&#43; Add Third Party Payment</button>
        </div>
        ${payments.length > 0 ? `
        <div class="data-grid" style="margin-top:12px">
          <table>
            <thead><tr><th>Vendor</th><th>Reference</th><th>Salary Head</th><th style="text-align:right">Amount</th><th style="text-align:center">Employees</th><th>Payment Date</th><th>Status</th><th style="width:110px">Actions</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ` : UI.emptyState(icon('users',32), 'No Third Party Payments', 'Add a third party payment or execute a payroll run to generate payment schedules')}
      `;

      document.getElementById('btn-add-tpp')?.addEventListener('click', () => this.showAddThirdPartyModal());
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load third party payments: ${err.message}</div>`;
    }
  },

  getThirdPartyFormFields(existing) {
    const headOptions = (this._tppSalaryHeads || []).map(h => ({ value: String(h.id), label: `${h.code} - ${h.name}` }));
    return UI.buildForm([
      { type: 'section', label: existing ? 'Edit Third Party Payment' : 'New Third Party Payment', icon: icon('users',16) },
      { id: 'tpp_vendor_name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'e.g. SARS, Old Mutual, SAMWU', value: existing?.vendor_name || '' },
      { id: 'tpp_vendor_reference', label: 'Vendor Reference / Account No.', type: 'text', placeholder: 'e.g. Payment reference or account number', value: existing?.vendor_reference || '' },
      { id: 'tpp_salary_head_id', label: 'Linked Salary Head', type: 'select', options: [{ value: '', label: '-- None --' }, ...headOptions], value: existing?.salary_head_id ? String(existing.salary_head_id) : '' },
      { type: 'section', label: 'Payment Details', icon: icon('dollar',16) },
      { id: 'tpp_total_amount', label: 'Total Amount (R)', type: 'number', required: true, min: 0, step: '0.01', placeholder: '0.00', value: existing?.total_amount || '' },
      { id: 'tpp_employee_count', label: 'Employee Count', type: 'number', min: 0, placeholder: '0', value: existing?.employee_count || 0 },
      { id: 'tpp_payment_date', label: 'Payment Date', type: 'date', value: existing?.payment_date ? existing.payment_date.substring(0,10) : '' },
      { id: 'tpp_status', label: 'Status', type: 'select', options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'PAID', label: 'Paid' },
        { value: 'CANCELLED', label: 'Cancelled' }
      ], value: existing?.status || 'PENDING' }
    ]);
  },

  showAddThirdPartyModal() {
    const formFields = this.getThirdPartyFormFields(null);
    UI.modal({
      title: 'Add Third Party Payment',
      content: `<div class="form-grid" id="add-tpp-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-submit-tpp">Create</button>`
    });
    document.getElementById('btn-submit-tpp').addEventListener('click', async () => {
      const form = document.getElementById('add-tpp-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation Error', errors[0]); return; }
      const data = UI.getFormData(form);
      try {
        await apiPost('/payroll/third-party-payments', {
          vendor_name: data.tpp_vendor_name,
          vendor_reference: data.tpp_vendor_reference,
          salary_head_id: data.tpp_salary_head_id ? parseInt(data.tpp_salary_head_id) : null,
          total_amount: parseFloat(data.tpp_total_amount),
          employee_count: parseInt(data.tpp_employee_count) || 0,
          payment_date: data.tpp_payment_date || null,
          status: data.tpp_status || 'PENDING'
        });
        UI.closeModal();
        UI.toast('success', 'Payment Created', `Third party payment to ${data.tpp_vendor_name} has been added`);
        this.state.activeTab = 'thirdparty';
        this.renderTabContent();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async showEditThirdPartyModal(id) {
    try {
      const res = await api('/payroll/third-party-payments');
      const payment = (res.data || []).find(p => p.id === id);
      if (!payment) { UI.toast('error', 'Error', 'Payment not found'); return; }
      const formFields = this.getThirdPartyFormFields(payment);
      UI.modal({
        title: `Edit Third Party Payment #${id}`,
        content: `<div class="form-grid" id="edit-tpp-form">${formFields}</div>`,
        footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-update-tpp">Update</button>`
      });
      document.getElementById('btn-update-tpp').addEventListener('click', async () => {
        const form = document.getElementById('edit-tpp-form');
        const data = UI.getFormData(form);
        try {
          const res = await fetch(API_BASE + `/payroll/third-party-payments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendor_name: data.tpp_vendor_name,
              vendor_reference: data.tpp_vendor_reference,
              salary_head_id: data.tpp_salary_head_id ? parseInt(data.tpp_salary_head_id) : null,
              total_amount: parseFloat(data.tpp_total_amount),
              employee_count: parseInt(data.tpp_employee_count) || 0,
              payment_date: data.tpp_payment_date || null,
              status: data.tpp_status || 'PENDING'
            })
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
          UI.closeModal();
          UI.toast('success', 'Payment Updated', `Third party payment to ${data.tpp_vendor_name} has been updated`);
          this.state.activeTab = 'thirdparty';
          this.renderTabContent();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async updateThirdPartyStatus(id, status) {
    const labels = { APPROVED: 'Approve', PAID: 'Mark as Paid', CANCELLED: 'Cancel' };
    const confirmed = await UI.confirm({
      title: `${labels[status] || status} Payment #${id}`,
      message: `Are you sure you want to change the status of this payment to <strong>${status}</strong>?`,
      confirmText: labels[status] || status,
      danger: status === 'CANCELLED'
    });
    if (!confirmed) return;
    try {
      const res = await fetch(API_BASE + `/payroll/third-party-payments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Status update failed'); }
      UI.toast('success', 'Status Updated', `Payment #${id} marked as ${status}`);
      this.state.activeTab = 'thirdparty';
      this.renderTabContent();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  deleteThirdPartyPayment(id, vendorName) {
    UI.confirm({
      title: 'Delete Third Party Payment',
      message: `Are you sure you want to delete the payment to <strong>${vendorName}</strong>?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(API_BASE + `/payroll/third-party-payments/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error?.message || 'Delete failed');
          UI.toast('success', 'Payment Deleted', result.data?.message || `Payment to ${vendorName} has been removed`);
          this.state.activeTab = 'thirdparty';
          this.renderTabContent();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      }
    });
  },

  async renderSalaryHeadsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading salary heads...</div>';
    try {
      const res = await api('/payroll/salary-heads');
      const heads = res.data || [];

      const grouped = {
        EARNING: heads.filter(h => h.transaction_type === 'EARNING'),
        DEDUCTION: heads.filter(h => h.transaction_type === 'DEDUCTION'),
        COMPANY_CONTRIBUTION: heads.filter(h => h.transaction_type === 'COMPANY_CONTRIBUTION'),
        FRINGE_BENEFIT: heads.filter(h => h.transaction_type === 'FRINGE_BENEFIT')
      };

      const calcMethodBadge = (m) => {
        if (m === 'SYSTEM_CALCULATE') return '<span class="badge badge-info" style="font-size:10px">System</span>';
        if (m === 'PERCENTAGE_OF_BASIC') return '<span class="badge badge-warning" style="font-size:10px">% of Basic</span>';
        if (m === 'FIXED') return '<span class="badge badge-default" style="font-size:10px">Fixed</span>';
        return '<span class="badge badge-default" style="font-size:10px">User Input</span>';
      };

      const renderGroup = (title, items, badgeClass) => {
        if (items.length === 0) return '';
        const rows = items.map(h => {
          const isSystem = h.calculation_method === 'SYSTEM_CALCULATE';
          const flags = [h.taxable ? 'Tax' : '', h.affects_uif ? 'UIF' : '', h.affects_sdl ? 'SDL' : ''].filter(Boolean).join(', ') || '-';
          return `
          <tr>
            <td><strong>${h.code}</strong></td>
            <td>${h.name}</td>
            <td style="text-align:center">${h.irp5_code || '-'}</td>
            <td>${calcMethodBadge(h.calculation_method)}</td>
            <td style="font-size:12px">${flags}</td>
            <td>
              <div class="action-bar">
                <button class="action-btn" onclick="PayrollModule.showEditSalaryHeadModal(${h.id})" title="Edit">${icon('edit2',14)}</button>
                ${!isSystem ? `<button class="action-btn" onclick="PayrollModule.deleteSalaryHead(${h.id},'${h.code}','${h.name.replace(/'/g,'\\&#39;')}')" title="Delete" style="color:var(--danger)">${icon('trash2',14)}</button>` : ''}
              </div>
            </td>
          </tr>`;
        }).join('');
        return `
          <h4 style="margin:16px 0 8px;font-size:14px;display:flex;align-items:center;gap:8px">
            <span class="badge ${badgeClass}">${title}</span>
            <span style="color:var(--text-muted);font-weight:400;font-size:12px">(${items.length})</span>
          </h4>
          <div class="data-grid" style="margin-bottom:16px">
            <table>
              <thead><tr><th>Code</th><th>Name</th><th style="text-align:center">IRP5</th><th>Calc Method</th><th>Statutory Flags</th><th style="width:90px">Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      };

      el.innerHTML = `
        <div class="toolbar">
          <div style="flex:1"></div>
          <button class="btn btn-primary" id="btn-add-salary-head">&#43; Add Salary Head</button>
        </div>
        ${renderGroup('Earnings', grouped.EARNING, 'badge-success')}
        ${renderGroup('Deductions', grouped.DEDUCTION, 'badge-danger')}
        ${renderGroup('Company Contributions', grouped.COMPANY_CONTRIBUTION, 'badge-info')}
        ${renderGroup('Fringe Benefits', grouped.FRINGE_BENEFIT, 'badge-warning')}
        ${heads.length === 0 ? UI.emptyState(icon('clipboard',32), 'No Salary Heads', 'Add salary transaction definitions to configure payroll') : ''}
      `;

      document.getElementById('btn-add-salary-head')?.addEventListener('click', () => this.showAddSalaryHeadModal());
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load salary heads: ${err.message}</div>`;
    }
  },

  async glPostRun(id) {
    const confirmed = await UI.confirm({
      title: 'GL Post Payroll Run',
      message: `This will post payroll journal entries for Run #${id} to the General Ledger. Continue?`,
      icon: icon('alertTriangle', 28),
      confirmText: 'Post to GL',
      danger: false
    });
    if (!confirmed) return;

    UI.toast('info', 'Processing', 'Posting to General Ledger...');
    try {
      const res = await apiPost(`/payroll/runs/${id}/gl-post`);
      const s = res.summary || {};
      let msg = res.message || `Payroll Run #${id} posted to General Ledger`;
      if (s.total_debits !== undefined) {
        msg += ` | Debits: R${(s.total_debits||0).toLocaleString('en-ZA',{minimumFractionDigits:2})} | Credits: R${(s.total_credits||0).toLocaleString('en-ZA',{minimumFractionDigits:2})}`;
      }
      if (s.missing_scoa_codes && s.missing_scoa_codes.length > 0) {
        UI.toast('warning', 'Missing SCOA Codes', `The following heads have no mSCOA mapping: ${s.missing_scoa_codes.join(', ')}. Configure them in Salary Heads.`);
      }
      UI.toast(s.balanced === false ? 'warning' : 'success', 'GL Posted', msg);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'GL Post Failed', err.message);
    }
  },

  async voidRun(id) {
    const formFields = UI.buildForm([
      { type: 'section', label: 'Void Payroll Run', icon: icon('xCircle',16) },
      { id: 'void_reason', label: 'Reason for Voiding', type: 'textarea', required: true, placeholder: 'Enter the reason for voiding this payroll run...' }
    ]);

    UI.modal({
      title: `Void Payroll Run #${id}`,
      size: 'sm',
      content: `<div class="form-grid" id="void-run-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn" id="btn-submit-void" style="background:var(--danger);color:#fff;border-color:var(--danger)">Void Run</button>`
    });

    document.getElementById('btn-submit-void').addEventListener('click', async () => {
      const form = document.getElementById('void-run-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) {
        UI.toast('error', 'Validation Error', errors[0]);
        return;
      }
      const data = UI.getFormData(form);
      try {
        const res = await apiPost(`/payroll/runs/${id}/void`, { reason: data.void_reason });
        UI.closeModal();
        UI.toast('success', 'Run Voided', res.message || `Payroll Run #${id} has been voided`);
        this.loadRuns();
      } catch (err) {
        UI.toast('error', 'Void Failed', err.message);
      }
    });
  },

  async reverseRun(id) {
    const confirmed = await UI.confirm({
      title: 'Reverse Payroll Run',
      message: `This will create a reversal for Payroll Run #${id}. All transactions will be reversed with opposite amounts. This action cannot be undone. Continue?`,
      icon: icon('alertTriangle', 28),
      confirmText: 'Reverse Run',
      danger: true
    });
    if (!confirmed) return;

    UI.toast('info', 'Processing', 'Reversing payroll run...');
    try {
      const res = await apiPost(`/payroll/runs/${id}/reverse`);
      UI.toast('success', 'Run Reversed', res.message || `Payroll Run #${id} has been reversed`);
      this.loadRuns();
    } catch (err) {
      UI.toast('error', 'Reversal Failed', err.message);
    }
  },

  async renderVarianceTab(el) {
    el.innerHTML = `
      <div style="margin-bottom:16px">
        <h3 style="margin:0 0 12px;font-size:16px">Payroll Variance Comparison</h3>
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <label style="display:block;font-size:12px;font-weight:500;margin-bottom:4px;color:var(--text-muted)">Select Payroll Run</label>
            <select id="variance-run-select" class="toolbar-filter-select" style="width:100%">
              <option value="">-- Select a Run --</option>
            </select>
          </div>
          <div style="min-width:180px">
            <label style="display:block;font-size:12px;font-weight:500;margin-bottom:4px;color:var(--text-muted)">Compare Type</label>
            <select id="variance-compare-type" class="toolbar-filter-select" style="width:100%">
              <option value="">Auto-detect</option>
              <option value="TRIAL_VS_FINAL">Trial vs Final</option>
              <option value="PERIOD_COMPARISON">Period Comparison</option>
            </select>
          </div>
          <button class="btn btn-primary" id="btn-load-variance" disabled>${icon('barChart',14)} Load Variance</button>
        </div>
      </div>
      <div id="variance-results"></div>
    `;

    try {
      const res = await api('/payroll/runs?limit=100');
      const runs = (res.data || []).filter(r => ['COMPLETED','LOCKED','APPROVED'].includes(r.status));
      const sel = document.getElementById('variance-run-select');
      runs.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `Run #${r.id} - ${r.cycle_name || ''} Period ${r.period_number || ''} (${r.tax_year || ''}) - ${r.run_type} - ${r.status}`;
        sel.appendChild(opt);
      });

      sel.addEventListener('change', () => {
        document.getElementById('btn-load-variance').disabled = !sel.value;
      });

      document.getElementById('btn-load-variance').addEventListener('click', async () => {
        const runId = document.getElementById('variance-run-select').value;
        const compareType = document.getElementById('variance-compare-type').value;
        if (!runId) return;
        await this.loadVarianceData(parseInt(runId), compareType);
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load runs: ${err.message}</div>`;
    }
  },

  async loadVarianceData(runId, compareType) {
    const resultsEl = document.getElementById('variance-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading variance data...</div>';

    try {
      let url = `/payroll/runs/${runId}/variance`;
      if (compareType) url += `?compare_type=${compareType}`;
      const res = await api(url);
      const data = res.data;

      if (!data || data.message) {
        resultsEl.innerHTML = UI.emptyState(icon('barChart',32), 'No Variance Data', data?.message || 'No previous run found for comparison');
        return;
      }

      const current = data.current_run || {};
      const previous = data.previous_run || {};
      const sv = data.summary_variance || {};
      const detailVariance = data.detail_variance || [];
      const employeeVariance = data.employee_variance || [];

      const fmtDiff = (val) => {
        const n = parseFloat(val) || 0;
        if (Math.abs(n) < 0.01) return '<span style="color:var(--text-muted)">R 0.00</span>';
        if (n > 0) return `<span style="color:var(--danger)">+${formatCurrency(n)}</span>`;
        return `<span style="color:var(--success)">${formatCurrency(n)}</span>`;
      };

      const fmtPct = (val) => {
        const n = parseFloat(val) || 0;
        if (Math.abs(n) < 0.01) return '<span style="color:var(--text-muted)">0.00%</span>';
        if (n > 0) return `<span style="color:var(--danger)">+${n.toFixed(2)}%</span>`;
        return `<span style="color:var(--success)">${n.toFixed(2)}%</span>`;
      };

      const highlightRow = (val, threshold) => {
        const abs = Math.abs(parseFloat(val) || 0);
        if (abs > threshold) return 'background:rgba(239,68,68,0.06)';
        return '';
      };

      const varTypeBadge = data.compare_type === 'TRIAL_VS_FINAL'
        ? '<span class="badge badge-info">Trial vs Final</span>'
        : '<span class="badge badge-warning">Period Comparison</span>';

      const summaryComparison = `
        <h4 style="margin:16px 0 8px;font-size:14px">Summary Comparison ${varTypeBadge}</h4>
        <div class="data-grid" style="margin-bottom:20px">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th style="text-align:right">Current Run #${current.id || runId} (${current.run_type || ''})</th>
                <th style="text-align:right">Previous Run #${previous.id || '-'} (${previous.run_type || ''})</th>
                <th style="text-align:right">Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Employee Count</td>
                <td style="text-align:right">${sv.current_employee_count || 0}</td>
                <td style="text-align:right">${sv.previous_employee_count || 0}</td>
                <td style="text-align:right">${fmtDiff((sv.current_employee_count || 0) - (sv.previous_employee_count || 0))}</td>
              </tr>
              <tr>
                <td>Total Earnings</td>
                <td style="text-align:right">${formatCurrency(sv.current_earnings || 0)}</td>
                <td style="text-align:right">${formatCurrency(sv.previous_earnings || 0)}</td>
                <td style="text-align:right">${fmtDiff(sv.earnings_variance)}</td>
              </tr>
              <tr>
                <td>Total Deductions</td>
                <td style="text-align:right">${formatCurrency(sv.current_deductions || 0)}</td>
                <td style="text-align:right">${formatCurrency(sv.previous_deductions || 0)}</td>
                <td style="text-align:right">${fmtDiff(sv.deductions_variance)}</td>
              </tr>
              <tr style="font-weight:600">
                <td>Nett Pay</td>
                <td style="text-align:right">${formatCurrency(sv.current_nett || 0)}</td>
                <td style="text-align:right">${formatCurrency(sv.previous_nett || 0)}</td>
                <td style="text-align:right">${fmtDiff(sv.nett_variance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      let headSection = '';
      if (detailVariance.length > 0) {
        const headRows = detailVariance.map(h => `
          <tr style="${highlightRow(h.variance_amount, 100)}">
            <td><strong>${h.code || '-'}</strong></td>
            <td>${h.name || '-'}</td>
            <td><span class="badge badge-${h.transaction_type === 'EARNING' ? 'success' : h.transaction_type === 'DEDUCTION' ? 'danger' : 'info'}">${h.transaction_type || '-'}</span></td>
            <td style="text-align:right">${formatCurrency(h.current_total || 0)}</td>
            <td style="text-align:right">${formatCurrency(h.previous_total || 0)}</td>
            <td style="text-align:right">${fmtDiff(h.variance_amount)}</td>
            <td style="text-align:right">${fmtPct(h.variance_percentage)}</td>
          </tr>
        `).join('');

        headSection = `
          <h4 style="margin:16px 0 8px;font-size:14px">Salary Head Breakdown</h4>
          <div class="data-grid" style="margin-bottom:20px">
            <table>
              <thead>
                <tr><th>Code</th><th>Salary Head</th><th>Type</th>
                <th style="text-align:right">Current</th><th style="text-align:right">Previous</th>
                <th style="text-align:right">Variance</th><th style="text-align:right">Change %</th></tr>
              </thead>
              <tbody>${headRows}</tbody>
            </table>
          </div>
        `;
      }

      let empSection = '';
      if (employeeVariance.length > 0) {
        const changedEmps = employeeVariance.filter(e => e.has_change);
        const significantEmps = employeeVariance.filter(e => Math.abs(e.nett_variance) > 100 || (Math.abs(e.nett_variance) / Math.max(Math.abs(e.previous_nett), 1)) > 0.01);

        const empRows = employeeVariance.map(e => `
          <tr style="${Math.abs(e.nett_variance) > 100 ? 'background:rgba(239,68,68,0.06)' : ''}">
            <td><strong>${e.employee_code}</strong></td>
            <td>${e.name}</td>
            <td style="text-align:right">${formatCurrency(e.current_earnings)}</td>
            <td style="text-align:right">${formatCurrency(e.previous_earnings)}</td>
            <td style="text-align:right">${fmtDiff(e.earnings_variance)}</td>
            <td style="text-align:right">${formatCurrency(e.current_deductions)}</td>
            <td style="text-align:right">${formatCurrency(e.previous_deductions)}</td>
            <td style="text-align:right">${fmtDiff(e.deductions_variance)}</td>
            <td style="text-align:right;font-weight:600">${fmtDiff(e.nett_variance)}</td>
          </tr>
        `).join('');

        empSection = `
          <h4 style="margin:16px 0 8px;font-size:14px">Employee-Level Variance ${significantEmps.length > 0 ? `<span class="badge badge-danger" style="margin-left:8px">${significantEmps.length} significant</span>` : ''}</h4>
          <p style="font-size:12px;color:var(--text-muted);margin:0 0 8px">Rows highlighted where nett variance exceeds R100. ${changedEmps.length} of ${employeeVariance.length} employees have changes.</p>
          <div class="data-grid">
            <table>
              <thead>
                <tr><th>Code</th><th>Employee</th>
                <th style="text-align:right">Curr Earn</th><th style="text-align:right">Prev Earn</th><th style="text-align:right">Earn Var</th>
                <th style="text-align:right">Curr Ded</th><th style="text-align:right">Prev Ded</th><th style="text-align:right">Ded Var</th>
                <th style="text-align:right">Nett Var</th></tr>
              </thead>
              <tbody>${empRows}</tbody>
            </table>
          </div>
        `;
      }

      resultsEl.innerHTML = `
        ${UI.statCards([
          { label: 'Current Run', value: `#${current.id || runId}`, color: '#4F6AFF' },
          { label: 'Previous Run', value: previous.id ? `#${previous.id}` : 'N/A', color: '#8B5CF6' },
          { label: 'Nett Variance', value: formatCurrency(sv.nett_variance || 0), color: Math.abs(sv.nett_variance || 0) > 100 ? '#EF4444' : '#10B981' },
          { label: 'Employees Changed', value: sv.employees_with_changes || 0, color: '#F59E0B' },
          { label: 'Total Abs Variance', value: formatCurrency(sv.total_variance_amount || 0), color: '#EF4444' }
        ])}
        ${summaryComparison}
        ${headSection}
        ${empSection}
      `;
    } catch (err) {
      resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load variance: ${err.message}</div>`;
    }
  },

  async prorateRun(id) {
    let employeeOptions = [];
    try {
      const empRes = await api('/employees?limit=500&status=ACTIVE');
      employeeOptions = (empRes.data || []).map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    } catch (err) {
      employeeOptions = [];
    }

    const formFields = UI.buildForm([
      { type: 'section', label: 'Mid-Period Proration', icon: icon('clock',16) },
      { id: 'prorate_employee_id', label: 'Employee', type: 'select', options: [{ value: '', label: '-- Select Employee --' }, ...employeeOptions], required: true },
      { id: 'prorate_start_date', label: 'Start Date', type: 'date', required: true, hint: 'Date employee started or returned' },
      { id: 'prorate_end_date', label: 'End Date', type: 'date', required: true, hint: 'Date employee left or period end' },
      { id: 'prorate_reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'e.g. Mid-month appointment, resignation, etc.' }
    ]);

    UI.modal({
      title: `Prorate Payroll - Run #${id}`,
      size: 'md',
      content: `<div class="form-grid" id="prorate-form">${formFields}</div><div id="prorate-results" style="margin-top:16px"></div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-submit-prorate">${icon('clock',14)} Calculate Proration</button>`
    });

    document.getElementById('btn-submit-prorate').addEventListener('click', async () => {
      const form = document.getElementById('prorate-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) {
        UI.toast('error', 'Validation Error', errors[0]);
        return;
      }
      const data = UI.getFormData(form);
      const resultsEl = document.getElementById('prorate-results');
      resultsEl.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating proration...</div>';

      try {
        const res = await apiPost(`/payroll/runs/${id}/prorate`, {
          employee_id: parseInt(data.prorate_employee_id),
          start_date: data.prorate_start_date,
          end_date: data.prorate_end_date,
          reason: data.prorate_reason
        });

        const result = res.data;
        const items = result.prorated_items || result.items || [];
        let tableRows = '';
        if (items.length > 0) {
          tableRows = items.map(item => `
            <tr>
              <td>${item.salary_head_code || item.code || '-'}</td>
              <td>${item.salary_head_name || item.name || '-'}</td>
              <td><span class="badge badge-${item.transaction_type === 'EARNING' ? 'success' : item.transaction_type === 'DEDUCTION' ? 'danger' : 'info'}">${item.transaction_type || '-'}</span></td>
              <td style="text-align:right">${formatCurrency(item.original_amount || item.full_amount || 0)}</td>
              <td style="text-align:right;font-weight:600">${formatCurrency(item.prorated_amount || item.amount || 0)}</td>
            </tr>
          `).join('');
        }

        const factor = result.proration_factor || result.factor || 0;
        const totalDays = result.total_days || result.period_days || 0;
        const workedDays = result.worked_days || result.days_worked || 0;

        resultsEl.innerHTML = `
          ${UI.statCards([
            { label: 'Period Days', value: totalDays, color: '#4F6AFF' },
            { label: 'Days Worked', value: workedDays, color: '#10B981' },
            { label: 'Proration Factor', value: (parseFloat(factor) * 100).toFixed(1) + '%', color: '#F59E0B' },
            { label: 'Prorated Salary', value: formatCurrency(result.prorated_salary || result.total_prorated || 0), color: '#8B5CF6' }
          ])}
          ${items.length > 0 ? `
            <div class="data-grid" style="margin-top:12px">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Salary Head</th>
                    <th>Type</th>
                    <th style="text-align:right">Full Amount</th>
                    <th style="text-align:right">Prorated Amount</th>
                  </tr>
                </thead>
                <tbody>${tableRows}</tbody>
              </table>
            </div>
          ` : ''}
        `;

        UI.toast('success', 'Proration Calculated', `Proration factor: ${(parseFloat(factor) * 100).toFixed(1)}% (${workedDays}/${totalDays} days)`);
      } catch (err) {
        resultsEl.innerHTML = `<div class="loading" style="color:var(--danger)">Proration failed: ${err.message}</div>`;
        UI.toast('error', 'Proration Failed', err.message);
      }
    });
  },

  async loadGLJournals(runId) {
    const container = document.getElementById('gl-journals-container');
    if (!container) return;
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading GL journal entries...</div>';

    try {
      const res = await api(`/payroll/runs/${runId}/gl-journals`);
      const journals = res.data || [];

      if (journals.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:32px;color:var(--text-muted)">
            ${icon('book',24)}
            <p style="margin:8px 0 0">No GL journal entries found for this run.</p>
            <p style="font-size:12px;margin:4px 0 0">GL journals are created when you click "GL Post" on a completed FINAL run.</p>
          </div>
        `;
        return;
      }

      const totalDebits = journals.reduce((s, j) => s + parseFloat(j.debit_amount || 0), 0);
      const totalCredits = journals.reduce((s, j) => s + parseFloat(j.credit_amount || 0), 0);
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

      const rows = journals.map(j => `
        <tr>
          <td>${j.journal_date?.split('T')[0] || '-'}</td>
          <td><strong>${j.scoa_item_id || '-'}</strong></td>
          <td>${j.scoa_fund_id || '-'}</td>
          <td>${j.scoa_function_id || '-'}</td>
          <td>${j.description || '-'}</td>
          <td>${j.reference || '-'}</td>
          <td style="text-align:right;color:var(--danger);font-weight:500">${parseFloat(j.debit_amount) > 0 ? formatCurrency(j.debit_amount) : ''}</td>
          <td style="text-align:right;color:var(--success);font-weight:500">${parseFloat(j.credit_amount) > 0 ? formatCurrency(j.credit_amount) : ''}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        ${UI.statCards([
          { label: 'Total Debits', value: formatCurrency(totalDebits), color: '#EF4444' },
          { label: 'Total Credits', value: formatCurrency(totalCredits), color: '#10B981' },
          { label: 'Balance', value: isBalanced ? 'Balanced' : formatCurrency(totalDebits - totalCredits), color: isBalanced ? '#10B981' : '#EF4444' },
          { label: 'Journal Entries', value: journals.length, color: '#4F6AFF' }
        ])}
        <div class="data-grid" style="margin-top:12px">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>mSCOA Item</th><th>Fund</th><th>Function</th>
                <th>Description</th><th>Reference</th>
                <th style="text-align:right">Debit</th><th style="text-align:right">Credit</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="font-weight:700;border-top:2px solid var(--border)">
                <td colspan="6" style="text-align:right">Totals</td>
                <td style="text-align:right;color:var(--danger)">${formatCurrency(totalDebits)}</td>
                <td style="text-align:right;color:var(--success)">${formatCurrency(totalCredits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="margin-top:8px;text-align:right">
          <button class="btn btn-sm" onclick="PayrollModule.loadGLJournals(${runId})">${icon('refresh',14)} Refresh</button>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load GL journals: ${err.message}</div>`;
    }
  },

  async showMockPayslipModal() {
    let allSalaryHeads = [];
    try {
      const shRes = await api('/payroll/salary-heads');
      allSalaryHeads = shRes.data || [];
    } catch (e) { console.error('Failed to load salary heads', e); }

    const earningHeads = allSalaryHeads.filter(h => h.transaction_type === 'EARNING');
    const deductionHeads = allSalaryHeads.filter(h => h.transaction_type === 'DEDUCTION' || h.transaction_type === 'COMPANY_CONTRIBUTION');

    const formFields = UI.buildForm([
      { type: 'section', label: 'Mock Payslip Calculator', icon: icon('fileText',16) },
      { id: 'mock_annual_salary', label: 'Annual Salary (CTC)', type: 'number', required: true, placeholder: 'e.g. 350000' },
      { id: 'mock_dob', label: 'Date of Birth', type: 'date', value: '1990-01-01' },
      { id: 'mock_dependants', label: 'Dependants', type: 'number', value: '0', placeholder: '0' },
      { id: 'mock_medical_members', label: 'Medical Aid Members', type: 'number', value: '0', placeholder: '0' },
      { id: 'mock_period_type', label: 'Pay Period', type: 'select', options: [
        { value: 'MONTHLY', label: 'Monthly (12)' },
        { value: 'BI_WEEKLY', label: 'Bi-Weekly (26)' },
        { value: 'WEEKLY', label: 'Weekly (52)' }
      ] },
      { id: 'mock_tax_year', label: 'Tax Year', type: 'number', value: new Date().getFullYear().toString(), placeholder: new Date().getFullYear().toString() }
    ]);

    const buildHeadOptions = (heads) => heads.map(h => `<option value="${h.id}" data-name="${h.name}" data-code="${h.code}">${h.code} - ${h.name}</option>`).join('');
    const earningOptions = buildHeadOptions(earningHeads);
    const deductionOptions = buildHeadOptions(deductionHeads);

    UI.modal({
      title: 'Mock Payslip',
      size: 'lg',
      content: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
          <div>
            <div class="form-grid" id="mock-payslip-form">${formFields}</div>
            <div style="margin-top:12px">
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--text-muted)">Additional Earnings</h4>
              <div id="mock-extra-earnings"></div>
              <button class="btn" id="btn-add-mock-earning" style="margin-top:4px;font-size:12px">${icon('plus',12)} Add Earning</button>
            </div>
            <div style="margin-top:12px">
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--text-muted)">Additional Deductions</h4>
              <div id="mock-extra-deductions"></div>
              <button class="btn" id="btn-add-mock-deduction" style="margin-top:4px;font-size:12px">${icon('plus',12)} Add Deduction</button>
            </div>
          </div>
          <div id="mock-payslip-result">
            <div style="text-align:center;color:var(--text-muted);padding:40px 0">
              ${icon('fileText',32)}<br>
              <span style="font-size:13px">Enter details and click Calculate</span>
            </div>
          </div>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Close</button><button class="btn" id="btn-print-mock" style="display:none">${icon('printer',14)} Print</button><button class="btn btn-primary" id="btn-calc-mock">${icon('activity',14)} Calculate</button>`
    });

    let extraEarnings = [];
    let extraDeductions = [];

    const renderExtras = (containerId, items, type) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const opts = type === 'earning' ? earningOptions : deductionOptions;
      container.innerHTML = items.map((item, idx) => `
        <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
          <select class="form-control" data-idx="${idx}" data-field="salary_head_id" data-type="${type}" style="flex:1;padding:4px 8px;font-size:12px">
            <option value="">-- Select ${type === 'earning' ? 'Earning' : 'Deduction'} --</option>
            ${opts}
          </select>
          <input type="number" class="form-control" placeholder="Amount" value="${item.amount || ''}" data-idx="${idx}" data-field="amount" data-type="${type}" style="width:120px;padding:4px 8px;font-size:12px">
          <button class="action-btn" data-remove="${type}" data-idx="${idx}" title="Remove" style="padding:2px">${icon('xCircle',14)}</button>
        </div>
      `).join('');
      container.querySelectorAll('select').forEach(sel => {
        if (item => items[parseInt(sel.dataset.idx)]?.salary_head_id) {
          sel.value = items[parseInt(sel.dataset.idx)]?.salary_head_id || '';
        }
        sel.addEventListener('change', () => {
          const arr = sel.dataset.type === 'earning' ? extraEarnings : extraDeductions;
          const i = parseInt(sel.dataset.idx);
          arr[i].salary_head_id = parseInt(sel.value) || 0;
          const selected = sel.options[sel.selectedIndex];
          arr[i].name = selected?.dataset?.name || '';
          arr[i].code = selected?.dataset?.code || '';
        });
      });
      container.querySelectorAll('input[type="number"]').forEach(inp => {
        inp.addEventListener('input', () => {
          const arr = inp.dataset.type === 'earning' ? extraEarnings : extraDeductions;
          arr[parseInt(inp.dataset.idx)].amount = parseFloat(inp.value) || 0;
        });
      });
      container.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const arr = btn.dataset.remove === 'earning' ? extraEarnings : extraDeductions;
          arr.splice(parseInt(btn.dataset.idx), 1);
          renderExtras(containerId, arr, type);
        });
      });
    };

    document.getElementById('btn-add-mock-earning').addEventListener('click', () => {
      extraEarnings.push({ salary_head_id: 0, name: '', code: '', amount: 0 });
      renderExtras('mock-extra-earnings', extraEarnings, 'earning');
    });

    document.getElementById('btn-add-mock-deduction').addEventListener('click', () => {
      extraDeductions.push({ salary_head_id: 0, name: '', code: '', amount: 0 });
      renderExtras('mock-extra-deductions', extraDeductions, 'deduction');
    });

    document.getElementById('btn-calc-mock').addEventListener('click', async () => {
      const form = document.getElementById('mock-payslip-form');
      const data = UI.getFormData(form);
      const annualSalary = parseFloat(data.mock_annual_salary);
      if (!annualSalary || annualSalary <= 0) {
        UI.toast('error', 'Validation Error', 'Annual salary is required and must be positive');
        return;
      }

      const resultEl = document.getElementById('mock-payslip-result');
      resultEl.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating...</div>';

      try {
        const payload = {
          annual_salary: annualSalary,
          date_of_birth: data.mock_dob || '1990-01-01',
          dependants: parseInt(data.mock_dependants) || 0,
          medical_aid_members: parseInt(data.mock_medical_members) || 0,
          period_type: data.mock_period_type || 'MONTHLY',
          tax_year: parseInt(data.mock_tax_year) || new Date().getFullYear(),
          additional_earnings: extraEarnings.filter(e => e.salary_head_id && e.amount > 0),
          additional_deductions: extraDeductions.filter(d => d.salary_head_id && d.amount > 0)
        };

        const res = await apiPost('/payroll/runs/mock-payslip', payload);
        const mock = res.data;
        const summary = mock.summary || {};
        const items = mock.results || [];

        const earningItems = items.filter(i => i.transaction_type === 'EARNING');
        const deductionItems = items.filter(i => i.transaction_type === 'DEDUCTION');
        const companyItems = items.filter(i => i.transaction_type === 'COMPANY_CONTRIBUTION');

        resultEl.innerHTML = `
          <div style="border:1px solid var(--border);border-radius:8px;padding:16px;background:#fff">
            <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:12px">
              <h3 style="margin:0;font-size:16px;color:var(--primary-dark)">Mock Payslip</h3>
              <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Tax Year ${mock.tax_year} | ${mock.period_type} (${mock.periods_per_year} periods)</p>
            </div>

            <h4 style="margin:0 0 6px;font-size:13px;color:var(--success)">Earnings</h4>
            ${earningItems.map(i => `
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                <span>${i.head_name}</span>
                <span style="font-weight:500">${formatCurrency(i.amount)}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600;border-bottom:2px solid var(--border)">
              <span>Gross Pay</span>
              <span>${formatCurrency(summary.gross_earnings)}</span>
            </div>

            <h4 style="margin:12px 0 6px;font-size:13px;color:var(--danger)">Deductions</h4>
            ${deductionItems.map(i => `
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                <span>${i.head_name}${i.head_code === 'PAYE' && i.detail ? ` <span style="font-size:11px;color:var(--text-muted)">(Med credits: ${formatCurrency(i.detail.medical_credits || 0)})</span>` : ''}</span>
                <span style="font-weight:500">${formatCurrency(i.amount)}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600;border-bottom:2px solid var(--border)">
              <span>Total Deductions</span>
              <span>${formatCurrency(summary.total_deductions)}</span>
            </div>

            <div style="display:flex;justify-content:space-between;font-size:15px;padding:10px 0;font-weight:700;color:var(--primary-dark);border-bottom:2px solid var(--primary-dark)">
              <span>Nett Pay</span>
              <span>${formatCurrency(summary.nett_pay)}</span>
            </div>

            ${companyItems.length > 0 ? `
              <h4 style="margin:12px 0 6px;font-size:13px;color:var(--info)">Company Contributions</h4>
              ${companyItems.map(i => `
                <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                  <span>${i.head_name}</span>
                  <span style="font-weight:500">${formatCurrency(i.amount)}</span>
                </div>
              `).join('')}
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600">
                <span>Total Cost to Company</span>
                <span>${formatCurrency(summary.total_cost_to_company)}</span>
              </div>
            ` : ''}
          </div>
        `;

        document.getElementById('btn-print-mock').style.display = '';
        UI.toast('success', 'Mock Payslip', `Nett pay: ${formatCurrency(summary.nett_pay)}`);
      } catch (err) {
        resultEl.innerHTML = `<div class="loading" style="color:var(--danger)">Calculation failed: ${err.message}</div>`;
        UI.toast('error', 'Calculation Failed', err.message);
      }
    });

    document.getElementById('btn-print-mock').addEventListener('click', () => {
      const content = document.getElementById('mock-payslip-result');
      if (!content) return;
      const printWin = window.open('', '_blank');
      printWin.document.write(`<html><head><title>Mock Payslip</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333} h3,h4{color:#0f2b46} div{box-sizing:border-box}</style></head><body>${content.innerHTML}</body></html>`);
      printWin.document.close();
      printWin.print();
    });
  },

  async showSingleEmployeeRunModal(runId) {
    let employeeOptions = [];
    try {
      const empRes = await api('/employees?limit=500&status=ACTIVE');
      employeeOptions = (empRes.data || []).map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    } catch (err) {
      employeeOptions = [];
    }

    const formFields = UI.buildForm([
      { type: 'section', label: 'Run Single Employee', icon: icon('user',16) },
      { id: 'single_emp_id', label: 'Select Employee', type: 'select', options: [{ value: '', label: '-- Select Employee --' }, ...employeeOptions], required: true }
    ]);

    UI.modal({
      title: `Run Single Employee - Run #${runId}`,
      size: 'md',
      content: `<div class="form-grid" id="single-emp-form">${formFields}</div><div id="single-emp-result" style="margin-top:16px"></div>`,
      footer: `<button class="btn" data-close-modal>Close</button><button class="btn btn-primary" id="btn-exec-single">${icon('activity',14)} Execute</button>`
    });

    document.getElementById('btn-exec-single').addEventListener('click', async () => {
      const form = document.getElementById('single-emp-form');
      const data = UI.getFormData(form);
      const empId = data.single_emp_id;
      if (!empId) {
        UI.toast('error', 'Validation Error', 'Please select an employee');
        return;
      }

      const resultEl = document.getElementById('single-emp-result');
      resultEl.innerHTML = '<div class="loading"><div class="spinner"></div>Executing payroll for employee...</div>';

      try {
        const res = await apiPost(`/payroll/runs/${runId}/execute-single`, { employee_id: parseInt(empId) });
        const empResults = res.data?.employee_results || [];
        const totals = res.data?.totals || {};

        const earningRows = empResults.filter(r => r.transaction_type === 'EARNING' || r.transaction_type === 'FRINGE_BENEFIT');
        const deductionRows = empResults.filter(r => r.transaction_type === 'DEDUCTION');
        const companyRows = empResults.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION');

        const totalEarnings = earningRows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        const totalDeductions = deductionRows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        const nett = totalEarnings - totalDeductions;

        resultEl.innerHTML = `
          ${UI.statCards([
            { label: 'Gross', value: formatCurrency(totalEarnings), color: '#10B981' },
            { label: 'PAYE', value: formatCurrency(totals.paye || 0), color: '#EF4444' },
            { label: 'UIF', value: formatCurrency(totals.uif || 0), color: '#F59E0B' },
            { label: 'SDL', value: formatCurrency(totals.sdl || 0), color: '#8B5CF6' },
            { label: 'Nett Pay', value: formatCurrency(nett), color: '#4F6AFF' }
          ])}
          <div class="data-grid" style="margin-top:12px">
            <table>
              <thead><tr><th>Code</th><th>Salary Head</th><th>Type</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${empResults.map(r => `
                  <tr>
                    <td><strong>${r.salary_head_code || '-'}</strong></td>
                    <td>${r.salary_head_name || '-'}</td>
                    <td><span class="badge badge-${r.transaction_type === 'EARNING' ? 'success' : r.transaction_type === 'DEDUCTION' ? 'danger' : 'info'}">${r.transaction_type}</span></td>
                    <td style="text-align:right;font-weight:500">${formatCurrency(r.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

        UI.toast('success', 'Single Employee Run', res.message || 'Payroll executed for employee');
        this.loadRuns();
      } catch (err) {
        resultEl.innerHTML = `<div class="loading" style="color:var(--danger)">Execution failed: ${err.message}</div>`;
        UI.toast('error', 'Execution Failed', err.message);
      }
    });
  },

  async showPayslipPreview(runId, employeeId) {
    const overlay = UI.modal({
      title: 'Payslip Preview',
      size: 'md',
      content: '<div class="loading"><div class="spinner"></div>Loading payslip...</div>'
    });

    try {
      const res = await api(`/payroll/runs/${runId}/payslip-preview/${employeeId}`);
      const data = res.data;
      const emp = data.employee || {};
      const run = data.run || {};
      const summary = data.summary || {};
      const earnings = data.earnings || [];
      const deductions = data.deductions || [];
      const companyContribs = data.company_contributions || [];

      const body = overlay.querySelector('.modal-body');
      body.innerHTML = `
        <div style="border:1px solid var(--border);border-radius:8px;padding:20px;background:#fff">
          <div style="display:flex;justify-content:space-between;border-bottom:2px solid var(--primary-dark);padding-bottom:12px;margin-bottom:16px">
            <div>
              <h3 style="margin:0;font-size:16px;color:var(--primary-dark)">${emp.name}</h3>
              <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">${emp.employee_code} | ${emp.position || '-'} | ${emp.department || '-'}</p>
            </div>
            <div style="text-align:right">
              <p style="margin:0;font-size:13px;font-weight:600">${run.cycle_name} - Period ${run.period_number}</p>
              <p style="margin:2px 0 0;font-size:12px;color:var(--text-muted)">Tax Year ${run.tax_year} | ${run.run_type} | Payment: ${run.payment_date?.split('T')[0] || '-'}</p>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
            <div>
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--success)">Earnings</h4>
              ${earnings.map(e => `
                <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                  <span>${e.salary_head_name || e.salary_head_code}</span>
                  <span style="font-weight:500">${formatCurrency(e.amount)}</span>
                </div>
              `).join('')}
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600;border-top:2px solid var(--border);margin-top:4px">
                <span>Gross Pay</span>
                <span>${formatCurrency(summary.gross_earnings)}</span>
              </div>
            </div>

            <div>
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--danger)">Deductions</h4>
              ${deductions.map(d => `
                <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                  <span>${d.salary_head_name || d.salary_head_code}</span>
                  <span style="font-weight:500">${formatCurrency(d.amount)}</span>
                </div>
              `).join('')}
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600;border-top:2px solid var(--border);margin-top:4px">
                <span>Total Deductions</span>
                <span>${formatCurrency(summary.total_deductions)}</span>
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:16px;padding:12px 0;font-weight:700;color:var(--primary-dark);border-top:3px solid var(--primary-dark);margin-top:12px">
            <span>Nett Pay</span>
            <span>${formatCurrency(summary.nett_pay)}</span>
          </div>

          ${companyContribs.length > 0 ? `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
              <h4 style="margin:0 0 8px;font-size:13px;color:var(--info)">Company Contributions</h4>
              ${companyContribs.map(c => `
                <div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dotted var(--border)">
                  <span>${c.salary_head_name || c.salary_head_code}</span>
                  <span style="font-weight:500">${formatCurrency(c.amount)}</span>
                </div>
              `).join('')}
              <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;font-weight:600">
                <span>Total Cost to Company</span>
                <span>${formatCurrency(summary.total_cost_to_company)}</span>
              </div>
            </div>
          ` : ''}

          ${UI.statCards([
            { label: 'PAYE', value: formatCurrency(summary.paye), color: '#EF4444' },
            { label: 'UIF', value: formatCurrency(summary.uif_employee), color: '#F59E0B' },
            { label: 'SDL', value: formatCurrency(summary.sdl), color: '#8B5CF6' }
          ])}
        </div>
      `;
    } catch (err) {
      const body = overlay.querySelector('.modal-body');
      body.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load payslip: ${err.message}</div>`;
    }
  },

  getSalaryHeadFormFields(existing) {
    return UI.buildForm([
      { type: 'section', label: existing ? 'Edit Salary Head' : 'Salary Head Definition', icon: icon('dollar',16) },
      { id: 'sh_code', label: 'Code', type: existing ? 'readonly' : 'text', required: true, placeholder: 'e.g. EARN001 or PROVIDENT_EE', maxlength: 50, value: existing?.code || '' },
      { id: 'sh_name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Provident Fund Employee', value: existing?.name || '' },
      { id: 'sh_transaction_type', label: 'Transaction Type', type: 'select', options: [
        { value: 'EARNING', label: 'Earning' },
        { value: 'DEDUCTION', label: 'Deduction' },
        { value: 'COMPANY_CONTRIBUTION', label: 'Company Contribution' },
        { value: 'FRINGE_BENEFIT', label: 'Fringe Benefit' }
      ], required: true, value: existing?.transaction_type || '' },
      { id: 'sh_calculation_method', label: 'Calculation Method', type: 'select', options: [
        { value: 'USER_INPUT', label: 'Fixed Amount (User Input)' },
        { value: 'PERCENTAGE_OF_BASIC', label: 'Percentage of Basic Salary' },
        { value: 'SYSTEM_CALCULATE', label: 'System Calculated (Statutory)' },
        { value: 'FIXED', label: 'Fixed (Same for All)' }
      ], value: existing?.calculation_method || 'USER_INPUT', hint: 'Percentage of Basic: engine auto-calculates from % of basic salary each period' },
      { type: 'section', label: 'Default Contribution Rates', icon: icon('percent',16) },
      { id: 'sh_employee_contribution', label: 'Employee Contribution %', type: 'number', min: 0, max: 100, step: '0.01', placeholder: '0.00', value: existing?.employee_contribution || '', hint: 'Default % when assigning to employees (can be overridden per employee)' },
      { id: 'sh_employer_contribution', label: 'Employer Contribution %', type: 'number', min: 0, max: 100, step: '0.01', placeholder: '0.00', value: existing?.employer_contribution || '', hint: 'Municipality portion % (creates matching company contribution)' },
      { type: 'section', label: 'SARS / IRP5', icon: icon('fileText',16) },
      { id: 'sh_irp5_code', label: 'IRP5 Source Code', type: 'text', placeholder: 'e.g. 3601', value: existing?.irp5_code || '' },
      { id: 'sh_sars_code', label: 'SARS Code', type: 'text', value: existing?.sars_code || '' },
      { type: 'section', label: 'Tax Flags', icon: icon('shield',16) },
      { id: 'sh_taxable', label: 'Taxable', type: 'checkbox', value: existing ? existing.taxable : true, checkLabel: 'Subject to income tax' },
      { id: 'sh_affects_uif', label: 'Affects UIF', type: 'checkbox', value: existing?.affects_uif || false, checkLabel: 'Included in UIF calculation' },
      { id: 'sh_affects_sdl', label: 'Affects SDL', type: 'checkbox', value: existing?.affects_sdl || false, checkLabel: 'Included in SDL calculation' },
      { type: 'section', label: 'mSCOA Accounting', icon: icon('grid',16) },
      { id: 'sh_scoa_debit_item', label: 'mSCOA Debit Item', type: 'text', placeholder: 'Loading...', value: existing?.scoa_debit_item || '', hint: 'Select from mSCOA items after form loads' },
      { id: 'sh_scoa_credit_item', label: 'mSCOA Credit Item', type: 'text', placeholder: 'Loading...', value: existing?.scoa_credit_item || '', hint: 'Select from mSCOA items after form loads' },
      { id: 'sh_show_on_payslip', label: 'Show on Payslip', type: 'checkbox', value: existing ? existing.show_on_payslip : true, checkLabel: 'Display on employee payslip' },
      { id: 'sh_priority', label: 'Processing Priority', type: 'number', placeholder: '0', value: existing?.priority || 0, hint: 'Lower = processed first. Earnings should be 1-99, deductions 100-199, company contribs 200-299' },
      { id: 'sh_start_date', label: 'Start Date', type: 'date', required: !existing, value: existing?.start_date ? existing.start_date.substring(0,10) : '' }
    ]);
  },

  async replaceScoaInputsWithDropdowns(formId, debitVal, creditVal) {
    try {
      const res = await api('/payroll/mscoa-items?item_type=DETAIL');
      const items = res.data || [];
      const opts = items.map(i => `<option value="${i.item_code}" ${i.balance_sheet ? 'data-bs="1"' : ''}>${i.item_code} - ${i.description}</option>`).join('');
      ['sh_scoa_debit_item', 'sh_scoa_credit_item'].forEach((id, idx) => {
        const input = document.querySelector(`#${formId} [name="${id}"], #${formId} #${id}`);
        if (!input) return;
        const val = idx === 0 ? debitVal : creditVal;
        const select = document.createElement('select');
        select.className = 'form-control';
        select.id = id;
        select.name = id;
        select.innerHTML = `<option value="">-- Select mSCOA Item --</option>${opts}`;
        if (val) select.value = val;
        input.replaceWith(select);
      });
    } catch (e) { console.error('Failed to load mSCOA items for dropdowns', e); }
  },

  showAddSalaryHeadModal() {
    const formFields = this.getSalaryHeadFormFields(null);

    UI.modal({
      title: 'Add Salary Head',
      content: `<div class="form-grid" id="add-sh-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-submit-sh">Create</button>`
    });
    this.replaceScoaInputsWithDropdowns('add-sh-form', '', '');

    document.getElementById('btn-submit-sh').addEventListener('click', async () => {
      const form = document.getElementById('add-sh-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation Error', errors[0]); return; }
      const data = UI.getFormData(form);
      try {
        await apiPost('/payroll/salary-heads', {
          code: data.sh_code, name: data.sh_name,
          transaction_type: data.sh_transaction_type,
          calculation_method: data.sh_calculation_method || 'USER_INPUT',
          irp5_code: data.sh_irp5_code, sars_code: data.sh_sars_code,
          taxable: data.sh_taxable, affects_uif: data.sh_affects_uif, affects_sdl: data.sh_affects_sdl,
          scoa_debit_item: data.sh_scoa_debit_item, scoa_credit_item: data.sh_scoa_credit_item,
          show_on_payslip: data.sh_show_on_payslip,
          employee_contribution: parseFloat(data.sh_employee_contribution) || 0,
          employer_contribution: parseFloat(data.sh_employer_contribution) || 0,
          priority: parseInt(data.sh_priority) || 0, start_date: data.sh_start_date
        });
        UI.closeModal();
        UI.toast('success', 'Salary Head Created', `${data.sh_name} has been added`);
        this.state.activeTab = 'salaryheads';
        this.renderTabContent();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async showEditSalaryHeadModal(id) {
    try {
      const res = await api('/payroll/salary-heads');
      const head = (res.data || []).find(h => h.id === id);
      if (!head) { UI.toast('error', 'Error', 'Salary head not found'); return; }

      const formFields = this.getSalaryHeadFormFields(head);
      const isSystem = head.calculation_method === 'SYSTEM_CALCULATE';

      UI.modal({
        title: `Edit Salary Head: ${head.code}`,
        content: `
          ${isSystem ? '<div style="padding:8px 12px;background:#fff3cd;border-radius:8px;margin-bottom:12px;font-size:12px;display:flex;align-items:center;gap:8px">' + icon('alertTriangle',16) + ' System-calculated head. Tax flags and calculation method are managed by the payroll engine.</div>' : ''}
          <div class="form-grid" id="edit-sh-form">${formFields}</div>
        `,
        footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-update-sh">Update</button>`
      });
      this.replaceScoaInputsWithDropdowns('edit-sh-form', head.scoa_debit_item || '', head.scoa_credit_item || '');

      document.getElementById('btn-update-sh').addEventListener('click', async () => {
        const form = document.getElementById('edit-sh-form');
        const data = UI.getFormData(form);
        try {
          const res = await fetch(API_BASE + `/payroll/salary-heads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.sh_name,
              transaction_type: data.sh_transaction_type,
              calculation_method: data.sh_calculation_method || 'USER_INPUT',
              irp5_code: data.sh_irp5_code, sars_code: data.sh_sars_code,
              taxable: data.sh_taxable, affects_uif: data.sh_affects_uif, affects_sdl: data.sh_affects_sdl,
              scoa_debit_item: data.sh_scoa_debit_item, scoa_credit_item: data.sh_scoa_credit_item,
              show_on_payslip: data.sh_show_on_payslip,
              employee_contribution: parseFloat(data.sh_employee_contribution) || 0,
              employer_contribution: parseFloat(data.sh_employer_contribution) || 0,
              priority: parseInt(data.sh_priority) || 0
            })
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
          UI.closeModal();
          UI.toast('success', 'Salary Head Updated', `${data.sh_name} has been updated`);
          this.state.activeTab = 'salaryheads';
          this.renderTabContent();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  deleteSalaryHead(id, code, name) {
    UI.confirm({
      title: 'Delete Salary Head',
      message: `Are you sure you want to delete <strong>${code} - ${name}</strong>? If this head has been used in historical payroll runs, it will be disabled instead of deleted.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(API_BASE + `/payroll/salary-heads/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error?.message || 'Delete failed');
          UI.toast('success', 'Salary Head Removed', result.data?.message || `${code} has been removed`);
          this.state.activeTab = 'salaryheads';
          this.renderTabContent();
        } catch (err) {
          UI.toast('error', 'Error', err.message);
        }
      }
    });
  },

  async renderSalaryIncreasesTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading salary increases...</div>';
    try {
      const res = await api('/payroll/salary-increases').catch(() => ({ data: [] }));
      const increases = res.data || [];

      el.innerHTML = `
        <div class="toolbar">
          <div style="display:flex;gap:8px;align-items:center">
            <select id="si-status-filter" class="toolbar-filter-select">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="APPLIED">Applied</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" id="btn-mass-increase">${icon('trendingUp',14)} Mass Increase</button>
            <button class="btn" id="btn-apply-all-increases">${icon('check',14)} Apply All Approved</button>
          </div>
        </div>
        <div id="si-list"></div>
      `;

      this.renderSalaryIncreasesList(increases);

      document.getElementById('btn-mass-increase')?.addEventListener('click', () => this.showMassIncreaseModal());
      document.getElementById('btn-apply-all-increases')?.addEventListener('click', () => this.applyAllIncreases());
      document.getElementById('si-status-filter')?.addEventListener('change', async (e) => {
        const status = e.target.value;
        const filtered = await api(`/payroll/salary-increases${status ? '?status=' + status : ''}`).catch(() => ({ data: [] }));
        this.renderSalaryIncreasesList(filtered.data || []);
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load salary increases: ${err.message}</div>`;
    }
  },

  renderSalaryIncreasesList(increases) {
    const listEl = document.getElementById('si-list');
    if (!listEl) return;

    if (increases.length === 0) {
      listEl.innerHTML = UI.emptyState(icon('trendingUp',32), 'No Salary Increases', 'Use "Mass Increase" to create salary increases for employees');
      return;
    }

    const rows = increases.map(si => {
      const oldSal = parseFloat(si.old_salary) || 0;
      const newSal = parseFloat(si.new_salary) || 0;
      const pctChange = oldSal > 0 ? (((newSal - oldSal) / oldSal) * 100).toFixed(1) : '0.0';
      return `
      <tr>
        <td><strong>${si.employee_code || '-'}</strong></td>
        <td>${si.first_name || ''} ${si.surname || ''}</td>
        <td style="text-align:right">${formatCurrency(oldSal)}</td>
        <td style="text-align:right;font-weight:600">${formatCurrency(newSal)}</td>
        <td style="text-align:right;color:var(--success)">${pctChange}%</td>
        <td><span class="status-badge status-${(si.status || '').toLowerCase()}">${si.status || '-'}</span></td>
        <td>
          <div class="action-bar">
            ${si.status === 'PENDING' ? `<button class="action-btn success" data-si-approve="${si.id}" title="Approve">${icon('check',14)}</button>` : ''}
            ${si.status === 'APPROVED' ? `<button class="action-btn" data-si-apply="${si.id}" title="Apply">${icon('activity',14)}</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    listEl.innerHTML = `
      <div class="data-grid">
        <table>
          <thead><tr><th>Employee Code</th><th>Employee</th><th style="text-align:right">Old Salary</th><th style="text-align:right">New Salary</th><th style="text-align:right">% Change</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    listEl.querySelectorAll('[data-si-approve]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiPost(`/payroll/salary-increases/${btn.dataset.siApprove}/approve`);
          UI.toast('success', 'Approved', 'Salary increase approved');
          this.renderTabContent();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });

    listEl.querySelectorAll('[data-si-apply]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiPost(`/payroll/salary-increases/${btn.dataset.siApply}/apply`);
          UI.toast('success', 'Applied', 'Salary increase applied to employee');
          this.renderTabContent();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });
  },

  async showMassIncreaseModal() {
    let deptOptions = [{ value: '', label: 'All Departments' }];
    try {
      const deptRes = await api('/departments');
      (deptRes.data || []).forEach(d => deptOptions.push({ value: String(d.id), label: d.name }));
    } catch (e) {}

    const formFields = UI.buildForm([
      { type: 'section', label: 'Mass Salary Increase', icon: icon('trendingUp',16) },
      { id: 'mi_method', label: 'Increase Type', type: 'select', options: [
        { value: 'PERCENTAGE', label: 'Percentage Increase (%)' },
        { value: 'AMOUNT', label: 'Fixed Amount (R)' },
        { value: 'NOTCH', label: 'Notch Progression' },
      ], required: true },
      { id: 'mi_value', label: 'Increase Value', type: 'number', min: 0, step: '0.01', required: true, hint: 'Percentage or Rand amount depending on type' },
      { id: 'mi_effective_date', label: 'Effective Date', type: 'date', required: true },
      { id: 'mi_department_filter', label: 'Filter by Department', type: 'select', options: deptOptions, hint: 'Select a department or leave as All' },
    ]);

    UI.modal({
      title: 'Mass Salary Increase',
      size: 'md',
      content: `<div class="form-grid" id="mass-increase-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-submit-mass-increase">${icon('trendingUp',14)} Generate Increases</button>`
    });

    document.getElementById('btn-submit-mass-increase')?.addEventListener('click', async () => {
      const form = document.getElementById('mass-increase-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation Error', errors[0]); return; }
      const data = UI.getFormData(form);
      try {
        const res = await apiPost('/payroll/salary-increases/mass', {
          increase_type: data.mi_method,
          increase_value: parseFloat(data.mi_value),
          effective_date: data.mi_effective_date,
          department_filter: data.mi_department_filter || null,
        });
        UI.closeModal();
        UI.toast('success', 'Mass Increase Created', res.message || 'Salary increases generated successfully');
        this.state.activeTab = 'salaryincreases';
        this.renderTabContent();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async applyAllIncreases() {
    const confirmed = await UI.confirm({
      title: 'Apply All Approved Increases',
      message: 'This will apply all approved salary increases to employee records. Employee salaries will be updated immediately. Continue?',
      icon: icon('alertTriangle', 28),
      confirmText: 'Apply All',
      danger: false
    });
    if (!confirmed) return;
    try {
      const res = await apiPost('/payroll/salary-increases/apply-all');
      UI.toast('success', 'Increases Applied', res.message || 'All approved salary increases have been applied');
      this.state.activeTab = 'salaryincreases';
      this.renderTabContent();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderGRAP25Tab(el) {
    el.innerHTML = `
      <div style="margin-bottom:24px">
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:600">GRAP 25 - Employee Benefits Accruals</h3>
        <p style="font-size:13px;color:var(--text-muted);margin:0">Post leave liability and bonus accrual journals as required by GRAP 25 (Employee Benefits)</p>
      </div>
      ${UI.statCards([
        { label: 'Leave Liability', value: '...', color: '#4F6AFF' },
        { label: 'Bonus Accrual', value: '...', color: '#F59E0B' },
      ])}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
        <div style="padding:20px;background:#fff;border:1px solid var(--border);border-radius:8px">
          <h4 style="margin:0 0 8px;font-size:15px;display:flex;align-items:center;gap:8px">${icon('calendar',16)} Leave Liability</h4>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Calculate total outstanding leave balance liability across all employees. Posts a GL journal for the leave provision.</p>
          <div class="form-group" style="margin-bottom:12px">
            <label>As At Date</label>
            <input type="date" class="form-control" id="grap25-leave-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="grap25_ll_post_journal" style="width:16px;height:16px">
              Post journal entry to GL
            </label>
          </div>
          <button class="btn btn-primary" id="btn-post-leave-liability">${icon('book',14)} Calculate Leave Liability</button>
          <div id="leave-liability-result" style="margin-top:12px"></div>
        </div>
        <div style="padding:20px;background:#fff;border:1px solid var(--border);border-radius:8px">
          <h4 style="margin:0 0 8px;font-size:15px;display:flex;align-items:center;gap:8px">${icon('dollar',16)} Bonus Accrual (13th Cheque)</h4>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Calculate pro-rata 13th cheque provision for all employees. Posts a GL journal for the bonus accrual.</p>
          <div class="form-group" style="margin-bottom:12px">
            <label>As At Date</label>
            <input type="date" class="form-control" id="grap25-bonus-date" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div style="margin-bottom:12px">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" id="grap25_ba_post_journal" style="width:16px;height:16px">
              Post journal entry to GL
            </label>
          </div>
          <button class="btn btn-primary" id="btn-post-bonus-accrual">${icon('book',14)} Calculate Bonus Accrual</button>
          <div id="bonus-accrual-result" style="margin-top:12px"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-post-leave-liability')?.addEventListener('click', async () => {
      const asAtDate = document.getElementById('grap25-leave-date')?.value;
      const postJournal = document.getElementById('grap25_ll_post_journal')?.checked || false;
      const resultDiv = document.getElementById('leave-liability-result');
      resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating...</div>';
      try {
        const res = await apiPost('/payroll/leave-liability', { as_at_date: asAtDate, post_journal: postJournal });
        const data = res.data || res;
        resultDiv.innerHTML = `
          <div style="padding:12px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px">
            <div style="font-weight:600;color:#059669;margin-bottom:4px">Leave Liability Posted</div>
            <div style="font-size:13px;color:#475569">
              Total Liability: <strong>${formatCurrency(data.total_liability || 0)}</strong><br>
              Employees: ${data.employee_count || 0}<br>
              Journal Reference: ${data.journal_reference || '-'}
            </div>
          </div>
        `;
        UI.toast('success', 'Leave Liability Posted', 'GL journal created successfully');
      } catch (err) {
        resultDiv.innerHTML = `<div style="padding:12px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;color:#DC2626;font-size:13px">${err.message}</div>`;
      }
    });

    document.getElementById('btn-post-bonus-accrual')?.addEventListener('click', async () => {
      const asAtDate = document.getElementById('grap25-bonus-date')?.value;
      const postJournal = document.getElementById('grap25_ba_post_journal')?.checked || false;
      const resultDiv = document.getElementById('bonus-accrual-result');
      resultDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating...</div>';
      try {
        const res = await apiPost('/payroll/bonus-accrual', { as_at_date: asAtDate, post_journal: postJournal });
        const data = res.data || res;
        resultDiv.innerHTML = `
          <div style="padding:12px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px">
            <div style="font-weight:600;color:#059669;margin-bottom:4px">Bonus Accrual Posted</div>
            <div style="font-size:13px;color:#475569">
              Total Accrual: <strong>${formatCurrency(data.total_accrual || 0)}</strong><br>
              Employees: ${data.employee_count || 0}<br>
              Journal Reference: ${data.journal_reference || '-'}
            </div>
          </div>
        `;
        UI.toast('success', 'Bonus Accrual Posted', 'GL journal created successfully');
      } catch (err) {
        resultDiv.innerHTML = `<div style="padding:12px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;color:#DC2626;font-size:13px">${err.message}</div>`;
      }
    });
  },

  async renderCouncillorRegisterTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading councillor register...</div>';
    try {
      const res = await api('/payroll/councillor-register').catch(() => ({ data: [] }));
      const councillors = res.data || [];

      if (councillors.length === 0) {
        el.innerHTML = `
          <div style="margin-bottom:16px">
            <h3 style="margin:0 0 8px;font-size:16px;font-weight:600">Councillor Register</h3>
            <p style="font-size:13px;color:var(--text-muted);margin:0">Upper Limit Remuneration Framework for Municipal Councillors</p>
          </div>
          ${UI.emptyState(icon('users',32), 'No Councillors Found', 'No employees are marked as councillors. Set is_councillor flag on employee records to populate this register.')}
        `;
        return;
      }

      const rows = councillors.map(c => {
        const pct = c.upper_limit > 0 ? ((parseFloat(c.annual_salary) || 0) / parseFloat(c.upper_limit) * 100).toFixed(1) : '-';
        const overLimit = c.upper_limit > 0 && parseFloat(c.annual_salary) > parseFloat(c.upper_limit);
        return `
          <tr style="${overLimit ? 'background:rgba(239,68,68,0.06)' : ''}">
            <td><strong>${c.employee_code || '-'}</strong></td>
            <td>${c.first_name || ''} ${c.surname || ''}</td>
            <td>${c.position_title || c.position_type || '-'}</td>
            <td>${c.council_category || '-'}</td>
            <td style="text-align:right">${formatCurrency(c.annual_salary || 0)}</td>
            <td style="text-align:right">${c.upper_limit ? formatCurrency(c.upper_limit) : '-'}</td>
            <td style="text-align:right;color:${overLimit ? 'var(--danger)' : 'var(--success)'};font-weight:600">${pct}%</td>
            <td>${overLimit ? '<span class="badge badge-danger">Over Limit</span>' : '<span class="badge badge-success">Within Limit</span>'}</td>
          </tr>`;
      }).join('');

      el.innerHTML = `
        <div style="margin-bottom:16px">
          <h3 style="margin:0 0 8px;font-size:16px;font-weight:600">Councillor Register</h3>
          <p style="font-size:13px;color:var(--text-muted);margin:0">Upper Limit Remuneration Framework per Government Gazette for Municipal Councillors</p>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Code</th><th>Councillor</th><th>Position</th><th>Category</th><th style="text-align:right">Remuneration</th><th style="text-align:right">Upper Limit</th><th style="text-align:right">% of Limit</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load councillor register: ${err.message}</div>`;
    }
  }
};
