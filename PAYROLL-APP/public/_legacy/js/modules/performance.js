const PerformanceModule = {
  state: {
    activeTab: 'indicators',
    periods: [],
    employees: [],
    goals: [],
    selectedPeriod: null,
    indicatorsPage: 1,
    reviewsPage: 1,
    selectedReviewEmployee: null,
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

  async apiPut(endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
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
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading performance...</div>';
    try {
      const [periods, empData] = await Promise.all([
        api('/performance/periods'),
        api('/employees?limit=200&sort_by=surname&sort_order=asc'),
      ]);
      this.state.periods = periods.data;
      this.state.employees = empData.data;

      if (periods.data.length > 0 && !this.state.selectedPeriod) {
        this.state.selectedPeriod = periods.data[0].id;
      }

      el.innerHTML = `
        ${UI.detailTabs([
          { id: 'indicators', label: 'KPA/KPI Indicators', icon: icon('activity',14) },
          { id: 'periods', label: 'Assessment Periods', icon: icon('calendar',14) },
          { id: 'scoring', label: 'Quarterly Scoring', icon: icon('barChart',14) },
          { id: 'reviews', label: 'Reviews', icon: icon('fileText',14) },
          { id: '360', label: '360 Feedback', icon: icon('users',14) },
          { id: 'pip', label: 'PIP', icon: icon('alertTriangle',14) },
          { id: 'goals', label: 'Goal Alignment', icon: icon('target',14) },
        ], this.state.activeTab)}
        <div id="perf-tab-content"></div>
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
    const el = document.getElementById('perf-tab-content');
    if (!el) return;
    switch (this.state.activeTab) {
      case 'indicators': this.renderIndicatorsTab(el); break;
      case 'periods': this.renderPeriodsTab(el); break;
      case 'scoring': this.renderScoringTab(el); break;
      case 'reviews': this.renderReviews(el); break;
      case '360': this.render360Tab(el); break;
      case 'pip': this.renderPIPTab(el); break;
      case 'goals': this.renderGoalsTab(el); break;
    }
  },

  async renderIndicatorsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading indicators...</div>';
    try {
      const periodParam = this.state.selectedPeriod ? `&period_id=${this.state.selectedPeriod}` : '';
      const data = await api(`/performance/indicators?limit=20&page=${this.state.indicatorsPage}${periodParam}`);
      const periodOpts = this.state.periods.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPeriod ? 'selected' : ''}>${p.name} (${p.financial_year})</option>`).join('');

      const rows = data.data.map(ind => {
        const score = ind.score !== null && ind.score !== undefined ? ind.score : '-';
        const scoreColor = ind.score >= 4 ? '#10B981' : ind.score >= 3 ? '#3B82F6' : ind.score >= 2 ? '#F59E0B' : ind.score >= 1 ? '#EF4444' : '#94A3B8';
        return `
          <tr class="clickable-row" onclick="PerformanceModule.viewIndicator(${ind.id})">
            <td>${ind.employee_code} - ${ind.first_name} ${ind.surname}</td>
            <td><strong>${ind.kpa}</strong></td>
            <td>${ind.kpi}</td>
            <td style="text-align:center">${ind.weighting || 0}%</td>
            <td style="text-align:center">${ind.annual_target || '-'}</td>
            <td style="text-align:center">${ind.q1_actual || '-'}</td>
            <td style="text-align:center">${ind.q2_actual || '-'}</td>
            <td style="text-align:center">${ind.q3_actual || '-'}</td>
            <td style="text-align:center">${ind.q4_actual || '-'}</td>
            <td style="text-align:center;font-weight:700;color:${scoreColor}">${score}</td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filter">
            <select id="perf-period-filter" class="toolbar-filter-select">${periodOpts}</select>
          </div>
          <div class="toolbar-search"><input type="text" placeholder="Search indicators..." data-search></div>
          <button class="btn btn-primary" onclick="PerformanceModule.showAddIndicator()">Add KPA/KPI</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>KPA</th>
                <th>KPI</th>
                <th style="text-align:center">Weight</th>
                <th style="text-align:center">Target</th>
                <th style="text-align:center">Q1</th>
                <th style="text-align:center">Q2</th>
                <th style="text-align:center">Q3</th>
                <th style="text-align:center">Q4</th>
                <th style="text-align:center">Score</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="10" style="text-align:center;color:var(--text-muted)">No performance indicators found</td></tr>'}</tbody>
          </table>
        </div>
        ${data.meta.total > 20 ? UI.pagination({ page: this.state.indicatorsPage, limit: 20, total: data.meta.total, onPageChange: 'PerformanceModule.goIndicatorsPage' }) : ''}
      `;

      document.getElementById('perf-period-filter')?.addEventListener('change', (e) => {
        this.state.selectedPeriod = parseInt(e.target.value);
        this.state.indicatorsPage = 1;
        this.renderTab();
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  goIndicatorsPage(page) {
    this.state.indicatorsPage = page;
    this.renderTab();
  },

  renderPeriodsTab(el) {
    const rows = this.state.periods.map(p => {
      const statusClass = (p.status || '').toLowerCase();
      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.financial_year}</td>
          <td>${p.start_date ? p.start_date.split('T')[0] : '-'}</td>
          <td>${p.end_date ? p.end_date.split('T')[0] : '-'}</td>
          <td><span class="status-badge status-${statusClass}">${p.status}</span></td>
          <td>
            <button class="action-btn" onclick="PerformanceModule.selectPeriod(${p.id})">View Indicators</button>
          </td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr><th>Period Name</th><th>Financial Year</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No performance periods configured</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  selectPeriod(periodId) {
    this.state.selectedPeriod = periodId;
    this.state.activeTab = 'indicators';
    this.state.indicatorsPage = 1;
    const moduleBody = document.getElementById('module-body');
    if (moduleBody) this.render(moduleBody);
  },

  async renderScoringTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading scoring data...</div>';
    try {
      const periodParam = this.state.selectedPeriod ? `&period_id=${this.state.selectedPeriod}` : '';
      const data = await api(`/performance/indicators?limit=50${periodParam}`);
      const periodOpts = this.state.periods.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPeriod ? 'selected' : ''}>${p.name} (${p.financial_year})</option>`).join('');

      const byEmployee = {};
      data.data.forEach(ind => {
        const key = ind.employee_id;
        if (!byEmployee[key]) {
          byEmployee[key] = {
            name: `${ind.employee_code} - ${ind.first_name} ${ind.surname}`,
            indicators: [],
            totalWeight: 0,
            weightedScore: 0,
          };
        }
        byEmployee[key].indicators.push(ind);
        const w = parseFloat(ind.weighting) || 0;
        const s = parseFloat(ind.score) || 0;
        byEmployee[key].totalWeight += w;
        byEmployee[key].weightedScore += w * s;
      });

      const empRows = Object.entries(byEmployee).map(([empId, emp]) => {
        const avgScore = emp.totalWeight > 0 ? (emp.weightedScore / emp.totalWeight).toFixed(1) : '-';
        const scoreNum = parseFloat(avgScore);
        const scoreColor = scoreNum >= 4 ? '#10B981' : scoreNum >= 3 ? '#3B82F6' : scoreNum >= 2 ? '#F59E0B' : scoreNum >= 1 ? '#EF4444' : '#94A3B8';
        const ratingLabel = scoreNum >= 4 ? 'Outstanding' : scoreNum >= 3 ? 'Good' : scoreNum >= 2 ? 'Needs Improvement' : scoreNum >= 1 ? 'Unsatisfactory' : 'Not Scored';
        return `
          <tr>
            <td>${emp.name}</td>
            <td style="text-align:center">${emp.indicators.length}</td>
            <td style="text-align:center">${emp.totalWeight.toFixed(0)}%</td>
            <td style="text-align:center;font-weight:700;color:${scoreColor}">${avgScore}</td>
            <td><span class="badge" style="background:${scoreColor}20;color:${scoreColor}">${ratingLabel}</span></td>
            <td>
              <button class="action-btn" onclick="PerformanceModule.showScoreEntry(${empId})">Score</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filter">
            <select id="scoring-period-filter" class="toolbar-filter-select">${periodOpts}</select>
          </div>
          <div class="toolbar-search"><input type="text" placeholder="Search employees..." data-search></div>
        </div>
        ${UI.statCards([
          { value: Object.keys(byEmployee).length, label: 'Employees Assessed', color: '#3B82F6' },
          { value: data.data.length, label: 'Total KPIs', color: '#8B5CF6' },
          { value: data.data.filter(i => i.score > 0).length, label: 'KPIs Scored', color: '#10B981' },
          { value: data.data.filter(i => !i.score).length, label: 'Pending Scoring', color: '#F59E0B' },
        ])}
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th style="text-align:center">KPIs</th><th style="text-align:center">Weight</th><th style="text-align:center">Avg Score</th><th>Rating</th><th>Actions</th></tr>
            </thead>
            <tbody>${empRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No scoring data available</td></tr>'}</tbody>
          </table>
        </div>
      `;

      document.getElementById('scoring-period-filter')?.addEventListener('change', (e) => {
        this.state.selectedPeriod = parseInt(e.target.value);
        this.renderTab();
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showAddIndicator() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const periodOpts = this.state.periods.map(p => ({ value: p.id, label: `${p.name} (${p.financial_year})` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'KPA/KPI Details', icon: icon('clipboard',16) },
      { id: 'kpi_period_id', label: 'Assessment Period', type: 'select', options: periodOpts, required: true, value: this.state.selectedPeriod },
      { id: 'kpi_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'kpi_kpa', label: 'Key Performance Area (KPA)', type: 'text', required: true, placeholder: 'e.g. Financial Management', fullWidth: true },
      { id: 'kpi_kpi', label: 'Key Performance Indicator (KPI)', type: 'textarea', required: true, placeholder: 'e.g. Submit monthly financial reports by the 15th', fullWidth: true },
      { type: 'section', label: 'Measurement', icon: icon('barChart',16) },
      { id: 'kpi_unit_of_measure', label: 'Unit of Measure', type: 'text', placeholder: 'e.g. %, Number, Date' },
      { id: 'kpi_baseline', label: 'Baseline', type: 'text', placeholder: 'Current performance level' },
      { id: 'kpi_annual_target', label: 'Annual Target', type: 'text', placeholder: 'Expected result' },
      { id: 'kpi_weighting', label: 'Weighting (%)', type: 'number', min: 0, max: 100, step: 1, placeholder: 'e.g. 20' },
      { type: 'section', label: 'Quarterly Targets', icon: icon('activity',16) },
      { id: 'kpi_q1_target', label: 'Q1 Target', type: 'text', placeholder: 'Jul-Sep target' },
      { id: 'kpi_q2_target', label: 'Q2 Target', type: 'text', placeholder: 'Oct-Dec target' },
      { id: 'kpi_q3_target', label: 'Q3 Target', type: 'text', placeholder: 'Jan-Mar target' },
      { id: 'kpi_q4_target', label: 'Q4 Target', type: 'text', placeholder: 'Apr-Jun target' },
    ]);

    UI.modal({
      title: 'Add KPA/KPI Indicator',
      size: 'lg',
      content: `<div class="form-grid" id="add-indicator-form">${fields}</div>
        <div style="margin-top:12px;padding:12px;background:#F0FDF4;border-radius:8px;font-size:13px;color:#166534">
          <strong>SDBIP Alignment:</strong> KPAs should align with the municipality's Service Delivery and Budget Implementation Plan objectives. Weightings across all KPAs for an employee should total 100%.
        </div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="PerformanceModule.submitIndicator()">Save Indicator</button>
      `,
    });
  },

  async submitIndicator() {
    const form = document.getElementById('add-indicator-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/performance/indicators', {
        period_id: parseInt(data.kpi_period_id),
        employee_id: parseInt(data.kpi_employee_id),
        kpa: data.kpi_kpa,
        kpi: data.kpi_kpi,
        unit_of_measure: data.kpi_unit_of_measure,
        baseline: data.kpi_baseline,
        annual_target: data.kpi_annual_target,
        q1_target: data.kpi_q1_target,
        q2_target: data.kpi_q2_target,
        q3_target: data.kpi_q3_target,
        q4_target: data.kpi_q4_target,
        weighting: data.kpi_weighting || 0,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'Performance indicator added successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async viewIndicator(id) {
    try {
      const result = await api(`/performance/indicators/${id}`);
      const ind = result.data;

      const content = `
        <div class="info-grid" style="margin-bottom:20px">
          <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${ind.employee_code} - ${ind.first_name} ${ind.surname}</div></div>
          <div class="info-item"><div class="info-label">Period</div><div class="info-value">${ind.period_name}</div></div>
          <div class="info-item"><div class="info-label">Weighting</div><div class="info-value">${ind.weighting || 0}%</div></div>
          <div class="info-item"><div class="info-label">Unit of Measure</div><div class="info-value">${ind.unit_of_measure || '-'}</div></div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-weight:600;margin-bottom:4px">KPA</div>
          <div style="padding:8px 12px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0">${ind.kpa}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-weight:600;margin-bottom:4px">KPI</div>
          <div style="padding:8px 12px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0">${ind.kpi}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-weight:600;margin-bottom:4px">Baseline & Annual Target</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Baseline</div><div class="info-value">${ind.baseline || '-'}</div></div>
            <div class="info-item"><div class="info-label">Annual Target</div><div class="info-value">${ind.annual_target || '-'}</div></div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead>
            <tr style="background:#F8FAFC"><th style="padding:8px;border:1px solid #E2E8F0;text-align:center">Quarter</th><th style="padding:8px;border:1px solid #E2E8F0;text-align:center">Target</th><th style="padding:8px;border:1px solid #E2E8F0;text-align:center">Actual</th></tr>
          </thead>
          <tbody>
            <tr><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">Q1 (Jul-Sep)</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q1_target || '-'}</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q1_actual || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">Q2 (Oct-Dec)</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q2_target || '-'}</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q2_actual || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">Q3 (Jan-Mar)</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q3_target || '-'}</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q3_actual || '-'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">Q4 (Apr-Jun)</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q4_target || '-'}</td><td style="padding:8px;border:1px solid #E2E8F0;text-align:center">${ind.q4_actual || '-'}</td></tr>
          </tbody>
        </table>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Score</div><div class="info-value" style="font-size:24px;font-weight:700">${ind.score || 'Not scored'}</div></div>
          <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(ind.status||'').toLowerCase()}">${ind.status || 'DRAFT'}</span></div></div>
        </div>
      `;

      UI.modal({
        title: 'Performance Indicator Details',
        size: 'lg',
        content: content,
        footer: `
          <button class="btn" data-close-modal>Close</button>
          <button class="btn btn-primary" onclick="PerformanceModule.showScoreIndicator(${ind.id})">Record Score</button>
        `,
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  showScoreIndicator(id) {
    UI.closeModal();
    setTimeout(() => {
      const fields = UI.buildForm([
        { type: 'section', label: 'Quarterly Actuals', icon: icon('barChart',16) },
        { id: 'score_q1_actual', label: 'Q1 Actual (Jul-Sep)', type: 'text', placeholder: 'Actual performance' },
        { id: 'score_q2_actual', label: 'Q2 Actual (Oct-Dec)', type: 'text', placeholder: 'Actual performance' },
        { id: 'score_q3_actual', label: 'Q3 Actual (Jan-Mar)', type: 'text', placeholder: 'Actual performance' },
        { id: 'score_q4_actual', label: 'Q4 Actual (Apr-Jun)', type: 'text', placeholder: 'Actual performance' },
        { type: 'section', label: 'Assessment', icon: icon('award',16) },
        { id: 'score_score', label: 'Performance Score', type: 'select', required: true, options: [
          { value: '5', label: '5 - Outstanding Performance' },
          { value: '4', label: '4 - Performance Significantly Above Expectations' },
          { value: '3', label: '3 - Fully Effective Performance' },
          { value: '2', label: '2 - Performance Not Fully Effective' },
          { value: '1', label: '1 - Unacceptable Performance' },
        ]},
        { id: 'score_status', label: 'Status', type: 'select', options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'SUBMITTED', label: 'Submitted' },
          { value: 'REVIEWED', label: 'Reviewed' },
          { value: 'APPROVED', label: 'Approved' },
        ]},
      ]);

      UI.modal({
        title: 'Record Performance Score',
        content: `<div class="form-grid" id="score-indicator-form">${fields}</div>
          <div style="margin-top:12px;padding:12px;background:#F5F3FF;border-radius:8px;font-size:13px;color:#5B21B6">
            <strong>Scoring Guide:</strong> 5=Outstanding, 4=Above Expectations, 3=Fully Effective, 2=Not Fully Effective, 1=Unacceptable. Score should reflect actual vs target performance.
          </div>`,
        footer: `
          <button class="btn" data-close-modal>Cancel</button>
          <button class="btn btn-primary" onclick="PerformanceModule.submitScore(${id})">Save Score</button>
        `,
      });
    }, 250);
  },

  async submitScore(id) {
    const form = document.getElementById('score-indicator-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    const body = {};
    if (data.score_q1_actual) body.q1_actual = data.score_q1_actual;
    if (data.score_q2_actual) body.q2_actual = data.score_q2_actual;
    if (data.score_q3_actual) body.q3_actual = data.score_q3_actual;
    if (data.score_q4_actual) body.q4_actual = data.score_q4_actual;
    if (data.score_score) body.score = parseFloat(data.score_score);
    if (data.score_status) body.status = data.score_status;

    try {
      await this.apiPut(`/performance/indicators/${id}`, body);
      UI.closeModal();
      UI.toast('success', 'Scored', 'Performance score recorded successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async showScoreEntry(employeeId) {
    try {
      const periodParam = this.state.selectedPeriod ? `&period_id=${this.state.selectedPeriod}` : '';
      const data = await api(`/performance/indicators?limit=50&employee_id=${employeeId}${periodParam}`);
      const indicators = data.data;

      if (indicators.length === 0) {
        UI.toast('info', 'No KPIs', 'No performance indicators found for this employee');
        return;
      }

      const emp = indicators[0];
      const rows = indicators.map(ind => {
        const scoreVal = ind.score || '';
        return `
          <tr>
            <td style="max-width:200px"><strong>${ind.kpa}</strong></td>
            <td style="max-width:250px">${ind.kpi}</td>
            <td style="text-align:center">${ind.weighting || 0}%</td>
            <td style="text-align:center">${ind.annual_target || '-'}</td>
            <td style="text-align:center">
              <select class="form-control" data-indicator-id="${ind.id}" data-field="score" style="width:60px;padding:4px;font-size:12px">
                <option value="">-</option>
                <option value="1" ${scoreVal == 1 ? 'selected' : ''}>1</option>
                <option value="2" ${scoreVal == 2 ? 'selected' : ''}>2</option>
                <option value="3" ${scoreVal == 3 ? 'selected' : ''}>3</option>
                <option value="4" ${scoreVal == 4 ? 'selected' : ''}>4</option>
                <option value="5" ${scoreVal == 5 ? 'selected' : ''}>5</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');

      UI.modal({
        title: `Performance Scoring - ${emp.first_name} ${emp.surname}`,
        size: 'xl',
        content: `
          <div class="data-grid">
            <table>
              <thead>
                <tr><th>KPA</th><th>KPI</th><th style="text-align:center">Weight</th><th style="text-align:center">Target</th><th style="text-align:center">Score</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `,
        footer: `
          <button class="btn" data-close-modal>Cancel</button>
          <button class="btn btn-primary" onclick="PerformanceModule.submitBulkScores()">Save All Scores</button>
        `,
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async render360Tab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading 360 feedback...</div>';
    try {
      const data = await api('/performance/feedback-360');
      const rows = (data.data || []).map(fb => {
        const statusClass = (fb.status || '').toLowerCase();
        return `
          <tr>
            <td>${fb.employee_name || (fb.first_name ? fb.first_name + ' ' + fb.surname : '-')}</td>
            <td>${fb.review_period || '-'}</td>
            <td><span class="status-badge status-${statusClass}">${fb.status || 'DRAFT'}</span></td>
            <td style="text-align:center">${fb.response_count || 0}</td>
            <td>${fb.initiated_date ? fb.initiated_date.split('T')[0] : '-'}</td>
            <td>
              <button class="btn btn-sm" onclick="PerformanceModule.view360(${fb.id})">${icon('eye',12)}</button>
              <button class="btn btn-sm" onclick="PerformanceModule.add360Response(${fb.id})">${icon('plus',12)}</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('users',16)} 360 Feedback</div>
          <button class="btn btn-primary" onclick="PerformanceModule.show360Form()">${icon('plus',14)} Initiate 360 Feedback</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Review Period</th><th>Status</th><th style="text-align:center">Responses</th><th>Initiated</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No 360 feedback records found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  show360Form() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const periodOpts = this.state.periods.map(p => ({ value: p.id, label: `${p.name} (${p.financial_year})` }));
    const fields = UI.buildForm([
      { id: 'fb360_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'fb360_period_id', label: 'Review Period', type: 'select', options: periodOpts, required: true },
      { id: 'fb360_due_date', label: 'Due Date', type: 'date' },
    ]);
    UI.modal({
      title: 'Initiate 360 Feedback',
      content: `<div class="form-grid" id="fb360-form">${fields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="PerformanceModule.submit360()">Create</button>`,
    });
  },

  async submit360() {
    const form = document.getElementById('fb360-form');
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/performance/feedback-360', {
        employee_id: parseInt(data.fb360_employee_id),
        period_id: parseInt(data.fb360_period_id),
        due_date: data.fb360_due_date || null,
      });
      UI.closeModal();
      UI.toast('success', 'Created', '360 feedback initiated successfully');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async view360(id) {
    try {
      const result = await api(`/performance/feedback-360/${id}`);
      const fb = result.data;
      const responses = fb.responses || [];
      const respRows = responses.map(r => `
        <tr>
          <td>${r.reviewer_name || '-'}</td>
          <td>${r.relationship || '-'}</td>
          <td style="text-align:center;font-weight:700">${r.score !== null && r.score !== undefined ? r.score : '-'}</td>
          <td>${r.comments || '-'}</td>
        </tr>
      `).join('');

      UI.modal({
        title: '360 Feedback Details',
        size: 'lg',
        content: `
          <div class="info-grid" style="margin-bottom:16px">
            <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${fb.employee_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(fb.status||'').toLowerCase()}">${fb.status || 'DRAFT'}</span></div></div>
            <div class="info-item"><div class="info-label">Review Period</div><div class="info-value">${fb.review_period || '-'}</div></div>
          </div>
          <div class="section-header">${icon('users',14)} Responses (${responses.length})</div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Reviewer</th><th>Relationship</th><th style="text-align:center">Score</th><th>Comments</th></tr></thead>
              <tbody>${respRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No responses yet</td></tr>'}</tbody>
            </table>
          </div>
        `,
        footer: `<button class="btn" data-close-modal>Close</button><button class="btn btn-primary" onclick="PerformanceModule.add360Response(${id})">Add Response</button>`,
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  add360Response(feedbackId) {
    UI.closeModal();
    setTimeout(() => {
      const fields = UI.buildForm([
        { id: 'resp_reviewer_name', label: 'Reviewer Name', type: 'text', required: true },
        { id: 'resp_relationship', label: 'Relationship', type: 'select', options: ['Manager','Peer','Subordinate','Self','External'], required: true },
        { id: 'resp_score', label: 'Score (1-5)', type: 'number', min: 1, max: 5, required: true },
        { id: 'resp_comments', label: 'Comments', type: 'textarea', fullWidth: true },
      ]);
      UI.modal({
        title: 'Add 360 Response',
        content: `<div class="form-grid" id="resp360-form">${fields}</div>`,
        footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="PerformanceModule.submit360Response(${feedbackId})">Submit</button>`,
      });
    }, 250);
  },

  async submit360Response(feedbackId) {
    const form = document.getElementById('resp360-form');
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/performance/feedback-360/${feedbackId}/responses`, {
        reviewer_name: data.resp_reviewer_name,
        relationship: data.resp_relationship,
        score: parseFloat(data.resp_score),
        comments: data.resp_comments,
      });
      UI.closeModal();
      UI.toast('success', 'Added', 'Response added successfully');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderPIPTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading PIPs...</div>';
    try {
      const data = await api('/performance/pip');
      const rows = (data.data || []).map(pip => {
        const statusClass = (pip.status || '').toLowerCase();
        return `
          <tr>
            <td>${pip.employee_name || (pip.first_name ? pip.first_name + ' ' + pip.surname : '-')}</td>
            <td>${pip.start_date ? pip.start_date.split('T')[0] : '-'}</td>
            <td>${pip.end_date ? pip.end_date.split('T')[0] : '-'}</td>
            <td><span class="status-badge status-${statusClass}">${pip.status || 'ACTIVE'}</span></td>
            <td style="text-align:center">${pip.milestone_count || 0}</td>
            <td>
              <button class="btn btn-sm" onclick="PerformanceModule.viewPIP(${pip.id})">${icon('eye',12)}</button>
              <button class="btn btn-sm" onclick="PerformanceModule.addPIPMilestone(${pip.id})">${icon('plus',12)}</button>
              <button class="btn btn-sm" onclick="PerformanceModule.updatePIPStatus(${pip.id})">${icon('edit',12)}</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('alertTriangle',16)} Performance Improvement Plans</div>
          <button class="btn btn-primary" onclick="PerformanceModule.showPIPForm()">${icon('plus',14)} Create PIP</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Employee</th><th>Start Date</th><th>End Date</th><th>Status</th><th style="text-align:center">Milestones</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No PIPs found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showPIPForm() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const fields = UI.buildForm([
      { id: 'pip_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'pip_start_date', label: 'Start Date', type: 'date', required: true },
      { id: 'pip_end_date', label: 'End Date', type: 'date', required: true },
      { id: 'pip_reason', label: 'Reason', type: 'textarea', required: true, fullWidth: true, placeholder: 'Describe areas requiring improvement' },
      { id: 'pip_objectives', label: 'Objectives', type: 'textarea', fullWidth: true, placeholder: 'Specific measurable objectives' },
      { id: 'pip_support', label: 'Support Provided', type: 'textarea', fullWidth: true, placeholder: 'Training, mentoring, resources provided' },
    ]);
    UI.modal({
      title: 'Create Performance Improvement Plan',
      size: 'lg',
      content: `<div class="form-grid" id="pip-form">${fields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="PerformanceModule.submitPIP()">Create PIP</button>`,
    });
  },

  async submitPIP() {
    const form = document.getElementById('pip-form');
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/performance/pip', {
        employee_id: parseInt(data.pip_employee_id),
        start_date: data.pip_start_date,
        end_date: data.pip_end_date,
        reason: data.pip_reason,
        objectives: data.pip_objectives,
        support: data.pip_support,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'PIP created successfully');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async viewPIP(id) {
    try {
      const result = await api(`/performance/pip/${id}`);
      const pip = result.data;
      const milestones = pip.milestones || [];
      const msRows = milestones.map(m => `
        <tr>
          <td>${m.description || '-'}</td>
          <td>${m.due_date ? m.due_date.split('T')[0] : '-'}</td>
          <td><span class="status-badge status-${(m.status||'').toLowerCase()}">${m.status || 'PENDING'}</span></td>
          <td>${m.notes || '-'}</td>
        </tr>
      `).join('');

      UI.modal({
        title: 'PIP Details',
        size: 'lg',
        content: `
          <div class="info-grid" style="margin-bottom:16px">
            <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${pip.employee_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(pip.status||'').toLowerCase()}">${pip.status || 'ACTIVE'}</span></div></div>
            <div class="info-item"><div class="info-label">Period</div><div class="info-value">${pip.start_date ? pip.start_date.split('T')[0] : '-'} to ${pip.end_date ? pip.end_date.split('T')[0] : '-'}</div></div>
          </div>
          ${pip.reason ? `<div style="margin-bottom:12px"><strong>Reason:</strong><p style="font-size:13px;white-space:pre-wrap">${pip.reason}</p></div>` : ''}
          ${pip.objectives ? `<div style="margin-bottom:12px"><strong>Objectives:</strong><p style="font-size:13px;white-space:pre-wrap">${pip.objectives}</p></div>` : ''}
          <div class="section-header">${icon('activity',14)} Milestones (${milestones.length})</div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Description</th><th>Due Date</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>${msRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No milestones yet</td></tr>'}</tbody>
            </table>
          </div>
        `,
        footer: `<button class="btn" data-close-modal>Close</button><button class="btn btn-primary" onclick="PerformanceModule.addPIPMilestone(${id})">Add Milestone</button>`,
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  addPIPMilestone(pipId) {
    UI.closeModal();
    setTimeout(() => {
      const fields = UI.buildForm([
        { id: 'ms_description', label: 'Description', type: 'textarea', required: true, fullWidth: true },
        { id: 'ms_due_date', label: 'Due Date', type: 'date', required: true },
        { id: 'ms_notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ]);
      UI.modal({
        title: 'Add PIP Milestone',
        content: `<div class="form-grid" id="pip-ms-form">${fields}</div>`,
        footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="PerformanceModule.submitPIPMilestone(${pipId})">Add Milestone</button>`,
      });
    }, 250);
  },

  async submitPIPMilestone(pipId) {
    const form = document.getElementById('pip-ms-form');
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/performance/pip/${pipId}/milestones`, {
        description: data.ms_description,
        due_date: data.ms_due_date,
        notes: data.ms_notes,
      });
      UI.closeModal();
      UI.toast('success', 'Added', 'Milestone added successfully');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  updatePIPStatus(pipId) {
    const fields = UI.buildForm([
      { id: 'pip_status', label: 'Status', type: 'select', required: true, options: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'EXTENDED', label: 'Extended' },
        { value: 'FAILED', label: 'Failed' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ]},
      { id: 'pip_status_notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Update PIP Status',
      content: `<div class="form-grid" id="pip-status-form">${fields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="PerformanceModule.submitPIPStatus(${pipId})">Update</button>`,
    });
  },

  async submitPIPStatus(pipId) {
    const form = document.getElementById('pip-status-form');
    const data = UI.getFormData(form);
    try {
      await this.apiPut(`/performance/pip/${pipId}`, {
        status: data.pip_status,
        notes: data.pip_status_notes,
      });
      UI.closeModal();
      UI.toast('success', 'Updated', 'PIP status updated');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderReviews(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading reviews...</div>';
    try {
      const empOpts = this.state.employees.map(e => `<option value="${e.id}" ${e.id === this.state.selectedReviewEmployee ? 'selected' : ''}>${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
      const periodOpts = this.state.periods.map(p => `<option value="${p.id}" ${p.id === this.state.selectedPeriod ? 'selected' : ''}>${p.name} (${p.financial_year})</option>`).join('');

      let reviewRows = '';
      if (this.state.selectedReviewEmployee) {
        try {
          const revData = await api(`/performance/reviews/${this.state.selectedReviewEmployee}`);
          const reviews = revData.data || (Array.isArray(revData) ? revData : []);
          reviewRows = reviews.map(r => {
            const score = r.overall_score !== null && r.overall_score !== undefined ? parseFloat(r.overall_score).toFixed(1) : '-';
            const scoreNum = parseFloat(score);
            const ratingLabel = r.rating || (scoreNum >= 4 ? 'Outstanding' : scoreNum >= 3 ? 'Good' : scoreNum >= 2 ? 'Needs Improvement' : scoreNum >= 1 ? 'Unsatisfactory' : 'Not Rated');
            const scoreColor = scoreNum >= 4 ? '#10B981' : scoreNum >= 3 ? '#3B82F6' : scoreNum >= 2 ? '#F59E0B' : scoreNum >= 1 ? '#EF4444' : '#94A3B8';
            const statusClass = (r.status || '').toLowerCase();
            return `
              <tr class="clickable-row" onclick="PerformanceModule.viewReview(${r.id}, ${r.employee_id || this.state.selectedReviewEmployee}, ${r.period_id || ''})">
                <td>${r.period_name || r.review_period || '-'}</td>
                <td style="text-align:center;font-weight:700;color:${scoreColor}">${score}</td>
                <td><span class="badge" style="background:${scoreColor}20;color:${scoreColor}">${ratingLabel}</span></td>
                <td><span class="status-badge status-${statusClass}">${r.status || 'DRAFT'}</span></td>
                <td>${r.review_date ? r.review_date.split('T')[0] : '-'}</td>
                <td>
                  ${r.status !== 'SUBMITTED' && r.status !== 'APPROVED' ? `<button class="action-btn" onclick="event.stopPropagation();PerformanceModule.submitReview(${r.id})">${icon('send',12)} Submit</button>` : ''}
                  ${r.status === 'SUBMITTED' ? `<button class="action-btn" onclick="event.stopPropagation();PerformanceModule.approveReview(${r.id})">${icon('check',12)} Approve</button>` : ''}
                </td>
              </tr>
            `;
          }).join('');
        } catch (e) {
          reviewRows = '';
        }
      }

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('fileText',16)} Performance Reviews</div>
        </div>
        <div class="toolbar">
          <div class="toolbar-filter">
            <select id="review-emp-filter" class="toolbar-filter-select">
              <option value="">-- Select Employee --</option>
              ${empOpts}
            </select>
            <select id="review-period-filter" class="toolbar-filter-select">${periodOpts}</select>
          </div>
          <button class="btn btn-primary" onclick="PerformanceModule.startReview()">${icon('plus',14)} Start Review</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Period</th><th style="text-align:center">Overall Score</th><th>Rating</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>${reviewRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Select an employee to view reviews</td></tr>'}</tbody>
          </table>
        </div>
      `;

      document.getElementById('review-emp-filter')?.addEventListener('change', (e) => {
        this.state.selectedReviewEmployee = e.target.value ? parseInt(e.target.value) : null;
        this.renderTab();
      });
      document.getElementById('review-period-filter')?.addEventListener('change', (e) => {
        this.state.selectedPeriod = parseInt(e.target.value);
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async startReview() {
    const empSelect = document.getElementById('review-emp-filter');
    const periodSelect = document.getElementById('review-period-filter');
    const employeeId = empSelect ? parseInt(empSelect.value) : null;
    const periodId = periodSelect ? parseInt(periodSelect.value) : this.state.selectedPeriod;

    if (!employeeId) {
      UI.toast('warning', 'Required', 'Please select an employee');
      return;
    }
    if (!periodId) {
      UI.toast('warning', 'Required', 'Please select a period');
      return;
    }

    try {
      await this.apiPost('/performance/reviews', { employee_id: employeeId, period_id: periodId });
      UI.toast('success', 'Created', 'Performance review started successfully');
      this.state.selectedReviewEmployee = employeeId;
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async viewReview(reviewId, employeeId, periodId) {
    try {
      if (employeeId && periodId) {
        await this.renderScorecard(employeeId, periodId, reviewId);
      } else {
        UI.toast('info', 'Info', 'Scorecard data not available for this review');
      }
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async submitReview(reviewId) {
    try {
      await fetch(`${API_BASE}/performance/reviews/${reviewId}/submit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      UI.toast('success', 'Submitted', 'Review submitted for approval');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async approveReview(reviewId) {
    try {
      await fetch(`${API_BASE}/performance/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      UI.toast('success', 'Approved', 'Review approved successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderScorecard(employeeId, periodId, reviewId) {
    try {
      let scorecardItems = [];
      try {
        const scData = await api(`/performance/scorecard/${employeeId}/${periodId}`);
        scorecardItems = scData.data || (Array.isArray(scData) ? scData : []);
      } catch (e) {
        const indData = await api(`/performance/indicators?limit=50&employee_id=${employeeId}&period_id=${periodId}`);
        scorecardItems = (indData.data || []).map(ind => ({
          indicator_name: ind.kpa + ' - ' + ind.kpi,
          weight: ind.weighting,
          target: ind.annual_target,
          actual: ind.q4_actual || ind.q3_actual || ind.q2_actual || ind.q1_actual || '-',
          score: ind.score,
        }));
      }

      let weightedTotal = 0;
      let totalWeight = 0;
      const itemRows = scorecardItems.map(item => {
        const w = parseFloat(item.weight || item.weighting) || 0;
        const s = parseFloat(item.score) || 0;
        weightedTotal += w * s;
        totalWeight += w;
        const scoreColor = s >= 4 ? '#10B981' : s >= 3 ? '#3B82F6' : s >= 2 ? '#F59E0B' : s >= 1 ? '#EF4444' : '#94A3B8';
        return `
          <tr>
            <td>${item.indicator_name || item.kpa || '-'}</td>
            <td style="text-align:center">${w}%</td>
            <td style="text-align:center">${item.target || item.annual_target || '-'}</td>
            <td style="text-align:center">${item.actual || '-'}</td>
            <td style="text-align:center;font-weight:700;color:${scoreColor}">${s > 0 ? s.toFixed(1) : '-'}</td>
            <td style="text-align:center;font-weight:600">${w > 0 && s > 0 ? (w * s / 100).toFixed(2) : '-'}</td>
          </tr>
        `;
      }).join('');

      const finalScore = totalWeight > 0 ? (weightedTotal / totalWeight).toFixed(2) : 0;
      const finalNum = parseFloat(finalScore);
      const ratingLabel = finalNum >= 4 ? 'Outstanding' : finalNum >= 3 ? 'Good' : finalNum >= 2 ? 'Needs Improvement' : 'Unsatisfactory';
      const ratingColor = finalNum >= 4 ? '#10B981' : finalNum >= 3 ? '#3B82F6' : finalNum >= 2 ? '#F59E0B' : '#EF4444';

      const footerBtns = reviewId ? `
        <button class="btn" data-close-modal>Close</button>
        <button class="btn btn-primary" onclick="PerformanceModule.submitReview(${reviewId})">${icon('send',14)} Submit Review</button>
        <button class="btn btn-primary" style="background:#10B981" onclick="PerformanceModule.approveReview(${reviewId})">${icon('check',14)} Approve</button>
      ` : `<button class="btn" data-close-modal>Close</button>`;

      UI.modal({
        title: 'Performance Scorecard',
        size: 'xl',
        content: `
          <div style="display:flex;gap:16px;margin-bottom:20px">
            <div style="flex:1;padding:16px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;text-align:center">
              <div style="font-size:13px;color:var(--text-secondary)">Weighted Total</div>
              <div style="font-size:28px;font-weight:700;color:${ratingColor}">${finalScore}</div>
            </div>
            <div style="flex:1;padding:16px;background:${ratingColor}10;border-radius:8px;border:1px solid ${ratingColor}30;text-align:center">
              <div style="font-size:13px;color:var(--text-secondary)">Rating</div>
              <div style="font-size:20px;font-weight:700;color:${ratingColor}">${ratingLabel}</div>
            </div>
            <div style="flex:1;padding:16px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;text-align:center">
              <div style="font-size:13px;color:var(--text-secondary)">Total Weight</div>
              <div style="font-size:28px;font-weight:700">${totalWeight.toFixed(0)}%</div>
            </div>
          </div>
          <div class="data-grid">
            <table>
              <thead>
                <tr>
                  <th>Indicator</th>
                  <th style="text-align:center">Weight</th>
                  <th style="text-align:center">Target</th>
                  <th style="text-align:center">Actual</th>
                  <th style="text-align:center">Score</th>
                  <th style="text-align:center">Weighted</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No scorecard items found</td></tr>'}
                <tr style="background:#F0FDF4;font-weight:700">
                  <td>Total</td>
                  <td style="text-align:center">${totalWeight.toFixed(0)}%</td>
                  <td></td>
                  <td></td>
                  <td style="text-align:center;color:${ratingColor}">${finalScore}</td>
                  <td style="text-align:center">${(weightedTotal / 100).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `,
        footer: footerBtns,
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderGoalsTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading goal alignment...</div>';
    try {
      const data = await api('/performance/goal-alignment');
      const goals = data.data || [];
      this.state.goals = goals;

      const goalMap = {};
      goals.forEach(g => { goalMap[g.id] = g; });

      const getDepth = (g) => {
        let depth = 0;
        let current = g;
        while (current && current.parent_goal_id && goalMap[current.parent_goal_id]) {
          depth++;
          current = goalMap[current.parent_goal_id];
          if (depth > 10) break;
        }
        return depth;
      };

      const rows = goals.map(g => {
        const progress = g.progress !== null && g.progress !== undefined ? g.progress : 0;
        const progressColor = progress >= 75 ? '#10B981' : progress >= 50 ? '#3B82F6' : progress >= 25 ? '#F59E0B' : '#EF4444';
        const depth = getDepth(g);
        const indent = depth > 0 ? `padding-left:${depth * 24}px` : '';
        const treeIcon = depth > 0 ? `<span style="color:var(--text-muted);margin-right:4px">${icon('cornerDownRight',12)}</span>` : '';
        return `
          <tr>
            <td style="${indent}">${treeIcon}<strong>${g.strategic_objective || g.goal || '-'}</strong></td>
            <td>${g.department_name || '-'}</td>
            <td>${g.employee_name || '-'}</td>
            <td>${g.kpa || '-'}</td>
            <td style="text-align:center;font-weight:700;color:${progressColor}">${progress}%</td>
            <td>
              <div style="background:#E2E8F0;border-radius:4px;height:8px;width:100px">
                <div style="background:${progressColor};border-radius:4px;height:8px;width:${progress}%"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div class="section-header" style="margin:0">${icon('target',16)} Goal Alignment Report</div>
            <p style="font-size:13px;color:var(--text-secondary);margin:4px 0 0">Shows alignment between strategic objectives, departmental goals and individual KPAs. Indented items are cascaded child goals.</p>
          </div>
          <button class="btn btn-primary" onclick="PerformanceModule.showAddGoal()">${icon('plus',14)} Add Goal</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Strategic Objective</th><th>Department</th><th>Employee</th><th>KPA</th><th style="text-align:center">Progress</th><th>Bar</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No goal alignment data available</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showAddGoal() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const parentGoalOpts = [{ value: '', label: '-- None (Top Level) --' }].concat(
      this.state.goals.map(g => ({ value: g.id, label: g.strategic_objective || g.goal || `Goal #${g.id}` }))
    );
    const fields = UI.buildForm([
      { type: 'section', label: 'Goal Details', icon: icon('target',16) },
      { id: 'goal_parent_id', label: 'Parent Goal (Cascading)', type: 'select', options: parentGoalOpts },
      { id: 'goal_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true },
      { id: 'goal_strategic_objective', label: 'Strategic Objective / Goal', type: 'text', required: true, fullWidth: true, placeholder: 'e.g. Improve service delivery' },
      { id: 'goal_kpa', label: 'KPA', type: 'text', placeholder: 'Related Key Performance Area' },
      { id: 'goal_progress', label: 'Progress (%)', type: 'number', min: 0, max: 100, step: 1, placeholder: '0' },
    ]);

    UI.modal({
      title: 'Add Goal',
      content: `<div class="form-grid" id="add-goal-form">${fields}</div>
        <div style="margin-top:12px;padding:12px;background:#EFF6FF;border-radius:8px;font-size:13px;color:#1E40AF">
          <strong>Cascading:</strong> Select a parent goal to create a cascaded sub-goal. This links departmental and individual goals to strategic objectives.
        </div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="PerformanceModule.submitGoal()">Save Goal</button>
      `,
    });
  },

  async submitGoal() {
    const form = document.getElementById('add-goal-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/performance/goal-alignment', {
        employee_id: parseInt(data.goal_employee_id),
        strategic_objective: data.goal_strategic_objective,
        kpa: data.goal_kpa || null,
        progress: parseInt(data.goal_progress) || 0,
        parent_goal_id: data.goal_parent_id ? parseInt(data.goal_parent_id) : null,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'Goal added successfully');
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async submitBulkScores() {
    const selects = document.querySelectorAll('[data-indicator-id][data-field="score"]');
    let count = 0;
    const promises = [];
    selects.forEach(sel => {
      if (sel.value) {
        const id = sel.dataset.indicatorId;
        promises.push(this.apiPut(`/performance/indicators/${id}`, { score: parseFloat(sel.value) }));
        count++;
      }
    });

    if (count === 0) {
      UI.toast('warning', 'No Scores', 'Please select at least one score');
      return;
    }

    try {
      await Promise.all(promises);
      UI.closeModal();
      UI.toast('success', 'Saved', `${count} score(s) recorded successfully`);
      this.renderTab();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },
};

async function renderPerformanceModule(el) {
  await PerformanceModule.render(el);
}
