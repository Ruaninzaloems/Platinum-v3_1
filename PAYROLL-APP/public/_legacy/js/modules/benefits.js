const BenefitsModule = {
  state: {
    schemes: [],
    funds: [],
    activeTab: 'medical',
    employees: [],
    selectedEmployee: null,
    employeeMedical: [],
    employeeRetirement: [],
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
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading benefits...</div>';
    try {
      const [schemes, funds, empData] = await Promise.all([
        api('/benefits/medical-aid-schemes'),
        api('/benefits/retirement-funds'),
        api('/employees?limit=200&sort_by=surname&sort_order=asc'),
      ]);
      this.state.schemes = schemes.data;
      this.state.funds = funds.data;
      this.state.employees = empData.data;

      el.innerHTML = `
        ${UI.statCards([
          { value: schemes.data.length, label: 'Medical Aid Schemes', color: '#0f2b46' },
          { value: funds.data.length, label: 'Retirement Funds', color: '#2e7d32' },
          { value: empData.data.length, label: 'Total Employees', color: '#c9a84c' },
        ])}
        ${UI.detailTabs([
          { id: 'medical', label: 'Medical Aid', icon: icon('heart',14) },
          { id: 'retirement', label: 'Retirement Funds', icon: icon('shield',14) },
          { id: 'group-life', label: 'Group Life / Risk Benefits', icon: icon('shield',14) },
          { id: 'employee-benefits', label: 'Employee Benefits', icon: icon('award',14) },
          { id: 'rateTables', label: 'Rate Tables', icon: icon('list',14) },
          { id: 'lifeEvents', label: 'Life Events', icon: icon('calendar',14) },
          { id: 'costProjection', label: 'Cost Projection', icon: icon('trending-up',14) },
          { id: 'reports', label: 'Reports', icon: icon('file-text',14) },
        ], this.state.activeTab)}
        <div id="benefits-tab-content"></div>
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
    const el = document.getElementById('benefits-tab-content');
    if (!el) return;
    switch (this.state.activeTab) {
      case 'medical': this.renderMedicalTab(el); break;
      case 'retirement': this.renderRetirementTab(el); break;
      case 'group-life': this.renderGroupLifeTab(el); break;
      case 'employee-benefits': this.renderEmployeeBenefitsTab(el); break;
      case 'rateTables': this.renderRateTables(el); break;
      case 'lifeEvents': this.renderLifeEvents(el); break;
      case 'costProjection': this.renderCostProjection(el); break;
      case 'reports': this.renderBenefitReports(el); break;
    }
  },

  renderMedicalTab(el) {
    const rows = this.state.schemes.map(m => `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.scheme_type || '-'}</td>
        <td>${m.administrator || '-'}</td>
        <td style="text-align:right">${formatCurrency(m.main_member_contribution)}</td>
        <td style="text-align:right">${formatCurrency(m.employer_contribution)}</td>
        <td style="text-align:right">${formatCurrency(m.adult_dependant_contribution || 0)}</td>
        <td style="text-align:right">${formatCurrency(m.child_dependant_contribution || 0)}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Scheme Name</th>
              <th>Type</th>
              <th>Administrator</th>
              <th style="text-align:right">Member Contrib</th>
              <th style="text-align:right">Employer Contrib</th>
              <th style="text-align:right">Adult Dep.</th>
              <th style="text-align:right">Child Dep.</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No medical aid schemes configured</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  renderRetirementTab(el) {
    const rows = this.state.funds.map(r => `
      <tr>
        <td><strong>${r.name}</strong></td>
        <td>${r.fund_type}</td>
        <td>${r.fund_administrator || '-'}</td>
        <td style="text-align:right">${r.employee_contribution_rate}%</td>
        <td style="text-align:right">${r.employer_contribution_rate}%</td>
        <td>${r.tax_deductible ? '<span class="status-badge status-approved">Yes</span>' : '<span class="status-badge status-rejected">No</span>'}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Fund Name</th>
              <th>Type</th>
              <th>Administrator</th>
              <th style="text-align:right">Employee %</th>
              <th style="text-align:right">Employer %</th>
              <th>Tax Deductible</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No retirement funds configured</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  async renderGroupLifeTab(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading group life benefits...</div>';
    try {
      const data = await api('/benefits/group-life');
      const benefits = data.data || [];

      const rows = benefits.map(b => `
        <tr>
          <td><strong>${b.benefit_name || '-'}</strong></td>
          <td>${b.benefit_type || '-'}</td>
          <td>${b.provider || '-'}</td>
          <td>${b.policy_number || '-'}</td>
          <td style="text-align:right">${b.cover_multiple || '-'}x</td>
          <td style="text-align:right">${b.employee_contribution_pct || 0}%</td>
          <td style="text-align:right">${b.employer_contribution_pct || 0}%</td>
          <td>${b.is_active ? '<span class="status-badge status-approved">Active</span>' : '<span class="status-badge status-rejected">Inactive</span>'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Benefit Name</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Policy Number</th>
                <th style="text-align:right">Cover Multiple</th>
                <th style="text-align:right">Employee %</th>
                <th style="text-align:right">Employer %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No group life benefits configured</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  renderEmployeeBenefitsTab(el) {
    const empOptions = this.state.employees.map(e => ({
      value: e.id,
      label: `${e.employee_code} - ${e.first_name} ${e.surname}`,
    }));

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search" style="max-width:400px">
          <select id="benefits-emp-select" class="form-control" style="width:100%">
            <option value="">-- Select Employee --</option>
            ${empOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="BenefitsModule.showEnrolMedical()">Enrol Medical Aid</button>
        <button class="btn btn-primary" onclick="BenefitsModule.showEnrolRetirement()">Enrol Retirement Fund</button>
        <button class="btn btn-primary" onclick="BenefitsModule.showEnrolGroupLife()">Enrol Group Life</button>
      </div>
      <div id="employee-benefits-detail">
        ${UI.emptyState(icon('user',32), 'Select an Employee', 'Choose an employee above to view and manage their benefits')}
      </div>
    `;

    document.getElementById('benefits-emp-select').addEventListener('change', (e) => {
      this.state.selectedEmployee = e.target.value ? parseInt(e.target.value) : null;
      if (this.state.selectedEmployee) {
        this.loadEmployeeBenefits();
      }
    });
  },

  async loadEmployeeBenefits() {
    const el = document.getElementById('employee-benefits-detail');
    if (!el || !this.state.selectedEmployee) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading benefits...</div>';

    try {
      const [medical, retirement, groupLife, costSplit] = await Promise.all([
        api(`/benefits/employee/${this.state.selectedEmployee}/medical-aid`),
        api(`/benefits/employee/${this.state.selectedEmployee}/retirement-funds`),
        api(`/benefits/employee/${this.state.selectedEmployee}/group-life`).catch(() => ({ data: [] })),
        api(`/benefits/cost-split/${this.state.selectedEmployee}`).catch(() => ({ data: null })),
      ]);
      this.state.employeeMedical = medical.data;
      this.state.employeeRetirement = retirement.data;

      const emp = this.state.employees.find(e => e.id === this.state.selectedEmployee);
      const empName = emp ? `${emp.first_name} ${emp.surname}` : '';

      const medRows = medical.data.map(m => `
        <tr>
          <td><strong>${m.scheme_name}</strong></td>
          <td>${m.scheme_type || '-'}</td>
          <td>${m.membership_number || '-'}</td>
          <td>${m.join_date ? m.join_date.split('T')[0] : '-'}</td>
          <td>${m.is_current ? '<span class="status-badge status-approved">Current</span>' : '<span class="status-badge status-rejected">Previous</span>'}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" onclick="BenefitsModule.viewDependants(${m.id})">Dependants</button>
              <button class="action-btn" onclick="BenefitsModule.showAddDependant(${m.id})">+ Add Dep.</button>
            </div>
          </td>
        </tr>
      `).join('');

      const retRows = retirement.data.map(r => `
        <tr>
          <td><strong>${r.fund_name}</strong></td>
          <td>${r.fund_type}</td>
          <td>${r.fund_number || '-'}</td>
          <td>${r.join_date ? r.join_date.split('T')[0] : '-'}</td>
          <td style="text-align:right">${formatCurrency(r.employee_amount)}</td>
          <td style="text-align:right">${formatCurrency(r.employer_amount)}</td>
          <td>${r.is_current ? '<span class="status-badge status-approved">Current</span>' : '<span class="status-badge status-rejected">Previous</span>'}</td>
        </tr>
      `).join('');

      const glRows = (groupLife.data || []).map(g => `
        <tr>
          <td><strong>${g.benefit_name || '-'}</strong></td>
          <td>${g.benefit_type || '-'}</td>
          <td>${g.provider || '-'}</td>
          <td style="text-align:right">${formatCurrency(g.cover_amount || 0)}</td>
          <td style="text-align:right">${formatCurrency(g.employee_contribution || 0)}</td>
          <td style="text-align:right">${formatCurrency(g.employer_contribution || 0)}</td>
          <td>${g.start_date ? g.start_date.split('T')[0] : '-'}</td>
        </tr>
      `).join('');

      const cs = costSplit.data;
      const costSplitHtml = cs ? `
        <h3 style="margin:16px 0 12px;font-size:16px">Cost Split Summary - ${empName}</h3>
        <div class="info-grid" style="margin-bottom:24px">
          <div class="info-item"><div class="info-label">Total Employee Cost</div><div class="info-value">${formatCurrency((cs.totals && cs.totals.employee_cost) || 0)}</div></div>
          <div class="info-item"><div class="info-label">Total Employer Cost</div><div class="info-value">${formatCurrency((cs.totals && cs.totals.employer_cost) || 0)}</div></div>
          <div class="info-item"><div class="info-label">Grand Total</div><div class="info-value">${formatCurrency((cs.totals && cs.totals.total_cost) || 0)}</div></div>
        </div>
      ` : '';

      el.innerHTML = `
        ${costSplitHtml}
        <h3 style="margin:16px 0 12px;font-size:16px">Medical Aid - ${empName}</h3>
        <div class="data-grid" style="margin-bottom:24px">
          <table>
            <thead>
              <tr><th>Scheme</th><th>Type</th><th>Membership #</th><th>Join Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>${medRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No medical aid enrolments</td></tr>'}</tbody>
          </table>
        </div>
        <div id="dependants-section"></div>
        <h3 style="margin:16px 0 12px;font-size:16px">Retirement Funds - ${empName}</h3>
        <div class="data-grid" style="margin-bottom:24px">
          <table>
            <thead>
              <tr><th>Fund</th><th>Type</th><th>Fund #</th><th>Join Date</th><th style="text-align:right">Employee Amt</th><th style="text-align:right">Employer Amt</th><th>Status</th></tr>
            </thead>
            <tbody>${retRows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No retirement fund memberships</td></tr>'}</tbody>
          </table>
        </div>
        <h3 style="margin:16px 0 12px;font-size:16px">Group Life Benefits - ${empName}</h3>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Provider</th><th>Policy Number</th><th>Cover Type</th><th style="text-align:right">Cover Amount</th><th style="text-align:right">Employee Contrib</th><th style="text-align:right">Employer Contrib</th><th>Join Date</th></tr>
            </thead>
            <tbody>${glRows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No group life enrolments</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async viewDependants(membershipId) {
    const el = document.getElementById('dependants-section');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading dependants...</div>';

    try {
      const data = await api(`/benefits/employee/${this.state.selectedEmployee}/medical-aid/${membershipId}/dependants`);
      const rows = data.data.map(d => `
        <tr>
          <td>${d.first_name} ${d.surname}</td>
          <td>${d.dependant_type}</td>
          <td>${d.id_number || '-'}</td>
          <td>${d.date_of_birth ? d.date_of_birth.split('T')[0] : '-'}</td>
          <td>${d.gender || '-'}</td>
          <td>${d.employer_contributes ? '<span class="status-badge status-approved">Yes</span>' : '<span class="status-badge status-rejected">No</span>'}</td>
          <td>${d.start_date ? d.start_date.split('T')[0] : '-'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:16px">
          <h4 style="margin:0 0 12px;font-size:14px">Dependants (Membership #${membershipId})</h4>
          <div class="data-grid">
            <table>
              <thead><tr><th>Name</th><th>Type</th><th>ID Number</th><th>Date of Birth</th><th>Gender</th><th>Employer Contrib</th><th>Start Date</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No dependants registered</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showEnrolMedical() {
    if (!this.state.selectedEmployee) {
      UI.toast('warning', 'Select Employee', 'Please select an employee first');
      return;
    }
    const schemeOpts = this.state.schemes.map(s => ({ value: s.id, label: s.name }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Medical Aid Enrolment', icon: icon('heart',16) },
      { id: 'med_scheme_id', label: 'Medical Aid Scheme', type: 'select', options: schemeOpts, required: true },
      { id: 'med_membership_number', label: 'Membership Number', type: 'text', placeholder: 'e.g. MED-001234' },
      { id: 'med_join_date', label: 'Join Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    ]);

    UI.modal({
      title: 'Enrol on Medical Aid',
      size: 'sm',
      content: `<div class="form-grid" id="enrol-medical-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitMedicalEnrolment()">Enrol</button>
      `,
    });
  },

  async submitMedicalEnrolment() {
    const form = document.getElementById('enrol-medical-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/benefits/employee/${this.state.selectedEmployee}/medical-aid`, {
        scheme_id: parseInt(data.med_scheme_id),
        membership_number: data.med_membership_number,
        join_date: data.med_join_date,
      });
      UI.closeModal();
      UI.toast('success', 'Enrolled', 'Employee enrolled on medical aid successfully');
      this.loadEmployeeBenefits();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  showEnrolRetirement() {
    if (!this.state.selectedEmployee) {
      UI.toast('warning', 'Select Employee', 'Please select an employee first');
      return;
    }
    const fundOpts = this.state.funds.map(f => ({ value: f.id, label: `${f.name} (${f.fund_type})` }));
    const fields = UI.buildForm([
      { type: 'section', label: 'Retirement Fund Enrolment', icon: icon('shield',16) },
      { id: 'ret_fund_type_id', label: 'Retirement Fund', type: 'select', options: fundOpts, required: true },
      { id: 'ret_fund_number', label: 'Fund/Member Number', type: 'text', placeholder: 'e.g. RF-001234' },
      { id: 'ret_join_date', label: 'Join Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'ret_employee_amount', label: 'Employee Amount (R)', type: 'number', placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'ret_employer_amount', label: 'Employer Amount (R)', type: 'number', placeholder: '0.00', step: '0.01', min: 0 },
    ]);

    UI.modal({
      title: 'Enrol on Retirement Fund',
      size: 'sm',
      content: `<div class="form-grid" id="enrol-retirement-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitRetirementEnrolment()">Enrol</button>
      `,
    });
  },

  async submitRetirementEnrolment() {
    const form = document.getElementById('enrol-retirement-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/benefits/employee/${this.state.selectedEmployee}/retirement-funds`, {
        fund_type_id: parseInt(data.ret_fund_type_id),
        fund_number: data.ret_fund_number,
        join_date: data.ret_join_date,
        employee_amount: data.ret_employee_amount || 0,
        employer_amount: data.ret_employer_amount || 0,
      });
      UI.closeModal();
      UI.toast('success', 'Enrolled', 'Employee enrolled on retirement fund successfully');
      this.loadEmployeeBenefits();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async showEnrolGroupLife() {
    if (!this.state.selectedEmployee) {
      UI.toast('warning', 'Select Employee', 'Please select an employee first');
      return;
    }
    let benefitOptions = [];
    try {
      const glData = await api('/benefits/group-life');
      benefitOptions = (glData.data || []).map(b => ({ value: b.id, label: `${b.benefit_name} (${b.provider})` }));
    } catch (e) {}
    const fields = UI.buildForm([
      { type: 'section', label: 'Group Life Enrolment', icon: icon('shield',16) },
      { id: 'gl_benefit_id', label: 'Benefit', type: 'select', required: true, options: benefitOptions },
      { id: 'gl_cover_amount', label: 'Cover Amount (R)', type: 'number', placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'gl_employee_contribution', label: 'Employee Contribution (R)', type: 'number', placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'gl_employer_contribution', label: 'Employer Contribution (R)', type: 'number', placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'gl_start_date', label: 'Start Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'gl_beneficiary_name', label: 'Beneficiary Name', type: 'text', placeholder: 'Full name' },
      { id: 'gl_beneficiary_id_number', label: 'Beneficiary ID Number', type: 'text', placeholder: 'SA ID', maxlength: 13 },
      { id: 'gl_beneficiary_relationship', label: 'Beneficiary Relationship', type: 'select', options: [
        { value: 'SPOUSE', label: 'Spouse' },
        { value: 'CHILD', label: 'Child' },
        { value: 'PARENT', label: 'Parent' },
        { value: 'SIBLING', label: 'Sibling' },
        { value: 'OTHER', label: 'Other' },
      ]},
    ]);

    UI.modal({
      title: 'Enrol on Group Life Benefit',
      content: `<div class="form-grid" id="enrol-group-life-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitGroupLifeEnrolment()">Enrol</button>
      `,
    });
  },

  async submitGroupLifeEnrolment() {
    const form = document.getElementById('enrol-group-life-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/benefits/employee/${this.state.selectedEmployee}/group-life`, {
        benefit_id: parseInt(data.gl_benefit_id),
        cover_amount: parseFloat(data.gl_cover_amount) || 0,
        employee_contribution: parseFloat(data.gl_employee_contribution) || 0,
        employer_contribution: parseFloat(data.gl_employer_contribution) || 0,
        start_date: data.gl_start_date,
        beneficiary_name: data.gl_beneficiary_name || null,
        beneficiary_id_number: data.gl_beneficiary_id_number || null,
        beneficiary_relationship: data.gl_beneficiary_relationship || null,
      });
      UI.closeModal();
      UI.toast('success', 'Enrolled', 'Employee enrolled on group life benefit successfully');
      this.loadEmployeeBenefits();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  showAddDependant(membershipId) {
    const fields = UI.buildForm([
      { type: 'section', label: 'Add Dependant', icon: icon('users',16) },
      { id: 'dep_first_name', label: 'First Name', type: 'text', required: true },
      { id: 'dep_surname', label: 'Surname', type: 'text', required: true },
      { id: 'dep_id_number', label: 'ID Number', type: 'text', placeholder: 'SA ID Number', maxlength: 13 },
      { id: 'dep_date_of_birth', label: 'Date of Birth', type: 'date' },
      { id: 'dep_gender', label: 'Gender', type: 'select', options: [
        { value: 'MALE', label: 'Male' },
        { value: 'FEMALE', label: 'Female' },
      ]},
      { id: 'dep_dependant_type', label: 'Dependant Type', type: 'select', required: true, options: [
        { value: 'SPOUSE', label: 'Spouse' },
        { value: 'CHILD', label: 'Child' },
        { value: 'ADULT', label: 'Adult Dependant' },
        { value: 'STUDENT', label: 'Student Dependant' },
        { value: 'DISABLED', label: 'Disabled Dependant' },
      ]},
      { id: 'dep_employer_contributes', label: 'Employer Contribution', type: 'checkbox', checkLabel: 'Employer contributes to this dependant' },
      { id: 'dep_start_date', label: 'Start Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    ]);

    UI.modal({
      title: 'Add Dependant',
      content: `<div class="form-grid" id="add-dependant-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitAddDependant(${membershipId})">Add Dependant</button>
      `,
    });
  },

  async submitAddDependant(membershipId) {
    const form = document.getElementById('add-dependant-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost(`/benefits/employee/${this.state.selectedEmployee}/medical-aid/${membershipId}/dependants`, {
        first_name: data.dep_first_name,
        surname: data.dep_surname,
        id_number: data.dep_id_number,
        date_of_birth: data.dep_date_of_birth,
        gender: data.dep_gender,
        dependant_type: data.dep_dependant_type,
        employer_contributes: data.dep_employer_contributes,
        start_date: data.dep_start_date,
      });
      UI.closeModal();
      UI.toast('success', 'Added', 'Dependant added successfully');
      this.viewDependants(membershipId);
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  renderRateTables(el) {
    const schemeOpts = this.state.schemes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search" style="max-width:400px">
          <select id="rate-scheme-select" class="form-control" style="width:100%">
            <option value="">-- Select Scheme --</option>
            ${schemeOpts}
          </select>
        </div>
        <button class="btn btn-primary" onclick="BenefitsModule.showAddRate()">${icon('plus',14)} Add Rate</button>
      </div>
      <div id="rate-tables-content">
        ${UI.emptyState(icon('list',32), 'Select a Scheme', 'Choose a scheme above to view its rate tables')}
      </div>
    `;

    document.getElementById('rate-scheme-select').addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadRateTables(parseInt(e.target.value));
      }
    });
  },

  async loadRateTables(schemeId) {
    const el = document.getElementById('rate-tables-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading rate tables...</div>';
    try {
      const data = await api(`/benefits/rate-tables/${schemeId}`);
      const rates = data.data || [];
      const rows = rates.map(r => `
        <tr>
          <td><strong>${r.plan_name || '-'}</strong></td>
          <td style="text-align:right">${formatCurrency(r.member_rate)}</td>
          <td style="text-align:right">${formatCurrency(r.adult_dependant_rate)}</td>
          <td style="text-align:right">${formatCurrency(r.child_dependant_rate)}</td>
          <td>${r.effective_date ? r.effective_date.split('T')[0] : '-'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Plan Name</th>
                <th style="text-align:right">Member Rate</th>
                <th style="text-align:right">Adult Dep. Rate</th>
                <th style="text-align:right">Child Dep. Rate</th>
                <th>Effective Date</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No rate tables found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showAddRate() {
    const schemeSelect = document.getElementById('rate-scheme-select');
    const selectedSchemeId = schemeSelect ? schemeSelect.value : '';
    const schemeOpts = this.state.schemes.map(s => ({ value: s.id, label: s.name }));

    const fields = UI.buildForm([
      { type: 'section', label: 'Add Rate Table Entry', icon: icon('list',16) },
      { id: 'rt_scheme_id', label: 'Scheme', type: 'select', options: schemeOpts, required: true, value: selectedSchemeId },
      { id: 'rt_plan_name', label: 'Plan Name', type: 'text', required: true, placeholder: 'e.g. Basic, Comprehensive' },
      { id: 'rt_member_rate', label: 'Member Rate (R)', type: 'number', required: true, placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'rt_adult_dependant_rate', label: 'Adult Dependant Rate (R)', type: 'number', required: true, placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'rt_child_dependant_rate', label: 'Child Dependant Rate (R)', type: 'number', required: true, placeholder: '0.00', step: '0.01', min: 0 },
      { id: 'rt_effective_date', label: 'Effective Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
    ]);

    UI.modal({
      title: 'Add Rate Table Entry',
      size: 'sm',
      content: `<div class="form-grid" id="add-rate-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitAddRate()">Save Rate</button>
      `,
    });
  },

  async submitAddRate() {
    const form = document.getElementById('add-rate-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/benefits/rate-tables', {
        scheme_id: parseInt(data.rt_scheme_id),
        plan_name: data.rt_plan_name,
        member_rate: parseFloat(data.rt_member_rate) || 0,
        adult_dependant_rate: parseFloat(data.rt_adult_dependant_rate) || 0,
        child_dependant_rate: parseFloat(data.rt_child_dependant_rate) || 0,
        effective_date: data.rt_effective_date,
      });
      UI.closeModal();
      UI.toast('success', 'Saved', 'Rate table entry added successfully');
      this.loadRateTables(parseInt(data.rt_scheme_id));
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  renderLifeEvents(el) {
    const empOptions = this.state.employees.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search" style="max-width:400px">
          <select id="life-events-emp-select" class="form-control" style="width:100%">
            <option value="">-- Select Employee --</option>
            ${empOptions}
          </select>
        </div>
        <button class="btn btn-primary" onclick="BenefitsModule.showAddLifeEvent()">${icon('plus',14)} Add Life Event</button>
      </div>
      <div id="life-events-content">
        ${UI.emptyState(icon('calendar',32), 'Select an Employee', 'Choose an employee above to view their life events')}
      </div>
    `;

    document.getElementById('life-events-emp-select').addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadLifeEvents(parseInt(e.target.value));
      }
    });
  },

  async loadLifeEvents(employeeId) {
    const el = document.getElementById('life-events-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading life events...</div>';
    try {
      const data = await api(`/benefits/life-events/${employeeId}`);
      const events = data.data || [];
      const rows = events.map(ev => `
        <tr>
          <td><span class="badge-info">${ev.event_type || '-'}</span></td>
          <td>${ev.event_date ? ev.event_date.split('T')[0] : '-'}</td>
          <td>${ev.notes || '-'}</td>
          <td>${ev.created_at ? ev.created_at.split('T')[0] : '-'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Event Date</th>
                <th>Notes</th>
                <th>Recorded On</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No life events found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  showAddLifeEvent() {
    const empOpts = this.state.employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` }));
    const empSelect = document.getElementById('life-events-emp-select');
    const selectedEmpId = empSelect ? empSelect.value : '';

    const fields = UI.buildForm([
      { type: 'section', label: 'Record Life Event', icon: icon('calendar',16) },
      { id: 'le_employee_id', label: 'Employee', type: 'select', options: empOpts, required: true, value: selectedEmpId },
      { id: 'le_event_type', label: 'Event Type', type: 'select', required: true, options: [
        { value: 'MARRIAGE', label: 'Marriage' },
        { value: 'BIRTH', label: 'Birth' },
        { value: 'DIVORCE', label: 'Divorce' },
        { value: 'DEATH_DEPENDANT', label: 'Death of Dependant' },
        { value: 'ADOPTION', label: 'Adoption' },
      ]},
      { id: 'le_event_date', label: 'Event Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'le_notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' },
    ]);

    UI.modal({
      title: 'Record Life Event',
      size: 'sm',
      content: `<div class="form-grid" id="add-life-event-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" onclick="BenefitsModule.submitAddLifeEvent()">Save Event</button>
      `,
    });
  },

  async submitAddLifeEvent() {
    const form = document.getElementById('add-life-event-form');
    const { valid, errors } = UI.validateForm(form);
    if (!valid) {
      UI.toast('error', 'Validation Error', errors.join(', '));
      return;
    }
    const data = UI.getFormData(form);
    try {
      await this.apiPost('/benefits/life-events', {
        employee_id: parseInt(data.le_employee_id),
        event_type: data.le_event_type,
        event_date: data.le_event_date,
        notes: data.le_notes || null,
      });
      UI.closeModal();
      UI.toast('success', 'Saved', 'Life event recorded successfully');
      this.loadLifeEvents(parseInt(data.le_employee_id));
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  renderCostProjection(el) {
    const empOptions = this.state.employees.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');

    el.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-search" style="max-width:400px">
          <select id="projection-emp-select" class="form-control" style="width:100%">
            <option value="">-- Select Employee --</option>
            ${empOptions}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:16px;margin:16px 0">
        <div>
          <label class="form-label">Projection Months</label>
          <input type="number" id="proj-months" class="form-control" placeholder="12" value="12" min="1" max="60" step="1">
        </div>
        <div>
          <label class="form-label">Salary Increase %</label>
          <input type="number" id="proj-salary-increase-pct" class="form-control" placeholder="0.00" step="0.01" min="0">
        </div>
        <div>
          <label class="form-label">New Salary (R)</label>
          <input type="number" id="proj-new-salary" class="form-control" placeholder="0.00" step="0.01" min="0">
        </div>
        <div>
          <label class="form-label">Medical Change (R)</label>
          <input type="number" id="proj-medical-change" class="form-control" placeholder="0.00" step="0.01">
        </div>
        <div>
          <label class="form-label">Retirement Change (R)</label>
          <input type="number" id="proj-retirement-change" class="form-control" placeholder="0.00" step="0.01">
        </div>
      </div>
      <button class="btn btn-primary" onclick="BenefitsModule.projectCost()">${icon('trending-up',14)} Project Cost</button>
      <div id="projection-result" style="margin-top:16px">
        ${UI.emptyState(icon('trending-up',32), 'Cost Projection', 'Select an employee and enter projected changes, then click Project Cost')}
      </div>
    `;
  },

  async projectCost() {
    const empSelect = document.getElementById('projection-emp-select');
    const employeeId = empSelect ? parseInt(empSelect.value) : null;
    if (!employeeId) {
      UI.toast('warning', 'Select Employee', 'Please select an employee first');
      return;
    }
    const projectionMonths = parseInt(document.getElementById('proj-months').value) || 12;
    const salaryIncreasePct = parseFloat(document.getElementById('proj-salary-increase-pct').value) || 0;
    const newSalary = parseFloat(document.getElementById('proj-new-salary').value) || 0;
    const medicalChange = parseFloat(document.getElementById('proj-medical-change').value) || 0;
    const retirementChange = parseFloat(document.getElementById('proj-retirement-change').value) || 0;

    const el = document.getElementById('projection-result');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Calculating projection...</div>';

    try {
      const result = await this.apiPost('/benefits/project-cost', {
        employee_id: employeeId,
        projection_months: projectionMonths,
        salary_increase_percentage: salaryIncreasePct,
        new_salary: newSalary,
        medical_change: medicalChange,
        retirement_change: retirementChange,
      });
      const d = result.data || result;

      const currentTotal = parseFloat(d.current_total) || 0;
      const projectedTotal = parseFloat(d.projected_total) || 0;
      const difference = projectedTotal - currentTotal;
      const pctChange = currentTotal > 0 ? ((difference / currentTotal) * 100).toFixed(2) : '0.00';

      const rows = [
        { label: 'Salary', current: d.current_salary, projected: d.projected_salary },
        { label: 'Medical Aid', current: d.current_medical, projected: d.projected_medical },
        { label: 'Retirement', current: d.current_retirement, projected: d.projected_retirement },
        { label: 'Total', current: currentTotal, projected: projectedTotal },
      ];

      const tableRows = rows.map(r => {
        const cur = parseFloat(r.current) || 0;
        const proj = parseFloat(r.projected) || 0;
        const diff = proj - cur;
        const pct = cur > 0 ? ((diff / cur) * 100).toFixed(2) : '0.00';
        const diffClass = diff > 0 ? 'color:var(--danger)' : diff < 0 ? 'color:var(--success)' : '';
        return `
          <tr>
            <td><strong>${r.label}</strong></td>
            <td style="text-align:right">${formatCurrency(cur)}</td>
            <td style="text-align:right">${formatCurrency(proj)}</td>
            <td style="text-align:right;${diffClass}">${diff >= 0 ? '+' : ''}${formatCurrency(diff)}</td>
            <td style="text-align:right;${diffClass}">${diff >= 0 ? '+' : ''}${pct}%</td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th style="text-align:right">Current</th>
                <th style="text-align:right">Projected</th>
                <th style="text-align:right">Difference</th>
                <th style="text-align:right">Change %</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  renderBenefitReports(el) {
    const empOptions = this.state.employees.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');

    el.innerHTML = `
      <div class="toolbar">
        <button class="btn btn-primary" onclick="BenefitsModule.loadSchemeSummary()">${icon('file-text',14)} Scheme Summary</button>
        <div class="toolbar-search" style="max-width:400px;margin-left:16px">
          <select id="report-emp-select" class="form-control" style="width:100%">
            <option value="">-- Select Employee --</option>
            ${empOptions}
          </select>
        </div>
        <button class="btn btn-primary" onclick="BenefitsModule.loadEmployeeSummaryReport()">${icon('user',14)} Employee Summary</button>
      </div>
      <div id="reports-content">
        ${UI.emptyState(icon('file-text',32), 'Benefits Reports', 'Click Scheme Summary or select an employee for Employee Summary')}
      </div>
    `;
  },

  async loadSchemeSummary() {
    const el = document.getElementById('reports-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading scheme summary...</div>';
    try {
      const data = await api('/benefits/reports/scheme-summary');
      const report = data.data || data;
      const medSchemes = report.medical_schemes || [];
      const retFunds = report.retirement_funds || [];

      const medRows = medSchemes.map(m => `
        <tr>
          <td><strong>${m.name || '-'}</strong></td>
          <td>${m.scheme_type || '-'}</td>
          <td>${m.administrator || '-'}</td>
          <td style="text-align:right">${m.member_count || 0}</td>
          <td style="text-align:right">${formatCurrency(m.total_contributions || 0)}</td>
        </tr>
      `).join('');

      const retRows = retFunds.map(r => `
        <tr>
          <td><strong>${r.name || '-'}</strong></td>
          <td>${r.fund_type || '-'}</td>
          <td>${r.fund_administrator || '-'}</td>
          <td style="text-align:right">${r.member_count || 0}</td>
          <td style="text-align:right">${formatCurrency(r.total_contributions || 0)}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <h3 style="margin:16px 0 12px;font-size:16px">${icon('heart',16)} Medical Aid Schemes Summary</h3>
        <div class="data-grid" style="margin-bottom:24px">
          <table>
            <thead>
              <tr><th>Scheme Name</th><th>Type</th><th>Administrator</th><th style="text-align:right">Members</th><th style="text-align:right">Total Contributions</th></tr>
            </thead>
            <tbody>${medRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No medical schemes data</td></tr>'}</tbody>
          </table>
        </div>
        <h3 style="margin:16px 0 12px;font-size:16px">${icon('shield',16)} Retirement Funds Summary</h3>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Fund Name</th><th>Type</th><th>Administrator</th><th style="text-align:right">Members</th><th style="text-align:right">Total Contributions</th></tr>
            </thead>
            <tbody>${retRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No retirement funds data</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async loadEmployeeSummaryReport() {
    const empSelect = document.getElementById('report-emp-select');
    const employeeId = empSelect ? parseInt(empSelect.value) : null;
    if (!employeeId) {
      UI.toast('warning', 'Select Employee', 'Please select an employee first');
      return;
    }
    const el = document.getElementById('reports-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading employee summary...</div>';

    try {
      const data = await api(`/benefits/reports/employee-summary/${employeeId}`);
      const report = data.data || data;
      const emp = report.employee || {};
      const medical = report.medical || [];
      const retirement = report.retirement || [];
      const groupLife = report.group_life || [];

      const medRows = medical.map(m => `
        <tr>
          <td>${m.scheme_name || '-'}</td>
          <td>${m.membership_number || '-'}</td>
          <td>${m.join_date ? m.join_date.split('T')[0] : '-'}</td>
          <td>${m.is_current ? '<span class="status-badge status-approved">Current</span>' : '<span class="status-badge status-rejected">Previous</span>'}</td>
        </tr>
      `).join('');

      const retRows = retirement.map(r => `
        <tr>
          <td>${r.fund_name || '-'}</td>
          <td>${r.fund_number || '-'}</td>
          <td style="text-align:right">${formatCurrency(r.employee_amount || 0)}</td>
          <td style="text-align:right">${formatCurrency(r.employer_amount || 0)}</td>
          <td>${r.is_current ? '<span class="status-badge status-approved">Current</span>' : '<span class="status-badge status-rejected">Previous</span>'}</td>
        </tr>
      `).join('');

      const glRows = groupLife.map(g => `
        <tr>
          <td>${g.benefit_name || '-'}</td>
          <td>${g.provider || '-'}</td>
          <td style="text-align:right">${formatCurrency(g.cover_amount || 0)}</td>
          <td style="text-align:right">${formatCurrency(g.employee_contribution || 0)}</td>
          <td style="text-align:right">${formatCurrency(g.employer_contribution || 0)}</td>
        </tr>
      `).join('');

      const empName = emp.first_name ? `${emp.first_name} ${emp.surname}` : 'Employee';

      el.innerHTML = `
        <h3 style="margin:16px 0 12px;font-size:16px">${icon('user',16)} Benefits Summary - ${empName}</h3>
        <h4 style="margin:12px 0 8px;font-size:14px">Medical Aid</h4>
        <div class="data-grid" style="margin-bottom:16px">
          <table>
            <thead><tr><th>Scheme</th><th>Membership #</th><th>Join Date</th><th>Status</th></tr></thead>
            <tbody>${medRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No medical aid enrolments</td></tr>'}</tbody>
          </table>
        </div>
        <h4 style="margin:12px 0 8px;font-size:14px">Retirement Funds</h4>
        <div class="data-grid" style="margin-bottom:16px">
          <table>
            <thead><tr><th>Fund</th><th>Fund #</th><th style="text-align:right">Employee Amt</th><th style="text-align:right">Employer Amt</th><th>Status</th></tr></thead>
            <tbody>${retRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No retirement funds</td></tr>'}</tbody>
          </table>
        </div>
        <h4 style="margin:12px 0 8px;font-size:14px">Group Life Benefits</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Benefit</th><th>Provider</th><th style="text-align:right">Cover Amount</th><th style="text-align:right">Employee Contrib</th><th style="text-align:right">Employer Contrib</th></tr></thead>
            <tbody>${glRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No group life benefits</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },
};

async function renderBenefitsModule(el) {
  await BenefitsModule.render(el);
}
