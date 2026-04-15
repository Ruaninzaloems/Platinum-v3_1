function fmtDateSA(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return '-';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}
function fmtRand(val) {
  const n = parseFloat(val) || 0;
  return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SettingsModule = {
  state: { activeTab: 'municipality', taxYear: null, taxYears: [], taxData: null, leaveTypes: [], leaveSchemes: [], salaryHeads: [] },

  async render(el) {
    const tabs = [
      { id: 'municipality', label: 'Municipality', icon: icon('briefcase',14) },
      { id: 'employeetypes', label: 'Employee Sub Types', icon: icon('users',14) },
      { id: 'taskgrades', label: 'Task Grades & Notches', icon: icon('layers',14) },
      { id: 'conditions', label: 'Conditions of Service', icon: icon('fileText',14) },
      { id: 'tax', label: 'Tax Tables', icon: icon('fileText',14) },
      { id: 'leave', label: 'Leave Types', icon: icon('calendar',14) },
      { id: 'salaryheads', label: 'Salary Heads', icon: icon('dollar',14) },
      { id: 'bank', label: 'Bank & Payments', icon: icon('creditCard',14) },
      { id: 'security', label: 'Security & RBAC', icon: icon('lock',14) },
      { id: 'leavepolicies', label: 'Leave Policies', icon: icon('shield',14) },
      { id: 'claimrates', label: 'Claim Rates', icon: icon('dollar',14) },
      { id: 'saltransgroups', label: 'Salary Trans Groups', icon: icon('layers',14) },
      { id: 'upperlimits', label: 'Upper Limits', icon: icon('trendingUp',14) },
      { id: 'workflows', label: 'Workflows', icon: icon('activity',14) },
    ];

    el.innerHTML = `
      ${UI.detailTabs(tabs, this.state.activeTab)}
      <div id="settings-content"></div>
    `;

    el.querySelectorAll('[data-detail-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.state.activeTab = tab.dataset.detailTab;
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderTab();
      });
    });

    await this.renderTab();
  },

  async renderDirect(el) {
    await this.render(el);
  },

  async renderTab() {
    const el = document.getElementById('settings-content');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      await this._renderActiveTab(el);
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`; }
  },

  async _renderActiveTab(el) {
    switch (this.state.activeTab) {
      case 'municipality': await this.renderMunicipalityTab(el); break;
      case 'employeetypes': await this.renderEmployeeTypesTab(el); break;
      case 'taskgrades': await this.renderTaskGradesTab(el); break;
      case 'conditions': await this.renderConditionsTab(el); break;
      case 'tax': await this.renderTaxTab(el); break;
      case 'leave': await this.renderLeaveTab(el); break;
      case 'salaryheads': await this.renderSalaryHeadsTab(el); break;
      case 'bank': await this.renderBankTab(el); break;
      case 'security': await this.renderSecurityTab(el); break;
      case 'leavepolicies': await this.renderLeavePoliciesTab(el); break;
      case 'claimrates': await this.renderClaimRatesTab(el); break;
      case 'saltransgroups': await this.renderSalaryTransGroupsTab(el); break;
      case 'upperlimits': await this.renderUpperLimitsTab(el); break;
      case 'workflows': await this.renderWorkflowsTab(el); break;
      default: el.innerHTML = '<div class="loading">Tab not found</div>';
    }
  },

  async renderTaxTab(el) {
    const yearsRes = await api('/settings/tax-years');
    this.state.taxYears = yearsRes.data || [];
    if (!this.state.taxYear && this.state.taxYears.length > 0) this.state.taxYear = this.state.taxYears[0];

    const taxRes = await api(`/settings/tax-tables/${this.state.taxYear}`);
    this.state.taxData = taxRes.data;
    const d = this.state.taxData;

    const yearOpts = this.state.taxYears.map(y => `<option value="${y}" ${y == this.state.taxYear ? 'selected' : ''}>Tax Year ${y} (Mar ${y-1} - Feb ${y})</option>`).join('');

    const bracketRows = (d.brackets || []).map(b => `
      <tr>
        <td>${b.bracket_number}</td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(b.min_income)}" data-field="min_income" data-id="${b.id}" step="1"></td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(b.max_income)}" data-field="max_income" data-id="${b.id}" step="1"></td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(b.base_tax)}" data-field="base_tax" data-id="${b.id}" step="1"></td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(b.rate)}" data-field="rate" data-id="${b.id}" step="0.01" style="width:80px"></td>
        <td><button class="action-btn danger" data-del-bracket="${b.id}" title="Delete">${icon('trash',14)}</button></td>
      </tr>
    `).join('');

    const rebateRows = (d.rebates || []).map(r => `
      <tr>
        <td><span class="badge badge-info">${r.rebate_type}</span></td>
        <td>${r.age_threshold > 0 ? r.age_threshold + '+' : 'All'}</td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(r.amount)}" data-rebate-id="${r.id}" step="1"></td>
        <td style="text-align:right">${formatCurrency(parseFloat(r.amount) / 12)}</td>
      </tr>
    `).join('');

    const thresholdRows = (d.thresholds || []).map(t => `
      <tr>
        <td>${t.threshold_type?.replace(/_/g, ' ') || t.age_group}</td>
        <td>${t.age_group || '-'}</td>
        <td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(t.amount)}" data-threshold-id="${t.id}" step="1"></td>
        <td style="text-align:right">${formatCurrency(parseFloat(t.amount) / 12)}</td>
      </tr>
    `).join('');

    const uif = d.uif;
    const sdl = d.sdl;
    const mc = d.medical_tax_credits;

    el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
        <select id="tax-year-select" class="form-control" style="width:280px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px">${yearOpts}</select>
        <button class="btn btn-primary" id="btn-save-tax" style="display:none">${icon('check',14)} Save All Changes</button>
        <button class="btn" id="btn-copy-tax">${icon('copy',14)} Copy to New Year</button>
      </div>

      ${UI.statCards([
        { label: 'UIF Rate (EE)', value: uif ? `${parseFloat(uif.employee_rate)}%` : 'N/A' },
        { label: 'UIF Rate (ER)', value: uif ? `${parseFloat(uif.employer_rate)}%` : 'N/A' },
        { label: 'UIF Ceiling', value: uif ? formatCurrency(uif.ceiling) : 'N/A' },
        { label: 'SDL Rate', value: sdl ? `${parseFloat(sdl.rate)}%` : 'N/A' },
        { label: 'SDL Threshold', value: sdl ? formatCurrency(sdl.threshold) : 'N/A' }
      ])}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('fileText',14)} Income Tax Brackets</h4>
            <button class="btn btn-primary" id="btn-add-bracket" style="font-size:11px;padding:4px 10px">${icon('plus',12)} Add Bracket</button>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>#</th><th style="text-align:right">From (R)</th><th style="text-align:right">To (R)</th><th style="text-align:right">Base Tax (R)</th><th style="text-align:right">Rate %</th><th></th></tr></thead>
              <tbody id="brackets-body">${bracketRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No brackets</td></tr>'}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('shield',14)} Tax Rebates</h4>
          <div class="data-grid" style="margin-bottom:20px">
            <table>
              <thead><tr><th>Type</th><th>Age</th><th style="text-align:right">Annual (R)</th><th style="text-align:right">Monthly (R)</th></tr></thead>
              <tbody>${rebateRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No rebates</td></tr>'}</tbody>
            </table>
          </div>

          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('activity',14)} Tax Thresholds</h4>
          <div class="data-grid" style="margin-bottom:20px">
            <table>
              <thead><tr><th>Type</th><th>Age Group</th><th style="text-align:right">Annual (R)</th><th style="text-align:right">Monthly (R)</th></tr></thead>
              <tbody>${thresholdRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No thresholds</td></tr>'}</tbody>
            </table>
          </div>

          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('heart',14)} Medical Tax Credits (Monthly)</h4>
          <div class="data-grid" style="margin-bottom:20px">
            <table>
              <thead><tr><th>Category</th><th style="text-align:right">Amount (R)</th></tr></thead>
              <tbody>
                ${mc ? `
                  <tr><td>Main Member</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(mc.main_member)}" data-mc="main_member" step="1"></td></tr>
                  <tr><td>First Dependant</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(mc.first_dependant)}" data-mc="first_dependant" step="1"></td></tr>
                  <tr><td>Additional Dependant</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(mc.additional_dependant)}" data-mc="additional_dependant" step="1"></td></tr>
                ` : '<tr><td colspan="2" style="text-align:center;color:var(--text-muted)">No data</td></tr>'}
              </tbody>
            </table>
          </div>

          <h4 style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('dollar',14)} UIF & SDL Settings</h4>
          <div class="data-grid">
            <table>
              <thead><tr><th>Setting</th><th style="text-align:right">Value</th></tr></thead>
              <tbody>
                ${uif ? `
                  <tr><td>UIF Employee Rate (%)</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(uif.employee_rate)}" data-uif="employee_rate" step="0.01"></td></tr>
                  <tr><td>UIF Employer Rate (%)</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(uif.employer_rate)}" data-uif="employer_rate" step="0.01"></td></tr>
                  <tr><td>UIF Monthly Ceiling (R)</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(uif.ceiling)}" data-uif="ceiling" step="1"></td></tr>
                ` : ''}
                ${sdl ? `
                  <tr><td>SDL Rate (%)</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(sdl.rate)}" data-sdl="rate" step="0.01"></td></tr>
                  <tr><td>SDL Annual Threshold (R)</td><td style="text-align:right"><input type="number" class="form-control form-control-sm" value="${parseFloat(sdl.threshold)}" data-sdl="threshold" step="1"></td></tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('tax-year-select').addEventListener('change', (e) => {
      this.state.taxYear = parseInt(e.target.value);
      this.renderTab();
    });

    el.querySelectorAll('.form-control-sm').forEach(input => {
      input.addEventListener('change', () => {
        const saveBtn = document.getElementById('btn-save-tax');
        if (saveBtn) saveBtn.style.display = '';
      });
    });

    document.getElementById('btn-save-tax')?.addEventListener('click', () => this.saveAllTaxChanges());
    document.getElementById('btn-copy-tax')?.addEventListener('click', () => this.showCopyTaxYearModal());
    document.getElementById('btn-add-bracket')?.addEventListener('click', () => this.showAddBracketModal());

    el.querySelectorAll('[data-del-bracket]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.delBracket;
        const confirmed = await UI.confirm({ title: 'Delete Bracket', message: 'Are you sure you want to remove this tax bracket?', confirmText: 'Delete', danger: true });
        if (!confirmed) return;
        try {
          await fetch(API_BASE + `/settings/tax-brackets/${id}`, { method: 'DELETE' });
          UI.toast('success', 'Deleted', 'Tax bracket removed');
          this.renderTab();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });
  },

  async saveAllTaxChanges() {
    const d = this.state.taxData;
    const promises = [];

    document.querySelectorAll('[data-field][data-id]').forEach(input => {
      const id = input.dataset.id;
      const field = input.dataset.field;
      const bracket = d.brackets.find(b => b.id == id);
      if (bracket) bracket[field] = parseFloat(input.value);
    });

    const bracketGroups = {};
    d.brackets.forEach(b => {
      bracketGroups[b.id] = { min_income: parseFloat(b.min_income), max_income: parseFloat(b.max_income), base_tax: parseFloat(b.base_tax), rate: parseFloat(b.rate) };
    });
    for (const [id, data] of Object.entries(bracketGroups)) {
      promises.push(fetch(API_BASE + `/settings/tax-brackets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
    }

    document.querySelectorAll('[data-rebate-id]').forEach(input => {
      const id = input.dataset.rebateId;
      const rebate = d.rebates.find(r => r.id == id);
      promises.push(fetch(API_BASE + `/settings/tax-rebates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(input.value), age_threshold: rebate?.age_threshold || 0 }) }));
    });

    document.querySelectorAll('[data-threshold-id]').forEach(input => {
      promises.push(fetch(API_BASE + `/settings/tax-thresholds/${input.dataset.thresholdId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(input.value) }) }));
    });

    if (d.medical_tax_credits?.id) {
      const mcData = {};
      document.querySelectorAll('[data-mc]').forEach(input => { mcData[input.dataset.mc] = parseFloat(input.value); });
      if (Object.keys(mcData).length > 0) {
        promises.push(fetch(API_BASE + `/settings/medical-credits/${d.medical_tax_credits.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mcData) }));
      }
    }

    if (d.uif?.id) {
      const uifData = {};
      document.querySelectorAll('[data-uif]').forEach(input => { uifData[input.dataset.uif] = parseFloat(input.value); });
      if (Object.keys(uifData).length > 0) {
        promises.push(fetch(API_BASE + `/settings/uif-settings/${d.uif.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uifData) }));
      }
    }

    if (d.sdl?.id) {
      const sdlData = {};
      document.querySelectorAll('[data-sdl]').forEach(input => { sdlData[input.dataset.sdl] = parseFloat(input.value); });
      if (Object.keys(sdlData).length > 0) {
        promises.push(fetch(API_BASE + `/settings/sdl-settings/${d.sdl.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sdlData) }));
      }
    }

    try {
      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) { UI.toast('error', 'Partial Save', `${failed.length} update(s) failed`); }
      else { UI.toast('success', 'Tax Tables Saved', 'All changes saved successfully'); }
      const saveBtn = document.getElementById('btn-save-tax');
      if (saveBtn) saveBtn.style.display = 'none';
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  showCopyTaxYearModal() {
    const nextYear = (this.state.taxYears[0] || 2026) + 1;
    UI.modal({
      title: 'Copy Tax Tables to New Year',
      content: `
        <div class="form-grid" id="copy-tax-form">
          ${UI.buildForm([
            { type: 'section', label: 'Copy Configuration', icon: icon('copy',16) },
            { id: 'copy_from', label: 'Copy From', type: 'select', options: this.state.taxYears.map(y => ({ value: y, label: `Tax Year ${y}` })), required: true },
            { id: 'copy_to', label: 'Copy To (New Year)', type: 'number', value: nextYear, required: true, hint: 'Enter the new tax year (e.g. 2027)' },
          ])}
          <p style="padding:10px 14px;background:var(--success-bg);border-radius:var(--radius-sm);font-size:12px;color:var(--success-dark);margin-top:8px">
            ${icon('activity',14)} This will copy all brackets, rebates, thresholds, medical credits, UIF and SDL settings to the new year. You can then edit the values for the new year.
          </p>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-do-copy">Copy Tables</button>`
    });

    document.getElementById('btn-do-copy')?.addEventListener('click', async () => {
      const form = document.getElementById('copy-tax-form');
      const data = UI.getFormData(form);
      try {
        await apiPost('/settings/tax-tables/copy', { from_year: parseInt(data.copy_from), to_year: parseInt(data.copy_to) });
        UI.closeModal();
        UI.toast('success', 'Tables Copied', `Tax tables copied to ${data.copy_to}. Update values as needed.`);
        this.state.taxYear = parseInt(data.copy_to);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  showAddBracketModal() {
    const nextNum = (this.state.taxData?.brackets?.length || 0) + 1;
    const lastBracket = this.state.taxData?.brackets?.[this.state.taxData.brackets.length - 1];
    const nextMin = lastBracket ? parseFloat(lastBracket.max_income) + 1 : 0;

    UI.modal({
      title: 'Add Tax Bracket',
      content: `
        <div class="form-grid" id="add-bracket-form">
          ${UI.buildForm([
            { type: 'section', label: 'New Bracket', icon: icon('fileText',16) },
            { id: 'ab_bracket_number', label: 'Bracket Number', type: 'number', value: nextNum, required: true },
            { id: 'ab_min_income', label: 'From (R)', type: 'number', value: nextMin, required: true, step: '1' },
            { id: 'ab_max_income', label: 'To (R)', type: 'number', value: 0, required: true, step: '1' },
            { id: 'ab_base_tax', label: 'Base Tax (R)', type: 'number', value: 0, required: true, step: '1' },
            { id: 'ab_rate', label: 'Rate (%)', type: 'number', value: 0, required: true, step: '0.01', min: 0, max: 100 },
          ])}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-do-add-bracket">Add Bracket</button>`
    });

    document.getElementById('btn-do-add-bracket')?.addEventListener('click', async () => {
      const form = document.getElementById('add-bracket-form');
      const data = UI.getFormData(form);
      try {
        await apiPost('/settings/tax-brackets', {
          tax_year: this.state.taxYear,
          bracket_number: parseInt(data.ab_bracket_number),
          min_income: parseFloat(data.ab_min_income),
          max_income: parseFloat(data.ab_max_income),
          base_tax: parseFloat(data.ab_base_tax),
          rate: parseFloat(data.ab_rate),
        });
        UI.closeModal();
        UI.toast('success', 'Bracket Added', 'New tax bracket created');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderLeaveTab(el) {
    const [typesRes, schemesRes] = await Promise.all([
      api('/settings/leave-types'),
      api('/settings/leave-schemes'),
    ]);
    this.state.leaveTypes = typesRes.data || [];
    this.state.leaveSchemes = schemesRes.data || [];

    const rows = this.state.leaveTypes.map(lt => `
      <tr>
        <td><span class="badge badge-info">${lt.code}</span></td>
        <td style="font-weight:500">${lt.name}</td>
        <td>${lt.scheme_name || '-'}</td>
        <td style="text-align:right">${parseFloat(lt.accrual_days || 0).toFixed(2)}</td>
        <td style="text-align:right">${parseFloat(lt.max_accumulation || 0).toFixed(2)}</td>
        <td>${lt.accrual_frequency || '-'}</td>
        <td style="text-align:right">${parseFloat(lt.carry_over_days || 0).toFixed(2)}</td>
        <td style="text-align:center">${lt.requires_document ? '<span class="badge badge-warning">Yes</span>' : '<span style="color:var(--text-muted)">No</span>'}</td>
        <td style="text-align:center">${lt.paid ? '<span class="badge badge-success">Paid</span>' : '<span class="badge badge-danger">Unpaid</span>'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="action-btn" data-edit-lt="${lt.id}" title="Edit">${icon('edit',14)}</button>
            <button class="action-btn danger" data-del-lt="${lt.id}" data-code="${lt.code}" title="Delete">${icon('trash',14)}</button>
          </div>
        </td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Leave Type Configuration</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">BCEA-compliant leave types with accrual rules and limits</p>
        </div>
        <button class="btn btn-primary" id="btn-add-leave-type">${icon('plus',14)} Add Leave Type</button>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Leave Type</th><th>Scheme</th><th style="text-align:right">Annual Days</th>
              <th style="text-align:right">Max Accumulation</th><th>Accrual Freq</th><th style="text-align:right">Carry Over</th>
              <th style="text-align:center">Docs Required</th><th style="text-align:center">Paid</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:32px">No leave types configured</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-leave-type')?.addEventListener('click', () => this.showLeaveTypeModal(null));
    el.querySelectorAll('[data-edit-lt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lt = this.state.leaveTypes.find(l => l.id == btn.dataset.editLt);
        if (lt) this.showLeaveTypeModal(lt);
      });
    });
    el.querySelectorAll('[data-del-lt]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await UI.confirm({ title: 'Delete Leave Type', message: `Delete <strong>${btn.dataset.code}</strong>? If used in historical data, it will be disabled instead.`, confirmText: 'Delete', danger: true });
        if (!confirmed) return;
        try {
          const res = await fetch(API_BASE + `/settings/leave-types/${btn.dataset.delLt}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          UI.toast('success', 'Deleted', 'Leave type removed');
          this.renderTab();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });
  },

  showLeaveTypeModal(existing) {
    const schemeOpts = this.state.leaveSchemes.map(s => ({ value: s.id, label: s.name }));
    const formFields = UI.buildForm([
      { type: 'section', label: existing ? 'Edit Leave Type' : 'New Leave Type', icon: icon('calendar',16) },
      { id: 'lt_code', label: 'Code', type: existing ? 'readonly' : 'text', required: true, placeholder: 'e.g. ANNUAL, SICK', value: existing?.code || '' },
      { id: 'lt_name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Annual Leave', value: existing?.name || '' },
      { id: 'lt_leave_scheme_id', label: 'Leave Scheme', type: 'select', options: [{ value: '', label: '-- Select --' }, ...schemeOpts], value: existing?.leave_scheme_id || '' },
      { type: 'section', label: 'Accrual Rules', icon: icon('activity',16) },
      { id: 'lt_accrual_days', label: 'Annual Days', type: 'number', min: 0, step: '0.5', value: existing?.accrual_days || 0, hint: 'Total days accrued per year' },
      { id: 'lt_max_accumulation', label: 'Max Accumulation', type: 'number', min: 0, step: '0.5', value: existing?.max_accumulation || 0, hint: 'Maximum balance that can accumulate' },
      { id: 'lt_accrual_frequency', label: 'Accrual Frequency', type: 'select', options: [
        { value: 'ANNUAL', label: 'Annual (credited at start of cycle)' },
        { value: 'MONTHLY', label: 'Monthly (accrued monthly)' },
        { value: 'ONCE_OFF', label: 'Once Off (granted once)' }
      ], value: existing?.accrual_frequency || 'ANNUAL' },
      { id: 'lt_carry_over_days', label: 'Carry Over Days', type: 'number', min: 0, step: '0.5', value: existing?.carry_over_days || 0, hint: 'Days that carry over to next cycle' },
      { type: 'section', label: 'Rules', icon: icon('shield',16) },
      { id: 'lt_requires_document', label: 'Requires Document', type: 'checkbox', value: existing?.requires_document || false, checkLabel: 'Supporting documentation required' },
      { id: 'lt_paid', label: 'Paid Leave', type: 'checkbox', value: existing ? existing.paid : true, checkLabel: 'Employee receives pay during leave' },
      { id: 'lt_negative_balance_allowed', label: 'Negative Balance', type: 'checkbox', value: existing?.negative_balance_allowed || false, checkLabel: 'Allow leave requests with insufficient balance' },
    ]);

    UI.modal({
      title: existing ? `Edit Leave Type: ${existing.code}` : 'Add Leave Type',
      content: `<div class="form-grid" id="leave-type-form">${formFields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-lt">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-lt')?.addEventListener('click', async () => {
      const form = document.getElementById('leave-type-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation', errors[0]); return; }
      const data = UI.getFormData(form);
      const body = {
        code: data.lt_code, name: data.lt_name,
        leave_scheme_id: data.lt_leave_scheme_id || null,
        accrual_days: parseFloat(data.lt_accrual_days) || 0,
        max_accumulation: parseFloat(data.lt_max_accumulation) || 0,
        accrual_frequency: data.lt_accrual_frequency || 'ANNUAL',
        carry_over_days: parseFloat(data.lt_carry_over_days) || 0,
        requires_document: data.lt_requires_document || false,
        paid: data.lt_paid !== false,
        negative_balance_allowed: data.lt_negative_balance_allowed || false,
      };
      try {
        if (existing) {
          const res = await fetch(API_BASE + `/settings/leave-types/${existing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        } else {
          await apiPost('/settings/leave-types', body);
        }
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `${data.lt_name} has been ${existing ? 'updated' : 'created'}`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderSalaryHeadsTab(el) {
    const res = await api('/settings/salary-heads');
    this.state.salaryHeads = res.data || [];

    const grouped = { EARNING: [], DEDUCTION: [], COMPANY_CONTRIBUTION: [], FRINGE_BENEFIT: [] };
    this.state.salaryHeads.forEach(sh => {
      if (grouped[sh.transaction_type]) grouped[sh.transaction_type].push(sh);
    });

    const renderGroup = (label, heads, badgeClass, borderColor) => {
      if (heads.length === 0) return '';
      const rows = heads.map(h => `
        <tr>
          <td><span class="badge badge-${badgeClass}">${h.code}</span></td>
          <td style="font-weight:500">${h.name}</td>
          <td>${this.getCalcMethodLabel(h.calculation_method)}</td>
          <td style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(h.formula || '').replace(/"/g, '&quot;')}">${h.formula || '<span style="color:var(--text-muted)">-</span>'}</td>
          <td style="text-align:center">${h.taxable ? '<span style="color:var(--success-dark)">' + icon('check',14) + '</span>' : '<span style="color:var(--text-muted)">-</span>'}</td>
          <td>${h.irp5_code || '<span style="color:var(--text-muted)">-</span>'}</td>
          <td style="text-align:center">${h.priority}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="action-btn" data-edit-sh="${h.id}" title="Edit">${icon('edit',14)}</button>
              ${h.calculation_method !== 'SYSTEM_CALCULATE' ? `<button class="action-btn danger" data-del-sh="${h.id}" data-code="${h.code}" data-name="${h.name}" title="Delete">${icon('trash',14)}</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');
      return `
        <div style="margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <h4 style="margin:0;font-size:13px;font-weight:600;color:var(--text-primary)">${label}</h4>
            <span class="badge badge-${badgeClass}" style="font-size:10px">${heads.length}</span>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Calc Method</th><th>Formula</th><th style="text-align:center">Taxable</th><th>IRP5</th><th style="text-align:center">Priority</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    };

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Salary Head Configuration</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Configure earnings, deductions, and company contributions with calculation formulas</p>
        </div>
        <button class="btn btn-primary" id="btn-add-sh-settings">${icon('plus',14)} Add Salary Head</button>
      </div>
      ${renderGroup('Earnings', grouped.EARNING, 'success')}
      ${renderGroup('Deductions', grouped.DEDUCTION, 'danger')}
      ${renderGroup('Company Contributions', grouped.COMPANY_CONTRIBUTION, 'info')}
      ${renderGroup('Fringe Benefits', grouped.FRINGE_BENEFIT, 'warning')}
    `;

    document.getElementById('btn-add-sh-settings')?.addEventListener('click', () => this.showSalaryHeadModal(null));
    el.querySelectorAll('[data-edit-sh]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sh = this.state.salaryHeads.find(s => s.id == btn.dataset.editSh);
        if (sh) this.showSalaryHeadModal(sh);
      });
    });
    el.querySelectorAll('[data-del-sh]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await UI.confirm({ title: 'Delete Salary Head', message: `Delete <strong>${btn.dataset.code} - ${btn.dataset.name}</strong>?`, confirmText: 'Delete', danger: true });
        if (!confirmed) return;
        try {
          const res = await fetch(API_BASE + `/payroll/salary-heads/${btn.dataset.delSh}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          UI.toast('success', 'Deleted', 'Salary head removed');
          this.renderTab();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });
  },

  getCalcMethodLabel(method) {
    const labels = {
      'USER_INPUT': 'Fixed Amount',
      'PERCENTAGE_OF_BASIC': '% of Basic',
      'SYSTEM_CALCULATE': 'System (Statutory)',
      'FIXED': 'Fixed (All)',
      'FORMULA': 'Formula',
    };
    return labels[method] || method;
  },

  async showSalaryHeadModal(existing) {
    const isSystem = existing?.calculation_method === 'SYSTEM_CALCULATE';
    let cosOpts = [], etOpts = [], estOpts = [];
    try {
      const [cosRes, etRes, estRes] = await Promise.all([
        api('/settings/conditions-of-service').catch(() => ({ data: [] })),
        api('/settings/employee-types').catch(() => ({ data: [] })),
        api('/settings/employee-subtypes').catch(() => ({ data: [] })),
      ]);
      cosOpts = (cosRes.data || []).map(c => ({ value: c.id, label: c.name }));
      etOpts = (etRes.data || []).map(e => ({ value: e.id || e.name, label: e.name }));
      estOpts = (estRes.data || []).map(e => ({ value: e.id || e.name, label: e.name }));
    } catch (e) {}

    const formFields = UI.buildForm([
      { type: 'section', label: 'Salary Head Definition', icon: icon('dollar',16) },
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
        { value: 'FORMULA', label: 'Formula (Custom Expression)' },
        { value: 'SYSTEM_CALCULATE', label: 'System Calculated (Statutory)' },
        { value: 'FIXED', label: 'Fixed (Same for All)' }
      ], value: existing?.calculation_method || 'USER_INPUT' },
      { type: 'section', label: 'Formula Expression', icon: icon('lightbulb',16) },
      { id: 'sh_formula', label: 'Formula', type: 'textarea', placeholder: 'e.g. BasicSalary * 0.075 or CostAmount * (FixedSalary / WHPM_Monthly) * -1', value: existing?.formula || '', hint: 'Variables: BasicSalary, AnnualSalary, GrossEarnings, TotalDeductions, HoursWorked, DaysWorked, WHPM_Monthly, CostAmount, FixedSalary. Operators: + - * / ( )' },
      { type: 'section', label: 'Default Contribution Rates', icon: icon('dollar',16) },
      { id: 'sh_employee_contribution', label: 'Employee Contribution %', type: 'number', min: 0, max: 100, step: '0.01', placeholder: '0.00', value: existing?.employee_contribution || '', hint: 'Default % when assigning to employees' },
      { id: 'sh_employer_contribution', label: 'Employer Contribution %', type: 'number', min: 0, max: 100, step: '0.01', placeholder: '0.00', value: existing?.employer_contribution || '', hint: 'Municipality portion %' },
      { type: 'section', label: 'Selection Criteria', icon: icon('users',16) },
      { id: 'sh_condition_of_service_id', label: 'Condition of Service', type: 'select', options: [{ value: '', label: '-- All Conditions --' }, ...cosOpts], value: existing?.condition_of_service_id || '' },
      { id: 'sh_employee_type_filter', label: 'Employee Type', type: 'select', options: [{ value: '', label: '-- All Types --' }, ...etOpts], value: existing?.employee_type_filter || '' },
      { id: 'sh_employee_subtype_filter', label: 'Employee Subtype', type: 'select', options: [{ value: '', label: '-- All Subtypes --' }, ...estOpts], value: existing?.employee_subtype_filter || '' },
      { id: 'sh_pro_rated', label: 'Pro-rated', type: 'checkbox', value: existing?.pro_rated || false, checkLabel: 'Pro-rate based on days worked in period' },
      { id: 'sh_round_calculation', label: 'Rounding', type: 'select', options: [
        { value: '', label: 'No Rounding' },
        { value: 'ROUND', label: 'Round to nearest' },
        { value: 'FLOOR', label: 'Round down' },
        { value: 'CEIL', label: 'Round up' }
      ], value: existing?.round_calculation || '' },
      { id: 'sh_round_digits', label: 'Round Digits', type: 'number', min: 0, max: 6, value: existing?.round_digits ?? 2 },
      { type: 'section', label: 'SARS / IRP5', icon: icon('fileText',16) },
      { id: 'sh_irp5_code', label: 'IRP5 Source Code', type: 'text', placeholder: 'e.g. 3601', value: existing?.irp5_code || '' },
      { id: 'sh_sars_code', label: 'SARS Code', type: 'text', value: existing?.sars_code || '' },
      { type: 'section', label: 'Tax Flags', icon: icon('shield',16) },
      { id: 'sh_taxable', label: 'Taxable', type: 'checkbox', value: existing ? existing.taxable : true, checkLabel: 'Subject to income tax' },
      { id: 'sh_affects_uif', label: 'Affects UIF', type: 'checkbox', value: existing?.affects_uif || false, checkLabel: 'Included in UIF calculation' },
      { id: 'sh_affects_sdl', label: 'Affects SDL', type: 'checkbox', value: existing?.affects_sdl || false, checkLabel: 'Included in SDL calculation' },
      { type: 'section', label: 'mSCOA Accounting', icon: icon('grid',16) },
      { id: 'sh_scoa_debit_item', label: 'mSCOA Debit Item', type: 'text', placeholder: 'e.g. ERC:0001', value: existing?.scoa_debit_item || '' },
      { id: 'sh_scoa_credit_item', label: 'mSCOA Credit Item', type: 'text', placeholder: 'e.g. BSP:0100', value: existing?.scoa_credit_item || '' },
      { id: 'sh_show_on_payslip', label: 'Show on Payslip', type: 'checkbox', value: existing ? existing.show_on_payslip : true, checkLabel: 'Display on employee payslip' },
      { id: 'sh_priority', label: 'Processing Priority', type: 'number', placeholder: '0', value: existing?.priority || 0, hint: 'Lower = processed first. Earnings: 1-99, Deductions: 100-199, Company: 200-299' },
      { id: 'sh_start_date', label: 'Start Date', type: 'date', required: !existing, value: existing?.start_date ? existing.start_date.substring(0,10) : '' }
    ]);

    UI.modal({
      title: existing ? `Edit Salary Head: ${existing.code}` : 'Add Salary Head',
      content: `
        ${isSystem ? '<p style="padding:10px 14px;background:var(--warning-bg);border-radius:var(--radius-sm);margin-bottom:12px;font-size:12px;color:var(--warning-dark)">' + icon('alertTriangle',14) + ' System-calculated head. Tax flags and calculation method are managed by the payroll engine.</p>' : ''}
        <div class="form-grid" id="settings-sh-form">${formFields}</div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-sh-settings">${existing ? 'Update' : 'Create'}</button>`
    });

    if (typeof PayrollModule !== 'undefined' && PayrollModule.replaceScoaInputsWithDropdowns) {
      PayrollModule.replaceScoaInputsWithDropdowns('settings-sh-form', existing?.scoa_debit_item || '', existing?.scoa_credit_item || '');
    }

    this.toggleFormulaField();
    const calcSelect = document.getElementById('sh_calculation_method');
    if (calcSelect) calcSelect.addEventListener('change', () => this.toggleFormulaField());

    document.getElementById('btn-save-sh-settings')?.addEventListener('click', async () => {
      const form = document.getElementById('settings-sh-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation', errors[0]); return; }
      const data = UI.getFormData(form);

      if (data.sh_calculation_method === 'FORMULA' && data.sh_formula) {
        const validation = this.validateFormula(data.sh_formula);
        if (!validation.valid) { UI.toast('error', 'Formula Error', validation.error); return; }
      }

      const body = {
        code: data.sh_code, name: data.sh_name,
        transaction_type: data.sh_transaction_type,
        calculation_method: data.sh_calculation_method || 'USER_INPUT',
        formula: data.sh_formula || null,
        irp5_code: data.sh_irp5_code, sars_code: data.sh_sars_code,
        taxable: data.sh_taxable, affects_uif: data.sh_affects_uif, affects_sdl: data.sh_affects_sdl,
        scoa_debit_item: data.sh_scoa_debit_item, scoa_credit_item: data.sh_scoa_credit_item,
        show_on_payslip: data.sh_show_on_payslip,
        employee_contribution: parseFloat(data.sh_employee_contribution) || 0,
        employer_contribution: parseFloat(data.sh_employer_contribution) || 0,
        priority: parseInt(data.sh_priority) || 0,
        start_date: data.sh_start_date || null,
        condition_of_service_id: data.sh_condition_of_service_id || null,
        employee_type_filter: data.sh_employee_type_filter || null,
        employee_subtype_filter: data.sh_employee_subtype_filter || null,
        pro_rated: data.sh_pro_rated || false,
        round_calculation: data.sh_round_calculation || null,
        round_digits: parseInt(data.sh_round_digits) || 2,
      };

      try {
        if (existing) {
          const res = await fetch(API_BASE + `/payroll/salary-heads/${existing.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        } else {
          await apiPost('/payroll/salary-heads', body);
        }
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `${data.sh_name} has been ${existing ? 'updated' : 'created'}`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  toggleFormulaField() {
    const method = document.getElementById('sh_calculation_method')?.value;
    const formulaGroup = document.getElementById('sh_formula')?.closest('.form-group');
    const formulaSection = formulaGroup?.previousElementSibling;
    if (formulaGroup) formulaGroup.style.display = method === 'FORMULA' ? '' : 'none';
    if (formulaSection && formulaSection.querySelector('.section-label')?.textContent?.includes('Formula')) {
      formulaSection.style.display = method === 'FORMULA' ? '' : 'none';
    }
  },

  validateFormula(formula) {
    const allowedVars = ['BasicSalary', 'AnnualSalary', 'GrossEarnings', 'TotalDeductions', 'HoursWorked', 'DaysWorked', 'WHPM_Monthly', 'CostAmount', 'FixedSalary'];
    const cleaned = formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
      if (allowedVars.includes(match)) return '1';
      return match;
    });

    const safePattern = /^[0-9\s+\-*/().]+$/;
    if (!safePattern.test(cleaned)) {
      return { valid: false, error: `Formula contains invalid characters or unknown variables. Allowed variables: ${allowedVars.join(', ')}` };
    }

    try {
      const testVars = {};
      allowedVars.forEach(v => testVars[v] = 1000);
      const fn = new Function(...allowedVars, `return ${formula}`);
      const result = fn(...allowedVars.map(v => testVars[v]));
      if (isNaN(result) || !isFinite(result)) {
        return { valid: false, error: 'Formula produces invalid result (NaN or Infinity)' };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: `Formula syntax error: ${e.message}` };
    }
  },

  async renderBankTab(el) {
    try {
      const res = await api('/settings/system');
      const s = res.data || {};

      const fields = UI.buildForm([
        { type: 'section', label: 'Payment Configuration', icon: icon('creditCard',16) },
        { id: 'sys-payment-mode', label: 'Payment Mode', type: 'select', value: s.payment_mode || 'MANUAL_EFT', options: [{ value: 'MANUAL_EFT', label: 'Manual EFT' }, { value: 'HOST_TO_HOST', label: 'Host-to-Host (H2H)' }] },
        { id: 'sys-auto-gl', label: 'Auto GL Post on Approval', type: 'checkbox', value: s.auto_gl_post === 'true', checkLabel: 'Auto GL Post on Approval' },
        { id: 'sys-auto-batches', label: 'Auto Generate Payment Batches', type: 'checkbox', value: s.auto_generate_batches === 'true', checkLabel: 'Auto Generate Payment Batches' },
        { type: 'section', label: 'Municipality Bank Details', icon: icon('briefcase',16) },
        { id: 'sys-bank-name', label: 'Bank Name', type: 'text', value: s.municipality_bank_name || '' },
        { id: 'sys-branch-code', label: 'Branch Code', type: 'text', value: s.municipality_branch_code || '' },
        { id: 'sys-account-number', label: 'Account Number', type: 'text', value: s.municipality_account_number || '' },
        { id: 'sys-account-name', label: 'Account Name', type: 'text', value: s.municipality_account_name || '' },
        { type: 'section', label: 'Host-to-Host Integration', icon: icon('link',16) },
        { id: 'sys-h2h-enabled', label: 'H2H Enabled', type: 'checkbox', value: s.h2h_enabled === 'true', checkLabel: 'H2H Enabled' },
        { id: 'sys-h2h-url', label: 'H2H API URL', type: 'text', value: s.h2h_api_url || '', placeholder: 'https://...' },
      ]);

      el.innerHTML = `
        <div class="form-grid" id="bank-form">
          ${fields}
        </div>
        <div style="margin-top:20px">
          <button class="btn btn-primary" id="sys-save">${icon('check',13)} Save Settings</button>
        </div>
      `;

      document.getElementById('sys-h2h-enabled')?.addEventListener('change', (e) => {
        const urlGroup = document.getElementById('sys-h2h-url-group');
        if (urlGroup) urlGroup.style.opacity = e.target.checked ? '1' : '0.5';
      });

      document.getElementById('sys-save')?.addEventListener('click', async () => {
        const settings = {
          payment_mode: document.getElementById('sys-payment-mode')?.value || 'MANUAL_EFT',
          auto_gl_post: document.getElementById('sys-auto-gl')?.checked ? 'true' : 'false',
          auto_generate_batches: document.getElementById('sys-auto-batches')?.checked ? 'true' : 'false',
          municipality_bank_name: document.getElementById('sys-bank-name')?.value || '',
          municipality_branch_code: document.getElementById('sys-branch-code')?.value || '',
          municipality_account_number: document.getElementById('sys-account-number')?.value || '',
          municipality_account_name: document.getElementById('sys-account-name')?.value || '',
          h2h_enabled: document.getElementById('sys-h2h-enabled')?.checked ? 'true' : 'false',
          h2h_api_url: document.getElementById('sys-h2h-url')?.value || '',
        };
        try {
          const res = await fetch(`${API_BASE}/settings/system`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error?.message || 'Save failed');
          UI.toast('success', 'Saved', 'Settings saved successfully');
        } catch (err) {
          UI.toast('error', 'Error', err.message || 'Failed to save settings');
        }
      });
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load settings: ${err.message}</div>`;
    }
  },

  async renderSecurityTab(el) {
    const [permRes, rolesRes] = await Promise.all([
      api('/settings/permissions').catch(() => ({ data: [] })),
      api('/settings/user-roles').catch(() => ({ data: [] })),
    ]);
    const permissions = permRes.data || [];
    const userRoles = rolesRes.data || [];

    const permRows = permissions.map(p => `
      <tr>
        <td><span class="badge badge-info">${p.role_name || p.role_id}</span></td>
        <td>${p.module}</td>
        <td><span class="badge badge-${p.action === 'DELETE' ? 'danger' : p.action === 'APPROVE' ? 'warning' : p.action === 'WRITE' ? 'success' : 'info'}">${p.action}</span></td>
        <td>
          <button class="action-btn danger" data-del-perm="${p.id}" title="Delete">${icon('trash',14)}</button>
        </td>
      </tr>
    `).join('');

    const roleRows = userRoles.map(ur => `
      <tr>
        <td>${ur.employee_number || ur.user_id}</td>
        <td style="font-weight:500">${ur.employee_name || ur.username || '-'}</td>
        <td><span class="badge badge-info">${ur.role_name || ur.role_id}</span></td>
        <td>${ur.assigned_at ? new Date(ur.assigned_at).toLocaleDateString() : '-'}</td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('lock',14)} Permissions by Role</h4>
            <button class="btn btn-primary" id="btn-add-permission" style="font-size:11px;padding:4px 10px">${icon('plus',12)} Add Permission</button>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Role</th><th>Module</th><th>Action</th><th></th></tr></thead>
              <tbody>${permRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No permissions configured</td></tr>'}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0;font-size:13px;font-weight:600;color:var(--text-primary)">${icon('users',14)} User Role Assignments</h4>
            <button class="btn btn-primary" id="btn-add-user-role" style="font-size:11px;padding:4px 10px">${icon('plus',12)} Add User Role</button>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Employee #</th><th>Name</th><th>Role</th><th>Assigned</th></tr></thead>
              <tbody>${roleRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No user roles assigned</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-add-permission')?.addEventListener('click', () => this.showAddPermissionModal());
    document.getElementById('btn-add-user-role')?.addEventListener('click', () => this.showAddUserRoleModal());

    el.querySelectorAll('[data-del-perm]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await UI.confirm({ title: 'Delete Permission', message: 'Are you sure you want to remove this permission?', confirmText: 'Delete', danger: true });
        if (!confirmed) return;
        try {
          const res = await fetch(API_BASE + `/settings/permissions/${btn.dataset.delPerm}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Delete failed');
          UI.toast('success', 'Deleted', 'Permission removed');
          this.renderTab();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });
    });
  },

  showAddPermissionModal() {
    UI.modal({
      title: 'Add Permission',
      content: `
        <div class="form-grid" id="add-perm-form">
          ${UI.buildForm([
            { type: 'section', label: 'Permission Details', icon: icon('lock',16) },
            { id: 'perm_role_id', label: 'Role', type: 'text', required: true, placeholder: 'Role ID or name' },
            { id: 'perm_module', label: 'Module', type: 'text', required: true, placeholder: 'e.g. employees, payroll, leave' },
            { id: 'perm_action', label: 'Action', type: 'select', required: true, options: [
              { value: 'READ', label: 'READ' },
              { value: 'WRITE', label: 'WRITE' },
              { value: 'APPROVE', label: 'APPROVE' },
              { value: 'DELETE', label: 'DELETE' },
            ] },
          ])}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-perm">Add Permission</button>`
    });

    document.getElementById('btn-save-perm')?.addEventListener('click', async () => {
      const form = document.getElementById('add-perm-form');
      const data = UI.getFormData(form);
      try {
        await apiPost('/settings/permissions', {
          role_id: data.perm_role_id,
          module: data.perm_module,
          action: data.perm_action,
        });
        UI.closeModal();
        UI.toast('success', 'Created', 'Permission added successfully');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  showAddUserRoleModal() {
    UI.modal({
      title: 'Assign User Role',
      content: `
        <div class="form-grid" id="add-user-role-form">
          ${UI.buildForm([
            { type: 'section', label: 'User Role Assignment', icon: icon('users',16) },
            { id: 'ur_user_id', label: 'User / Employee ID', type: 'text', required: true, placeholder: 'Employee ID' },
            { id: 'ur_role_id', label: 'Role', type: 'text', required: true, placeholder: 'Role ID or name' },
          ])}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-user-role">Assign Role</button>`
    });

    document.getElementById('btn-save-user-role')?.addEventListener('click', async () => {
      const form = document.getElementById('add-user-role-form');
      const data = UI.getFormData(form);
      try {
        await apiPost('/settings/user-roles', {
          user_id: data.ur_user_id,
          role_id: data.ur_role_id,
        });
        UI.closeModal();
        UI.toast('success', 'Assigned', 'User role assigned successfully');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderLeavePoliciesTab(el) {
    const res = await api('/leave/policies').catch(() => ({ data: [] }));
    const policies = res.data || [];

    const rows = policies.map(p => `
      <tr>
        <td style="font-weight:500">${p.leave_type_name || '-'}</td>
        <td><span class="badge badge-info">${p.accrual_method || '-'}</span></td>
        <td style="text-align:right">${parseFloat(p.accrual_amount || 0).toFixed(2)}</td>
        <td style="text-align:right">${parseFloat(p.max_balance || 0).toFixed(2)}</td>
        <td style="text-align:right">${parseFloat(p.carry_over_limit || 0).toFixed(2)}</td>
        <td style="text-align:center">${p.cycle_months || '-'}</td>
        <td style="text-align:center">${p.requires_medical_cert_after_days != null ? p.requires_medical_cert_after_days : '-'}</td>
        <td>
          <button class="action-btn" data-edit-policy="${p.id}" title="Edit">${icon('edit',14)}</button>
        </td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Leave Policies</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Accrual rules, balances and carry-over limits per leave type</p>
        </div>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Leave Type</th><th>Accrual Method</th><th style="text-align:right">Accrual Amount</th>
              <th style="text-align:right">Max Balance</th><th style="text-align:right">Carry Over Limit</th>
              <th style="text-align:center">Cycle (Months)</th><th style="text-align:center">Medical Cert After Days</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No leave policies configured</td></tr>'}</tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('[data-edit-policy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const policy = policies.find(p => p.id == btn.dataset.editPolicy);
        if (policy) this.showEditLeavePolicyModal(policy);
      });
    });
  },

  showEditLeavePolicyModal(policy) {
    UI.modal({
      title: `Edit Leave Policy: ${policy.leave_type_name || 'Policy'}`,
      content: `
        <div class="form-grid" id="edit-policy-form">
          ${UI.buildForm([
            { type: 'section', label: 'Accrual Settings', icon: icon('shield',16) },
            { id: 'pol_accrual_method', label: 'Accrual Method', type: 'select', options: [
              { value: 'ANNUAL', label: 'Annual' },
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'DAILY', label: 'Daily' },
              { value: 'ONCE_OFF', label: 'Once Off' },
            ], value: policy.accrual_method || 'ANNUAL' },
            { id: 'pol_accrual_amount', label: 'Accrual Amount', type: 'number', step: '0.5', min: 0, value: policy.accrual_amount || 0 },
            { id: 'pol_max_balance', label: 'Max Balance', type: 'number', step: '0.5', min: 0, value: policy.max_balance || 0 },
            { id: 'pol_carry_over_limit', label: 'Carry Over Limit', type: 'number', step: '0.5', min: 0, value: policy.carry_over_limit || 0 },
            { id: 'pol_cycle_months', label: 'Cycle (Months)', type: 'number', min: 1, max: 60, value: policy.cycle_months || 12 },
            { id: 'pol_requires_medical_cert_after_days', label: 'Medical Cert After Days', type: 'number', min: 0, value: policy.requires_medical_cert_after_days || 0, hint: 'Number of consecutive days after which a medical certificate is required' },
          ])}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-policy">Update Policy</button>`
    });

    document.getElementById('btn-save-policy')?.addEventListener('click', async () => {
      const form = document.getElementById('edit-policy-form');
      const data = UI.getFormData(form);
      const body = {
        accrual_method: data.pol_accrual_method,
        accrual_amount: parseFloat(data.pol_accrual_amount) || 0,
        max_balance: parseFloat(data.pol_max_balance) || 0,
        carry_over_limit: parseFloat(data.pol_carry_over_limit) || 0,
        cycle_months: parseInt(data.pol_cycle_months) || 12,
        requires_medical_cert_after_days: parseInt(data.pol_requires_medical_cert_after_days) || 0,
      };
      try {
        const res = await fetch(API_BASE + `/leave/policies/${policy.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        UI.closeModal();
        UI.toast('success', 'Updated', 'Leave policy updated successfully');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderClaimRatesTab(el) {
    const res = await api('/settings/claim-rates').catch(() => ({ data: [] }));
    const rates = res.data || [];

    const rows = rates.map(r => `
      <tr>
        <td style="font-weight:500">${r.claim_type || '-'}</td>
        <td>${r.description || '-'}</td>
        <td style="text-align:right">${parseFloat(r.rate || 0).toFixed(2)}</td>
        <td>${r.rate_unit || '-'}</td>
        <td>${fmtDateSA(r.effective_date)}</td>
        <td>
          <button class="action-btn" data-edit-rate="${r.id}" title="Edit">${icon('edit',14)}</button>
        </td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Claim Rates</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Standard rates for travel, subsistence and other claim types</p>
        </div>
        <button class="btn btn-primary" id="btn-add-claim-rate">${icon('plus',14)} Add Rate</button>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Claim Type</th><th>Description</th><th style="text-align:right">Rate</th>
              <th>Unit</th><th>Effective Date</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No claim rates configured</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-claim-rate')?.addEventListener('click', () => this.showClaimRateModal(null));
    el.querySelectorAll('[data-edit-rate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = rates.find(r => r.id == btn.dataset.editRate);
        if (rate) this.showClaimRateModal(rate);
      });
    });
  },

  showClaimRateModal(existing) {
    UI.modal({
      title: existing ? `Edit Claim Rate: ${existing.claim_type}` : 'Add Claim Rate',
      content: `
        <div class="form-grid" id="claim-rate-form">
          ${UI.buildForm([
            { type: 'section', label: existing ? 'Edit Rate' : 'New Rate', icon: icon('dollar',16) },
            { id: 'cr_claim_type', label: 'Claim Type', type: 'text', required: true, placeholder: 'e.g. TRAVEL, SUBSISTENCE', value: existing?.claim_type || '' },
            { id: 'cr_description', label: 'Description', type: 'text', placeholder: 'e.g. Per kilometre rate', value: existing?.description || '' },
            { id: 'cr_rate', label: 'Rate', type: 'number', required: true, step: '0.01', min: 0, value: existing?.rate || 0 },
            { id: 'cr_rate_unit', label: 'Rate Unit', type: 'text', placeholder: 'e.g. per km, per day, flat', value: existing?.rate_unit || '' },
            { id: 'cr_effective_date', label: 'Effective Date', type: 'date', required: true, value: existing?.effective_date ? existing.effective_date.substring(0,10) : '' },
          ])}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-claim-rate">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-claim-rate')?.addEventListener('click', async () => {
      const form = document.getElementById('claim-rate-form');
      const { valid, errors } = UI.validateForm(form);
      if (!valid) { UI.toast('error', 'Validation', errors[0]); return; }
      const data = UI.getFormData(form);
      const body = {
        claim_type: data.cr_claim_type,
        description: data.cr_description || null,
        rate: parseFloat(data.cr_rate) || 0,
        rate_unit: data.cr_rate_unit || null,
        effective_date: data.cr_effective_date || null,
      };
      try {
        if (existing) {
          const res = await fetch(API_BASE + `/settings/claim-rates/${existing.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        } else {
          await apiPost('/settings/claim-rates', body);
        }
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `Claim rate ${existing ? 'updated' : 'created'} successfully`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderWorkflowsTab(el) {
    const res = await api('/workflows/definitions').catch(() => ({ data: [] }));
    const workflows = res.data || [];

    const rows = workflows.map(w => {
      let stepsDisplay = '-';
      try {
        const steps = typeof w.steps === 'string' ? JSON.parse(w.steps) : w.steps;
        if (Array.isArray(steps)) {
          stepsDisplay = steps.map((s, i) => `<span class="badge badge-info" style="margin-right:4px">${i+1}. ${s.role || s.approver || s.name || 'Step'}</span>`).join('');
        } else {
          stepsDisplay = '<span class="badge badge-warning">Custom</span>';
        }
      } catch (e) {
        stepsDisplay = '<span class="badge badge-warning">JSON</span>';
      }
      return `
        <tr>
          <td style="font-weight:500">${w.name || '-'}</td>
          <td><span class="badge badge-info">${w.module || '-'}</span></td>
          <td>${stepsDisplay}</td>
          <td>${w.is_active !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}</td>
          <td>
            <button class="action-btn" data-edit-wf="${w.id}" title="Edit">${icon('edit',14)}</button>
          </td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Workflow Definitions</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Approval workflows and their steps for each module</p>
        </div>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Module</th><th>Approval Steps</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No workflow definitions found</td></tr>'}</tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('[data-edit-wf]').forEach(btn => {
      btn.addEventListener('click', () => {
        const wf = workflows.find(w => w.id == btn.dataset.editWf);
        if (wf) this.showEditWorkflowModal(wf);
      });
    });
  },

  _esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // === MUNICIPALITY DETAILS TAB ===
  async renderMunicipalityTab(el) {
    const res = await api('/settings/municipality');
    const raw = res.data || {};
    const s = {};
    for (const k in raw) s[k] = this._esc(raw[k]);

    const provinces = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'].map(p => ({ value: p, label: p }));
    const categories = ['A','B','C','D'].map(c => ({ value: c, label: `Category ${c}` }));

    const muniFields = UI.buildForm([
      { type: 'section', label: 'Municipality Information', icon: icon('briefcase',16) },
      { id: 'muni-name', label: 'Municipality Name', type: 'text', value: s.municipality_name || '', required: true },
      { id: 'muni-code', label: 'Municipality Code', type: 'text', value: s.municipality_code || '', placeholder: 'e.g. DC01' },
      { id: 'muni-demarcation', label: 'Demarcation Code', type: 'text', value: s.municipality_demarcation_code || '', placeholder: 'e.g. MAN' },
      { id: 'muni-category', label: 'Council Category', type: 'select', value: raw.municipality_council_category || '', options: categories },
      { type: 'section', label: 'Address', icon: icon('mapPin',16) },
      { id: 'muni-addr1', label: 'Address Line 1', type: 'text', value: s.municipality_address_line1 || '', fullWidth: true },
      { id: 'muni-addr2', label: 'Address Line 2', type: 'text', value: s.municipality_address_line2 || '', fullWidth: true },
      { id: 'muni-city', label: 'City / Town', type: 'text', value: s.municipality_city || '' },
      { id: 'muni-province', label: 'Province', type: 'select', value: raw.municipality_province || '', options: provinces },
      { id: 'muni-postal', label: 'Postal Code', type: 'text', value: s.municipality_postal_code || '' },
      { type: 'section', label: 'Contact Details', icon: icon('phone',16) },
      { id: 'muni-tel', label: 'Telephone', type: 'text', value: s.municipality_telephone || '' },
      { id: 'muni-fax', label: 'Fax', type: 'text', value: s.municipality_fax || '' },
      { id: 'muni-email', label: 'Email', type: 'text', value: s.municipality_email || '' },
      { id: 'muni-website', label: 'Website', type: 'text', value: s.municipality_website || '' },
      { type: 'section', label: 'SARS Registration', icon: icon('fileText',16) },
      { id: 'muni-paye', label: 'PAYE Reference Number', type: 'text', value: s.paye_reference || '', placeholder: '7XXXXXXXXX' },
      { id: 'muni-sdl', label: 'SDL Reference Number', type: 'text', value: s.sdl_reference || '', placeholder: 'LXXXXXXXXX' },
      { id: 'muni-uif', label: 'UIF Reference Number', type: 'text', value: s.uif_reference || '', placeholder: 'UXXXXXXXXX' },
      { id: 'muni-taxno', label: 'Employer Tax Number', type: 'text', value: s.irp5_employer_tax_number || '' },
      { id: 'muni-regno', label: 'Employer Registration Number', type: 'text', value: s.irp5_employer_reg_number || '' },
      { id: 'muni-trading', label: 'Trading Name (IRP5)', type: 'text', value: s.irp5_trading_name || '' },
      { type: 'section', label: 'SARS Contact Person', icon: icon('user',16) },
      { id: 'muni-sars-name', label: 'Contact Name', type: 'text', value: s.sars_contact_name || '' },
      { id: 'muni-sars-phone', label: 'Contact Phone', type: 'text', value: s.sars_contact_phone || '' },
      { id: 'muni-sars-email', label: 'Contact Email', type: 'text', value: s.sars_contact_email || '' },
      { type: 'section', label: 'Industry Classification', icon: icon('briefcase',16) },
      { id: 'muni-industry-group', label: 'Industry Group', type: 'text', value: s.industry_group || '', placeholder: 'e.g. Public Administration' },
      { id: 'muni-activity-group', label: 'Activity Group', type: 'text', value: s.activity_group || '' },
      { type: 'section', label: 'Payslip Configuration', icon: icon('fileText',16) },
      { id: 'muni-payslip-template', label: 'Payslip Template', type: 'select', value: raw.payslip_template || 'PLAIN_PAPER', options: [
        { value: 'PLAIN_PAPER', label: 'Plain Paper' },
        { value: 'SECURE_PAPER', label: 'Secure Paper' },
        { value: 'CUSTOM', label: 'Custom Template' }
      ]},
      { id: 'muni-payslip-company-contrib', label: 'Print Company Contributions on Payslip', type: 'checkbox', value: raw.payslip_show_company_contributions === 'true', checkLabel: 'Show company contributions on employee payslips' },
      { type: 'section', label: 'Bonus Payment Configuration', icon: icon('dollar',16) },
      { id: 'muni-bonus-timing', label: 'When is Bonus Paid?', type: 'select', value: raw.bonus_payment_timing || 'EMPLOYMENT_MONTH', options: [
        { value: 'EMPLOYMENT_MONTH', label: 'Month of Employment Date' },
        { value: 'BIRTHDAY_MONTH', label: 'Month of Employee Birthday' },
        { value: 'SPECIFIC_MONTH', label: 'Specific Calendar Month' }
      ]},
      { id: 'muni-bonus-month', label: 'Bonus Month', type: 'select', value: raw.bonus_payment_month || '', options: [
        { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
        { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
      ], hint: 'Only applicable when "Specific Calendar Month" is selected above' },
    ]);

    el.innerHTML = `
      <div class="form-grid" id="muni-form">
        ${muniFields}
      </div>
      <div style="margin-top:20px">
        <button class="btn btn-primary" id="muni-save">${icon('check',13)} Save Municipality Details</button>
      </div>
    `;

    const bonusTimingEl = document.getElementById('muni-bonus-timing');
    const bonusMonthGroup = document.getElementById('muni-bonus-month')?.closest('.form-group');
    const toggleBonusMonth = () => {
      if (bonusMonthGroup) bonusMonthGroup.style.display = bonusTimingEl?.value === 'SPECIFIC_MONTH' ? '' : 'none';
    };
    toggleBonusMonth();
    bonusTimingEl?.addEventListener('change', toggleBonusMonth);

    document.getElementById('muni-save')?.addEventListener('click', async () => {
      const settings = {
        municipality_name: document.getElementById('muni-name')?.value || '',
        municipality_code: document.getElementById('muni-code')?.value || '',
        municipality_demarcation_code: document.getElementById('muni-demarcation')?.value || '',
        municipality_council_category: document.getElementById('muni-category')?.value || '',
        municipality_address_line1: document.getElementById('muni-addr1')?.value || '',
        municipality_address_line2: document.getElementById('muni-addr2')?.value || '',
        municipality_city: document.getElementById('muni-city')?.value || '',
        municipality_province: document.getElementById('muni-province')?.value || '',
        municipality_postal_code: document.getElementById('muni-postal')?.value || '',
        municipality_telephone: document.getElementById('muni-tel')?.value || '',
        municipality_fax: document.getElementById('muni-fax')?.value || '',
        municipality_email: document.getElementById('muni-email')?.value || '',
        municipality_website: document.getElementById('muni-website')?.value || '',
        paye_reference: document.getElementById('muni-paye')?.value || '',
        sdl_reference: document.getElementById('muni-sdl')?.value || '',
        uif_reference: document.getElementById('muni-uif')?.value || '',
        irp5_employer_tax_number: document.getElementById('muni-taxno')?.value || '',
        irp5_employer_reg_number: document.getElementById('muni-regno')?.value || '',
        irp5_trading_name: document.getElementById('muni-trading')?.value || '',
        sars_contact_name: document.getElementById('muni-sars-name')?.value || '',
        sars_contact_phone: document.getElementById('muni-sars-phone')?.value || '',
        sars_contact_email: document.getElementById('muni-sars-email')?.value || '',
        industry_group: document.getElementById('muni-industry-group')?.value || '',
        activity_group: document.getElementById('muni-activity-group')?.value || '',
        payslip_template: document.getElementById('muni-payslip-template')?.value || 'PLAIN_PAPER',
        payslip_show_company_contributions: document.getElementById('muni-payslip-company-contrib')?.checked ? 'true' : 'false',
        bonus_payment_timing: document.getElementById('muni-bonus-timing')?.value || 'EMPLOYMENT_MONTH',
        bonus_payment_month: document.getElementById('muni-bonus-month')?.value || '',
      };
      try {
        const resp = await fetch(`${API_BASE}/settings/municipality`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.toast('success', 'Saved', 'Municipality details saved successfully');
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  // === EMPLOYEE SUB TYPES TAB ===
  async renderEmployeeTypesTab(el) {
    const [typesRes, subtypesRes] = await Promise.all([
      api('/settings/employee-types'),
      api('/settings/employee-subtypes')
    ]);
    const types = typesRes.data || [];
    const subtypes = subtypesRes.data || [];

    const typeMap = {};
    types.forEach(t => { typeMap[t.id] = t; });

    const groupedRows = types.map(t => {
      const subs = subtypes.filter(s => s.employee_type_id === t.id);
      const subRows = subs.map(s => `
        <tr>
          <td style="padding-left:32px">${icon('cornerDownRight',12)} <code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${s.code}</code></td>
          <td>${s.name}</td>
          <td>${s.description || '-'}</td>
          <td>${s.enabled !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Disabled</span>'}</td>
          <td><div style="display:flex;gap:4px;align-items:center">
            <button class="action-btn" data-edit-sub="${s.id}" title="Edit">${icon('edit',14)}</button>
            <button class="action-btn danger" data-del-sub="${s.id}" title="Delete">${icon('trash',14)}</button>
          </div></td>
        </tr>
      `).join('');
      return `
        <tr style="background:var(--bg-light)">
          <td><strong>${icon('folder',13)} ${t.code}</strong></td>
          <td><strong>${t.name}</strong></td>
          <td style="color:var(--text-muted);font-size:12px">${t.description || ''}</td>
          <td><span class="badge badge-info">Type</span></td>
          <td></td>
        </tr>
        ${subRows}
      `;
    }).join('');

    el.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h4 style="margin:0;font-size:14px;display:flex;align-items:center;gap:8px">${icon('users',16)} Employee Types & Sub Types</h4>
          <button class="btn btn-primary" id="btn-add-subtype">${icon('plus',13)} Add Sub Type</button>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Employee Types are system constants and cannot be modified. Sub Types can be added, edited and deleted under each Type.</p>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Description</th><th>Status</th><th style="width:90px">Actions</th></tr>
            </thead>
            <tbody>${groupedRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No data</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-add-subtype')?.addEventListener('click', () => this.showSubtypeModal(null, types));
    el.querySelectorAll('[data-edit-sub]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = subtypes.find(s => s.id == btn.dataset.editSub);
        if (sub) this.showSubtypeModal(sub, types);
      });
    });
    el.querySelectorAll('[data-del-sub]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sub = subtypes.find(s => s.id == btn.dataset.delSub);
        if (!sub) return;
        UI.modal({
          title: 'Delete Sub Type',
          content: `<p>Are you sure you want to delete <strong>${sub.name}</strong> (${sub.code})?</p><p style="color:var(--danger);font-size:12px">This cannot be undone. Deletion will fail if employees are linked to this sub type.</p>`,
          footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-confirm-del-sub" style="background:var(--danger)">Delete</button>`
        });
        document.getElementById('btn-confirm-del-sub')?.addEventListener('click', async () => {
          try {
            const resp = await fetch(`${API_BASE}/settings/employee-subtypes/${sub.id}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
            UI.closeModal();
            UI.toast('success', 'Deleted', `${sub.name} removed`);
            this.renderTab();
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    });
  },

  showSubtypeModal(existing, types) {
    const typeOpts = types.map(t => `<option value="${t.id}" ${existing && existing.employee_type_id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    UI.modal({
      title: existing ? 'Edit Sub Type' : 'Add Sub Type',
      content: `
        <div class="form-grid" style="gap:16px">
          <div class="form-group">
            <label>Employee Type</label>
            <select id="sub-type-id" class="form-control form-control-sm"><option value="">-- Select Type --</option>${typeOpts}</select>
          </div>
          <div class="form-group">
            <label>Code</label>
            <input type="text" id="sub-code" class="form-control form-control-sm" value="${existing?.code || ''}" placeholder="e.g. FULL_TIME" ${existing ? 'readonly style="background:var(--bg-light)"' : ''}>
          </div>
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="sub-name" class="form-control form-control-sm" value="${existing?.name || ''}">
          </div>
          <div class="form-group">
            <label>Description</label>
            <input type="text" id="sub-desc" class="form-control form-control-sm" value="${existing?.description || ''}">
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="sub-enabled" ${existing?.enabled !== false ? 'checked' : ''} style="width:auto"> Active
            </label>
          </div>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-sub">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-sub')?.addEventListener('click', async () => {
      const payload = {
        employee_type_id: parseInt(document.getElementById('sub-type-id')?.value),
        code: document.getElementById('sub-code')?.value?.trim(),
        name: document.getElementById('sub-name')?.value?.trim(),
        description: document.getElementById('sub-desc')?.value?.trim(),
        enabled: document.getElementById('sub-enabled')?.checked
      };
      if (!payload.employee_type_id || !payload.code || !payload.name) {
        UI.toast('error', 'Validation', 'Type, code and name are required');
        return;
      }
      try {
        const url = existing ? `${API_BASE}/settings/employee-subtypes/${existing.id}` : `${API_BASE}/settings/employee-subtypes`;
        const resp = await fetch(url, {
          method: existing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `Sub type ${payload.name} saved`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  // === TASK GRADES & NOTCHES TAB ===
  async renderTaskGradesTab(el) {
    const res = await api('/settings/task-grades');
    const grades = res.data || [];

    const gradeRows = grades.map(g => {
      const endDisplay = g.end_date === '9999-12-31' || !g.end_date ? 'Open' : fmtDateSA(g.end_date);
      return `
        <tr>
          <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${g.grade_code}</code></td>
          <td>${g.grade_name}</td>
          <td style="text-align:right">${fmtRand(g.min_salary)}</td>
          <td style="text-align:right">${fmtRand(g.max_salary)}</td>
          <td style="text-align:center"><a href="#" data-view-notches-link="${g.id}" data-grade-code-link="${g.grade_code}" style="color:var(--primary);font-weight:600;text-decoration:underline;cursor:pointer">${g.notch_count || 0}</a></td>
          <td>${fmtDateSA(g.start_date)}</td>
          <td>${endDisplay}</td>
          <td>${g.enabled !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Disabled</span>'}</td>
          <td><div style="display:flex;gap:4px;align-items:center">
            <button class="btn btn-sm" data-view-notches="${g.id}" data-grade-code="${g.grade_code}" style="font-size:11px;padding:4px 10px;border:1px solid var(--primary);color:var(--primary);background:#fff;border-radius:4px;cursor:pointer;white-space:nowrap">Notches (${g.notch_count || 0})</button>
            <button class="action-btn" data-edit-grade="${g.id}" title="Edit">${icon('edit',14)}</button>
            <button class="action-btn danger" data-del-grade="${g.id}" title="Delete">${icon('trash',14)}</button>
          </div></td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h4 style="margin:0;font-size:14px;display:flex;align-items:center;gap:8px">${icon('layers',16)} Task Grades</h4>
          <button class="btn btn-primary" id="btn-add-grade">${icon('plus',13)} Add Task Grade</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th style="text-align:right">Min Salary</th><th style="text-align:right">Max Salary</th><th style="text-align:center">Notches</th><th>Start Date</th><th>End Date</th><th>Status</th><th style="width:130px">Actions</th></tr>
            </thead>
            <tbody>${gradeRows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">No task grades found</td></tr>'}</tbody>
          </table>
        </div>
        <div id="notches-panel" style="margin-top:24px"></div>
      </div>
    `;

    document.getElementById('btn-add-grade')?.addEventListener('click', () => this.showGradeModal(null));
    el.querySelectorAll('[data-edit-grade]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grade = grades.find(g => g.id == btn.dataset.editGrade);
        if (grade) this.showGradeModal(grade);
      });
    });
    el.querySelectorAll('[data-del-grade]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const grade = grades.find(g => g.id == btn.dataset.delGrade);
        if (!grade) return;
        UI.modal({
          title: 'Delete Task Grade',
          content: `<p>Are you sure you want to delete <strong>${grade.grade_name}</strong> (${grade.grade_code})?</p><p style="color:var(--danger);font-size:12px">All associated notches will also be deleted. This will fail if employees are linked to this grade.</p>`,
          footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-confirm-del-grade" style="background:var(--danger)">Delete</button>`
        });
        document.getElementById('btn-confirm-del-grade')?.addEventListener('click', async () => {
          try {
            const resp = await fetch(`${API_BASE}/settings/task-grades/${grade.id}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
            UI.closeModal();
            UI.toast('success', 'Deleted', `${grade.grade_name} removed`);
            this.renderTab();
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    });
    el.querySelectorAll('[data-view-notches]').forEach(btn => {
      btn.addEventListener('click', () => this.loadNotchesPanel(parseInt(btn.dataset.viewNotches), btn.dataset.gradeCode));
    });
    el.querySelectorAll('[data-view-notches-link]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadNotchesPanel(parseInt(link.dataset.viewNotchesLink), link.dataset.gradeCodeLink);
      });
    });
  },

  async loadNotchesPanel(gradeId, gradeCode) {
    const panel = document.getElementById('notches-panel');
    if (!panel) return;
    panel.innerHTML = '<div class="loading"><div class="spinner"></div>Loading notches...</div>';

    try {
      const res = await api(`/settings/task-grades/${gradeId}/notches`);
      const notches = res.data || [];

      const notchRows = notches.map(n => {
        const endDisplay = n.end_date === '9999-12-31' || !n.end_date ? 'Open' : fmtDateSA(n.end_date);
        return `
          <tr>
            <td style="text-align:center;font-weight:600">${n.notch_number}</td>
            <td style="text-align:right">${fmtRand(n.min_salary)}</td>
            <td style="text-align:right">${fmtRand(n.max_salary)}</td>
            <td style="text-align:right">${fmtRand((parseFloat(n.min_salary) || 0) / 12)}</td>
            <td style="text-align:right">${fmtRand((parseFloat(n.max_salary) || 0) / 12)}</td>
            <td>${fmtDateSA(n.start_date)}</td>
            <td>${endDisplay}</td>
            <td><div style="display:flex;gap:4px;align-items:center">
              <button class="action-btn" data-edit-notch="${n.id}" title="Edit">${icon('edit',14)}</button>
              <button class="action-btn danger" data-del-notch="${n.id}" title="Delete">${icon('trash',14)}</button>
            </div></td>
          </tr>
        `;
      }).join('');

      panel.innerHTML = `
        <div style="border:1px solid var(--border);border-radius:var(--radius);padding:16px;background:var(--bg-light)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h5 style="margin:0;font-size:13px;display:flex;align-items:center;gap:8px">${icon('layers',14)} Notches for ${gradeCode}</h5>
            <button class="btn btn-primary" id="btn-add-notch" style="font-size:12px;padding:6px 12px">${icon('plus',12)} Add Notch</button>
          </div>
          <div class="data-grid">
            <table>
              <thead>
                <tr><th style="text-align:center">Notch</th><th style="text-align:right">Min Salary (Annual)</th><th style="text-align:right">Max Salary (Annual)</th><th style="text-align:right">Min Monthly</th><th style="text-align:right">Max Monthly</th><th>Start Date</th><th>End Date</th><th style="width:80px">Actions</th></tr>
              </thead>
              <tbody>${notchRows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No notches defined. Click "Add Notch" to create notch salary ranges.</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('btn-add-notch')?.addEventListener('click', () => this.showNotchModal(null, gradeId, gradeCode));
      panel.querySelectorAll('[data-edit-notch]').forEach(btn => {
        btn.addEventListener('click', () => {
          const notch = notches.find(n => n.id == btn.dataset.editNotch);
          if (notch) this.showNotchModal(notch, gradeId, gradeCode);
        });
      });
      panel.querySelectorAll('[data-del-notch]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const resp = await fetch(`${API_BASE}/settings/task-grade-notches/${btn.dataset.delNotch}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
            UI.toast('success', 'Deleted', 'Notch removed');
            this.loadNotchesPanel(gradeId, gradeCode);
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    } catch (err) {
      panel.innerHTML = `<div style="color:var(--danger);padding:16px">Error loading notches: ${err.message}</div>`;
    }
  },

  showGradeModal(existing) {
    UI.modal({
      title: existing ? 'Edit Task Grade' : 'Add Task Grade',
      content: `
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label>Grade Code</label>
            <input type="text" id="grade-code" class="form-control form-control-sm" value="${existing?.grade_code || ''}" placeholder="e.g. T01">
          </div>
          <div class="form-group">
            <label>Grade Name</label>
            <input type="text" id="grade-name" class="form-control form-control-sm" value="${existing?.grade_name || ''}">
          </div>
          <div class="form-group">
            <label>Minimum Salary (Annual)</label>
            <input type="number" id="grade-min" class="form-control form-control-sm" value="${parseFloat(existing?.min_salary) || ''}" step="0.01">
          </div>
          <div class="form-group">
            <label>Maximum Salary (Annual)</label>
            <input type="number" id="grade-max" class="form-control form-control-sm" value="${parseFloat(existing?.max_salary) || ''}" step="0.01">
          </div>
          <div class="form-group">
            <label>Number of Notches</label>
            <input type="number" id="grade-notches" class="form-control form-control-sm" value="${existing?.notch_count || 0}" min="0">
          </div>
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" id="grade-start" class="form-control form-control-sm" value="${existing?.start_date || ''}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" id="grade-end" class="form-control form-control-sm" value="${existing?.end_date === '9999-12-31' ? '' : (existing?.end_date || '')}">
            <small style="color:var(--text-muted);font-size:11px">Leave blank for open-ended</small>
          </div>
          ${existing ? `<div class="form-group">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="grade-enabled" ${existing.enabled !== false ? 'checked' : ''} style="width:auto"> Active
            </label>
          </div>` : ''}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-grade">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-grade')?.addEventListener('click', async () => {
      const payload = {
        grade_code: document.getElementById('grade-code')?.value?.trim(),
        grade_name: document.getElementById('grade-name')?.value?.trim(),
        min_salary: parseFloat(document.getElementById('grade-min')?.value) || 0,
        max_salary: parseFloat(document.getElementById('grade-max')?.value) || 0,
        notch_count: parseInt(document.getElementById('grade-notches')?.value) || 0,
        start_date: document.getElementById('grade-start')?.value,
        end_date: document.getElementById('grade-end')?.value || '9999-12-31',
        enabled: existing ? document.getElementById('grade-enabled')?.checked : true
      };
      if (!payload.grade_code || !payload.grade_name || !payload.start_date) {
        UI.toast('error', 'Validation', 'Code, name and start date are required');
        return;
      }
      try {
        const url = existing ? `${API_BASE}/settings/task-grades/${existing.id}` : `${API_BASE}/settings/task-grades`;
        const resp = await fetch(url, {
          method: existing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `Grade ${payload.grade_code} saved`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  showNotchModal(existing, gradeId, gradeCode) {
    const startVal = existing?.start_date ? existing.start_date.split('T')[0] : '';
    const endRaw = existing?.end_date ? existing.end_date.split('T')[0] : '';
    const endVal = endRaw === '9999-12-31' ? '' : endRaw;

    UI.modal({
      title: existing ? `Edit Notch ${existing.notch_number} - ${gradeCode}` : `Add Notch - ${gradeCode}`,
      content: `
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label>Start Date *</label>
            <input type="date" id="notch-start" class="form-control form-control-sm" value="${startVal || '2024-07-01'}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" id="notch-end" class="form-control form-control-sm" value="${endVal}">
            <small style="color:var(--text-muted);font-size:11px">Leave blank for open-ended</small>
          </div>
          <div class="form-group">
            <label>Notch Number *</label>
            <input type="number" id="notch-number" class="form-control form-control-sm" value="${existing?.notch_number || ''}" min="1">
          </div>
          <div style="display:none"></div>
          <div class="form-group">
            <label>Minimum Salary (Annual) *</label>
            <input type="number" id="notch-min-salary" class="form-control form-control-sm" value="${parseFloat(existing?.min_salary) || ''}" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>Maximum Salary (Annual) *</label>
            <input type="number" id="notch-max-salary" class="form-control form-control-sm" value="${parseFloat(existing?.max_salary) || ''}" step="0.01" min="0">
          </div>
        </div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px">Employee salary defaults to minimum notch value but can be any value within the min–max range.</p>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-notch">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-notch')?.addEventListener('click', async () => {
      const payload = {
        notch_number: parseInt(document.getElementById('notch-number')?.value),
        min_salary: parseFloat(document.getElementById('notch-min-salary')?.value),
        max_salary: parseFloat(document.getElementById('notch-max-salary')?.value),
        start_date: document.getElementById('notch-start')?.value,
        end_date: document.getElementById('notch-end')?.value || '9999-12-31'
      };
      if (!payload.notch_number || isNaN(payload.min_salary) || isNaN(payload.max_salary) || !payload.start_date) {
        UI.toast('error', 'Validation', 'Notch number, min salary, max salary and start date are required');
        return;
      }
      if (payload.max_salary < payload.min_salary) {
        UI.toast('error', 'Validation', 'Max salary must be greater than or equal to min salary');
        return;
      }
      try {
        const url = existing
          ? `${API_BASE}/settings/task-grade-notches/${existing.id}`
          : `${API_BASE}/settings/task-grades/${gradeId}/notches`;
        const resp = await fetch(url, {
          method: existing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `Notch ${payload.notch_number} saved`);
        this.loadNotchesPanel(gradeId, gradeCode);
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  // === CONDITIONS OF SERVICE TAB ===
  async renderConditionsTab(el) {
    const res = await api('/settings/conditions-of-service');
    const conditions = res.data || [];

    const rows = conditions.map(c => {
      return `
        <tr>
          <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${c.code}</code></td>
          <td>${c.name}</td>
          <td>${c.description || '-'}</td>
          <td>${c.enabled !== false ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Disabled</span>'}</td>
          <td><div style="display:flex;gap:4px;align-items:center">
            <button class="action-btn" data-edit-cos="${c.id}" title="Edit">${icon('edit',14)}</button>
            <button class="action-btn danger" data-del-cos="${c.id}" title="Delete">${icon('trash',14)}</button>
          </div></td>
        </tr>
      `;
    }).join('');

    el.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h4 style="margin:0;font-size:14px;display:flex;align-items:center;gap:8px">${icon('fileText',16)} Conditions of Service</h4>
          <button class="btn btn-primary" id="btn-add-cos">${icon('plus',13)} Add Condition</button>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Define working conditions (SALGBC, TASK, Councillor, Shift Worker agreements).</p>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>Description</th><th>Status</th><th style="width:80px">Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No conditions of service found</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-add-cos')?.addEventListener('click', () => this.showConditionModal(null));
    el.querySelectorAll('[data-edit-cos]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cos = conditions.find(c => c.id == btn.dataset.editCos);
        if (cos) this.showConditionModal(cos);
      });
    });
    el.querySelectorAll('[data-del-cos]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cos = conditions.find(c => c.id == btn.dataset.delCos);
        if (!cos) return;
        UI.modal({
          title: 'Delete Condition of Service',
          content: `<p>Are you sure you want to delete <strong>${cos.name}</strong>?</p><p style="color:var(--danger);font-size:12px">This will fail if employees are linked to this condition.</p>`,
          footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-confirm-del-cos" style="background:var(--danger)">Delete</button>`
        });
        document.getElementById('btn-confirm-del-cos')?.addEventListener('click', async () => {
          try {
            const resp = await fetch(`${API_BASE}/settings/conditions-of-service/${cos.id}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
            UI.closeModal();
            UI.toast('success', 'Deleted', `${cos.name} removed`);
            this.renderTab();
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    });
  },

  showConditionModal(existing) {
    UI.modal({
      title: existing ? 'Edit Condition of Service' : 'Add Condition of Service',
      content: `
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:16px">
          <div class="form-group">
            <label>Code</label>
            <input type="text" id="cos-code" class="form-control form-control-sm" value="${existing?.code || ''}" placeholder="e.g. SALGBC_MAIN" ${existing ? 'readonly style="background:var(--bg-light)"' : ''}>
          </div>
          <div class="form-group">
            <label>Name</label>
            <input type="text" id="cos-name" class="form-control form-control-sm" value="${existing?.name || ''}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Description</label>
            <input type="text" id="cos-desc" class="form-control form-control-sm" value="${existing?.description || ''}">
          </div>
          ${existing ? `<div class="form-group">
            <label style="display:flex;align-items:center;gap:8px">
              <input type="checkbox" id="cos-enabled" ${existing.enabled !== false ? 'checked' : ''} style="width:auto"> Active
            </label>
          </div>` : ''}
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-cos">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-cos')?.addEventListener('click', async () => {
      const payload = {
        code: document.getElementById('cos-code')?.value?.trim(),
        name: document.getElementById('cos-name')?.value?.trim(),
        description: document.getElementById('cos-desc')?.value?.trim(),
        working_hours_per_day: existing?.working_hours_per_day || 8,
        working_days_per_week: existing?.working_days_per_week || 5,
        start_date: existing?.start_date || new Date().toISOString().split('T')[0],
        end_date: '9999-12-31',
        enabled: existing ? document.getElementById('cos-enabled')?.checked : true
      };
      if (!payload.code || !payload.name) {
        UI.toast('error', 'Validation', 'Code and name are required');
        return;
      }
      try {
        const url = existing ? `${API_BASE}/settings/conditions-of-service/${existing.id}` : `${API_BASE}/settings/conditions-of-service`;
        const resp = await fetch(url, {
          method: existing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `${payload.name} saved`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  showEditWorkflowModal(wf) {
    let stepsJson = '';
    try {
      const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
      stepsJson = JSON.stringify(steps, null, 2);
    } catch (e) {
      stepsJson = typeof wf.steps === 'string' ? wf.steps : JSON.stringify(wf.steps || []);
    }

    UI.modal({
      title: `Edit Workflow: ${wf.name || 'Workflow'}`,
      content: `
        <div class="form-grid" id="edit-wf-form">
          ${UI.buildForm([
            { type: 'section', label: 'Workflow Details', icon: icon('activity',16) },
            { id: 'wf_name', label: 'Name', type: 'readonly', value: wf.name || '' },
            { id: 'wf_module', label: 'Module', type: 'readonly', value: wf.module || '' },
          ])}
          <div class="form-group" style="margin-top:12px">
            <label style="font-size:12px;font-weight:600;color:var(--text-primary);margin-bottom:6px;display:block">${icon('fileText',14)} Approval Steps (JSON)</label>
            <textarea id="wf_steps_json" class="form-control" style="font-family:monospace;font-size:12px;min-height:200px;resize:vertical">${stepsJson}</textarea>
            <p style="font-size:11px;color:var(--text-muted);margin-top:4px">Each step should include: role/approver, name, and optional conditions</p>
          </div>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-wf">Update Workflow</button>`
    });

    document.getElementById('btn-save-wf')?.addEventListener('click', async () => {
      const stepsInput = document.getElementById('wf_steps_json')?.value || '[]';
      let parsedSteps;
      try {
        parsedSteps = JSON.parse(stepsInput);
      } catch (e) {
        UI.toast('error', 'Invalid JSON', 'Steps must be valid JSON');
        return;
      }
      try {
        const res = await fetch(API_BASE + `/workflows/definitions/${wf.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ steps: parsedSteps })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        UI.closeModal();
        UI.toast('success', 'Updated', 'Workflow updated successfully');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderSalaryTransGroupsTab(el) {
    const [groupsRes, headsRes] = await Promise.all([
      api('/settings/salary-transaction-groups'),
      api('/settings/salary-heads')
    ]);
    const groups = groupsRes.data || [];
    const allHeads = headsRes.data || [];
    this._stgAllHeads = allHeads;

    const rows = groups.map(g => {
      const cnt = parseInt(g.item_count) || 0;
      const cntBadge = cnt > 0
        ? `<span style="background:var(--primary);color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:6px">${cnt}</span>`
        : `<span style="background:var(--bg-light);color:var(--text-muted);font-size:10px;padding:1px 6px;border-radius:10px;margin-left:6px">0</span>`;
      return `<tr>
        <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${this._esc(g.code)}</code></td>
        <td><strong>${this._esc(g.name)}</strong>${cntBadge}</td>
        <td>${this._esc(g.description) || '<span style="color:var(--text-muted)">-</span>'}</td>
        <td><div style="display:flex;gap:4px;align-items:center">
          <button class="action-btn" data-manage-stg="${g.id}" title="Manage Salary Heads">${icon('list',14)}</button>
          <button class="action-btn" data-edit-stg="${g.id}" title="Edit">${icon('edit',14)}</button>
          <button class="action-btn danger" data-del-stg="${g.id}" title="Delete">${icon('trash',14)}</button>
        </div></td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div>
          <h4 style="margin:0;font-size:14px;font-weight:600;color:var(--text-primary)">Salary Transaction Groups</h4>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">Create groups and link Salary Heads (transactions) to each group. Groups are then assigned to Job Profiles so employees inherit the correct salary structure.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-stg">${icon('plus',13)} Add Group</button>
      </div>
      <div class="data-grid">
        <table>
          <thead><tr>
            <th style="width:100px">Code</th>
            <th>Name</th>
            <th>Description</th>
            <th style="width:120px">Actions</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px">No salary transaction groups configured</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-stg')?.addEventListener('click', () => this.showSTGModal(null));
    el.querySelectorAll('[data-edit-stg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = groups.find(x => x.id == btn.dataset.editStg);
        if (g) this.showSTGModal(g);
      });
    });
    el.querySelectorAll('[data-manage-stg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = groups.find(x => x.id == btn.dataset.manageStg);
        if (g) this.showSTGItemsModal(g);
      });
    });
    el.querySelectorAll('[data-del-stg]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const g = groups.find(x => x.id == btn.dataset.delStg);
        if (!g) return;
        UI.modal({
          title: 'Delete Salary Transaction Group',
          content: `<p>Are you sure you want to delete <strong>${this._esc(g.name)}</strong> (${this._esc(g.code)})?</p>`,
          footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-confirm-del-stg" style="background:var(--danger)">Delete</button>`
        });
        document.getElementById('btn-confirm-del-stg')?.addEventListener('click', async () => {
          try {
            const resp = await fetch(`${API_BASE}/settings/salary-transaction-groups/${g.id}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
            UI.closeModal();
            UI.toast('success', 'Deleted', `"${g.name}" removed`);
            this.renderTab();
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    });
  },

  showSTGModal(existing) {
    const formHtml = UI.buildForm([
      { id: 'stg_code', label: 'Code', type: 'text', value: existing?.code || '', required: true, placeholder: 'e.g. PERM_EMP' },
      { id: 'stg_name', label: 'Name', type: 'text', value: existing?.name || '', required: true, placeholder: 'e.g. Permanent Employees' },
      { id: 'stg_desc', label: 'Description', type: 'textarea', value: existing?.description || '', fullWidth: true },
    ]);

    UI.modal({
      title: existing ? `Edit: ${existing.name}` : 'Add Salary Transaction Group',
      content: `<div class="form-grid">${formHtml}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-stg">${existing ? 'Update' : 'Create'}</button>`
    });

    document.getElementById('btn-save-stg')?.addEventListener('click', async () => {
      const code = document.getElementById('stg_code')?.value?.trim();
      const name = document.getElementById('stg_name')?.value?.trim();
      const description = document.getElementById('stg_desc')?.value?.trim();
      if (!code || !name) { UI.toast('error', 'Validation', 'Code and name are required'); return; }
      try {
        const url = existing ? `${API_BASE}/settings/salary-transaction-groups/${existing.id}` : `${API_BASE}/settings/salary-transaction-groups`;
        const method = existing ? 'PUT' : 'POST';
        const resp = await fetch(url, {
          method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name, description })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `"${name}" saved successfully`);
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async showSTGItemsModal(group) {
    const allHeads = this._stgAllHeads || [];

    const loadItems = async () => {
      const res = await api(`/settings/salary-transaction-groups/${group.id}/items`);
      return res.data || [];
    };

    const renderModal = async () => {
      const items = await loadItems();
      const linkedIds = new Set(items.map(i => i.salary_head_id));
      const typeLabel = (c) => ({ EARNING: 'Earning', DEDUCTION: 'Deduction', COMPANY_CONTRIBUTION: 'Company Contribution' }[c] || c);
      const typeColor = (c) => ({ EARNING: '#22c55e', DEDUCTION: '#ef4444', COMPANY_CONTRIBUTION: '#3b82f6' }[c] || '#6b7280');

      const itemRows = items.length > 0 ? items.map(i => `
        <tr>
          <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${this._esc(i.salary_head_code)}</code></td>
          <td>${this._esc(i.salary_head_name)}</td>
          <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:${typeColor(i.transaction_type)}15;color:${typeColor(i.transaction_type)}">${typeLabel(i.transaction_type)}</span></td>
          <td style="text-align:center">
            <button class="action-btn danger" data-remove-item="${i.id}" title="Remove">${icon('x',14)}</button>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px">No salary heads linked yet. Click "Add Salary Heads" to link transactions to this group.</td></tr>';

      const availableHeads = allHeads.filter(h => !linkedIds.has(h.id));
      const txTypes = [...new Set(availableHeads.map(h => h.transaction_type))].sort();
      const txTypeOpts = txTypes.map(t => `<option value="${t}">${typeLabel(t)}</option>`).join('');

      UI.modal({
        title: `Manage: ${group.name}`,
        size: 'lg',
        content: `
          <div style="margin-bottom:16px">
            <p style="font-size:12px;color:var(--text-muted);margin:0 0 12px">Salary Heads linked to this group will be auto-assigned to employees when linked to a Job Profile using this group.</p>
            <div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:16px">
              <div style="width:200px">
                <label style="font-size:12px;font-weight:500;margin-bottom:4px;display:block">Transaction Type</label>
                <select id="stg-type-filter" class="form-control">
                  <option value="">-- Select Type --</option>
                  ${txTypeOpts}
                </select>
              </div>
              <div style="flex:1">
                <label style="font-size:12px;font-weight:500;margin-bottom:4px;display:block">Salary Head</label>
                <select id="stg-add-heads" class="form-control" multiple style="height:80px">
                  <option disabled>Select a Transaction Type first</option>
                </select>
              </div>
              <button class="btn btn-primary btn-sm" id="btn-stg-add-heads" disabled>
                ${icon('plus',13)} Add Selected
              </button>
            </div>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr>
                <th style="width:100px">Code</th>
                <th>Salary Head</th>
                <th style="width:140px">Category</th>
                <th style="width:60px;text-align:center">Remove</th>
              </tr></thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">${items.length} salary head(s) linked</div>
        `,
        footer: `<button class="btn" data-close-modal>Close</button>`
      });

      document.getElementById('stg-type-filter')?.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        const headsSel = document.getElementById('stg-add-heads');
        const addBtn = document.getElementById('btn-stg-add-heads');
        headsSel.innerHTML = '';
        if (!selectedType) {
          headsSel.innerHTML = '<option disabled>Select a Transaction Type first</option>';
          addBtn.disabled = true;
          return;
        }
        const filtered = availableHeads.filter(h => h.transaction_type === selectedType);
        if (filtered.length === 0) {
          headsSel.innerHTML = '<option disabled>No available salary heads for this type</option>';
          addBtn.disabled = true;
        } else {
          headsSel.innerHTML = filtered.map(h => `<option value="${h.id}">${h.name} (${h.code})</option>`).join('');
          addBtn.disabled = false;
        }
      });

      document.getElementById('btn-stg-add-heads')?.addEventListener('click', async () => {
        const sel = document.getElementById('stg-add-heads');
        const ids = Array.from(sel.selectedOptions).map(o => parseInt(o.value));
        if (ids.length === 0) { UI.toast('error', 'Validation', 'Select at least one salary head'); return; }
        try {
          const resp = await fetch(`${API_BASE}/settings/salary-transaction-groups/${group.id}/items`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salary_head_ids: ids })
          });
          const json = await resp.json();
          if (!resp.ok) throw new Error(json.error?.message || 'Add failed');
          UI.toast('success', 'Added', json.message);
          await renderModal();
        } catch (err) { UI.toast('error', 'Error', err.message); }
      });

      document.querySelectorAll('[data-remove-item]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const itemId = btn.dataset.removeItem;
          try {
            const resp = await fetch(`${API_BASE}/settings/salary-transaction-groups/${group.id}/items/${itemId}`, { method: 'DELETE' });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error?.message || 'Remove failed');
            await renderModal();
          } catch (err) { UI.toast('error', 'Error', err.message); }
        });
      });
    };

    await renderModal();
  },

  async renderUpperLimitsTab(el) {
    try {
      const [limitsRes, typesRes, subtypesRes, profilesRes] = await Promise.all([
        api('/settings/upper-limits'),
        api('/settings/employee-types'),
        api('/settings/employee-subtypes'),
        api('/positions/job-profiles')
      ]);
      const limits = limitsRes?.data || [];
      const types = typesRes?.data || [];
      const subtypes = subtypesRes?.data || [];
      const profiles = profilesRes?.data || [];

      this._ulTypes = types;
      this._ulSubtypes = subtypes;
      this._ulProfiles = profiles;

      const rows = limits.map(l => `<tr>
        <td><code style="background:#f1f5f9;padding:2px 6px;border-radius:3px;font-size:12px">${this._esc(l.code) || '-'}</code></td>
        <td>${this._esc(l.employee_type_name) || '-'}</td>
        <td>${this._esc(l.employee_subtype_name) || '-'}</td>
        <td>${this._esc(l.job_profile_name) || '-'}</td>
        <td><strong>${this._esc(l.municipal_grading)}</strong></td>
        <td>${fmtDateSA(l.start_date)}</td>
        <td>${fmtDateSA(l.end_date)}</td>
        <td style="text-align:right">${fmtRand(l.minimum_value)}</td>
        <td style="text-align:right">${fmtRand(l.midpoint_value)}</td>
        <td style="text-align:right">${fmtRand(l.maximum_value)}</td>
        <td><div style="display:flex;gap:4px;align-items:center">
          <button class="btn btn-sm" onclick="SettingsModule.showUpperLimitModal(${l.id})" title="Edit">${icon('edit',14)}</button>
          <button class="btn btn-sm" onclick="SettingsModule.showUpperLimitHistory(${l.id})" title="History">${icon('clock',14)}</button>
          <button class="btn btn-sm btn-danger" onclick="SettingsModule.deleteUpperLimit(${l.id})" title="Delete">${icon('trash',14)}</button>
        </div></td>
      </tr>`).join('');

      el.innerHTML = `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <h3 style="font-size:16px;color:#0f2b46;margin:0;display:flex;align-items:center;gap:8px">${icon('trendingUp',18)} Salary Upper Limits</h3>
            <button class="btn btn-primary" id="btn-add-upper-limit" style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;padding:8px 16px;min-width:140px">${icon('plus',14)} Add Upper Limit</button>
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin:0">Upper limits define salary caps for non-TASK graded employees (senior management, councillors). Each record has a date range, municipal grading, and min/mid/max salary values.</p>
        </div>
        <div class="data-grid" style="overflow-x:auto">
          <table>
            <thead><tr>
              <th>Code</th><th>Employee Type</th><th>Sub Type</th><th>Job Profile</th>
              <th>Grading</th><th>Start</th><th>End</th>
              <th style="text-align:right">Min</th><th style="text-align:right">Mid</th><th style="text-align:right">Max</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${limits.length === 0 ? '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:32px">No upper limits configured. Click "Add Upper Limit" above to create one.</td></tr>' : rows}
            </tbody>
          </table>
        </div>`;
      document.getElementById('btn-add-upper-limit')?.addEventListener('click', () => this.showUpperLimitModal());
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${icon('alertTriangle',32)}<p>Failed to load upper limits: ${err.message}</p></div>`;
    }
  },

  async showUpperLimitModal(id) {
    let existing = null;
    if (id) {
      const res = await api(`/settings/upper-limits/${id}`);
      existing = res?.data;
    }

    const types = this._ulTypes || [];
    const subtypes = this._ulSubtypes || [];
    const profiles = this._ulProfiles || [];

    const typeOpts = types.map(t => ({ value: t.id, label: t.name }));
    const selectedTypeId = existing?.employee_type_id || '';
    const filteredSubtypeOpts = selectedTypeId
      ? subtypes.filter(s => s.employee_type_id == selectedTypeId).map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
      : [];
    const profileOpts = profiles.map(p => ({ value: p.id, label: p.job_title }));
    const gradingOpts = ['1','2','3','4','5','6','7','8','9','10'].map(g => ({ value: g, label: g }));

    const formHtml = UI.buildForm([
      { type: 'section', label: 'Upper Limit Details', icon: icon('trendingUp',16) },
      { id: 'ul_code', label: 'Code', type: 'text', value: existing?.code || '', placeholder: 'e.g. UL001' },
      { id: 'ul_emp_type', label: 'Employee Type', type: 'select', value: existing?.employee_type_id || '', options: typeOpts, required: true },
      { id: 'ul_emp_subtype', label: 'Employee Subtype', type: 'select', value: existing?.employee_subtype_id || '', options: filteredSubtypeOpts, required: true },
      { id: 'ul_job_profile', label: 'Job Profile', type: 'select', value: existing?.job_profile_id || '', options: profileOpts },
      { id: 'ul_grading', label: 'Municipal Grading', type: 'select', value: existing?.municipal_grading || '', options: gradingOpts, required: true },
      { type: 'section', label: 'Date Range', icon: icon('calendar',16) },
      { id: 'ul_start', label: 'Start Date', type: 'date', value: existing?.start_date ? existing.start_date.substring(0,10) : '', required: true },
      { id: 'ul_end', label: 'End Date', type: 'date', value: existing?.end_date ? existing.end_date.substring(0,10) : '9999-12-31', required: true },
      { type: 'section', label: 'Salary Values', icon: icon('dollarSign',16) },
      { id: 'ul_min', label: 'Minimum Value', type: 'number', value: existing?.minimum_value || '', placeholder: '0.00', required: true },
      { id: 'ul_mid', label: 'Midpoint Value', type: 'number', value: existing?.midpoint_value || '', placeholder: '0.00', required: true },
      { id: 'ul_max', label: 'Maximum Value', type: 'number', value: existing?.maximum_value || '', placeholder: '0.00', required: true },
    ]);

    UI.modal({
      title: `${existing ? 'Edit' : 'Add'} Upper Limit`,
      size: 'lg',
      content: `<div class="form-grid">${formHtml}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-ul">${existing ? 'Update' : 'Create'}</button>`
    });

    const empTypeEl = document.getElementById('ul_emp_type');
    const empSubtypeEl = document.getElementById('ul_emp_subtype');
    if (empTypeEl && empSubtypeEl) {
      empTypeEl.addEventListener('change', () => {
        const typeId = empTypeEl.value;
        const filtered = typeId
          ? subtypes.filter(s => s.employee_type_id == typeId)
          : [];
        empSubtypeEl.innerHTML = '<option value="">-- Select --</option>' +
          filtered.map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
      });
    }

    document.getElementById('btn-save-ul')?.addEventListener('click', async () => {
      const gv = (id) => document.getElementById(id)?.value || '';
      const payload = {
        code: gv('ul_code') || null,
        employee_type_id: gv('ul_emp_type') ? parseInt(gv('ul_emp_type')) : null,
        employee_subtype_id: gv('ul_emp_subtype') ? parseInt(gv('ul_emp_subtype')) : null,
        job_profile_id: gv('ul_job_profile') ? parseInt(gv('ul_job_profile')) : null,
        municipal_grading: gv('ul_grading'),
        start_date: gv('ul_start'),
        end_date: gv('ul_end') || '9999-12-31',
        minimum_value: parseFloat(gv('ul_min')) || 0,
        midpoint_value: parseFloat(gv('ul_mid')) || 0,
        maximum_value: parseFloat(gv('ul_max')) || 0,
      };
      if (!payload.municipal_grading || !payload.start_date) {
        UI.toast('error', 'Validation', 'Municipal grading and start date are required');
        return;
      }
      try {
        const url = existing ? `${API_BASE}/settings/upper-limits/${existing.id}` : `${API_BASE}/settings/upper-limits`;
        const method = existing ? 'PUT' : 'POST';
        const resp = await fetch(url, {
          method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const text = await resp.text();
        let json;
        try { json = JSON.parse(text); } catch (e) { throw new Error('Server returned an invalid response. Please try again.'); }
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', 'Upper limit saved successfully');
        this.renderTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async showUpperLimitHistory(id) {
    try {
      const res = await api(`/settings/upper-limits/${id}/history`);
      const history = res?.data || [];
      const rows = history.map(h => `<tr>
        <td>${fmtDateSA(h.start_date)}</td>
        <td>${fmtDateSA(h.end_date)}</td>
        <td>${this._esc(h.employee_type_name) || '-'}</td>
        <td>${this._esc(h.employee_subtype_name) || '-'}</td>
        <td>${this._esc(h.job_profile_name) || '-'}</td>
        <td style="text-align:right">${fmtRand(h.minimum_value)}</td>
        <td style="text-align:right">${fmtRand(h.midpoint_value)}</td>
        <td style="text-align:right">${fmtRand(h.maximum_value)}</td>
      </tr>`).join('');
      UI.modal({
        title: 'Upper Limit History',
        size: 'xl',
        content: `<div class="data-grid"><table>
          <thead><tr><th>Start Date</th><th>End Date</th><th>Employee Type</th><th>Employee Subtype</th><th>Job Profile</th><th style="text-align:right">Minimum</th><th style="text-align:right">Midpoint</th><th style="text-align:right">Maximum</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No history records</td></tr>'}</tbody>
        </table></div>`,
        footer: '<button class="btn" data-close-modal>Close</button>'
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async deleteUpperLimit(id) {
    if (!confirm('Are you sure you want to delete this upper limit?')) return;
    try {
      const resp = await fetch(`${API_BASE}/settings/upper-limits/${id}`, { method: 'DELETE' });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
      UI.toast('success', 'Deleted', 'Upper limit removed');
      this.renderTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },
};
