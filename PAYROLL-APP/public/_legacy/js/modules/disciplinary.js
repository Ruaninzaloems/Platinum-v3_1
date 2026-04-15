const DisciplinaryModule = {
  state: { activeTab: 'cases' },

  async render(el) {
    el.innerHTML = `
      <div class="module-tabs">
        <div class="detail-tab active" data-dtab="cases">${icon('shield',14)} Disciplinary Cases</div>
        <div class="detail-tab" data-dtab="progression">${icon('trendingUp',14)} Progressive Discipline</div>
        <div class="detail-tab" data-dtab="grievances">${icon('alertTriangle',14)} Grievances</div>
      </div>
      <div id="disc-content"></div>
    `;
    el.querySelectorAll('[data-dtab]').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.state.activeTab = tab.dataset.dtab;
        this.loadTab();
      });
    });
    this.loadTab();
  },

  async loadTab() {
    const el = document.getElementById('disc-content');
    if (!el) return;
    if (this.state.activeTab === 'cases') await this.renderCases(el);
    else if (this.state.activeTab === 'progression') await this.renderProgression(el);
    else await this.renderGrievances(el);
  },

  async renderCases(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/disciplinary/cases');
      const statusColors = { INITIATED:'status-pending', HEARING_SCHEDULED:'status-processing', HEARING_COMPLETED:'status-completed', APPEAL:'status-locked', CLOSED:'status-approved', CCMA:'status-failed' };
      const rows = data.data.map(c => `
        <tr>
          <td><strong>${c.case_number}</strong></td>
          <td>${c.first_name} ${c.surname}</td>
          <td>${c.department_name || '-'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.charge_description}</td>
          <td>${c.offence_date ? new Date(c.offence_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td>${c.hearing_date ? new Date(c.hearing_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td><span class="status-badge ${statusColors[c.status] || ''}">${c.status}</span></td>
          <td>${c.outcome || '-'}</td>
          <td>
            <button class="btn btn-sm" onclick="DisciplinaryModule.editCase(${c.id})">${icon('edit',12)}</button>
            <button class="btn btn-sm" onclick="DisciplinaryModule.viewProgression(${c.employee_id})" title="View Progression">${icon('trendingUp',12)}</button>
            <button class="btn btn-sm" onclick="DisciplinaryModule.checkCompliance(${c.employee_id})" title="Check Compliance">${icon('checkCircle',12)}</button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('shield',16)} Disciplinary Cases (${data.data.length})</div>
          <button class="btn btn-primary" onclick="DisciplinaryModule.addCase()">${icon('plus',14)} New Case</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Case No.</th><th>Employee</th><th>Department</th><th>Charge</th><th>Offence Date</th><th>Hearing Date</th><th>Status</th><th>Outcome</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No disciplinary cases</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async addCase() {
    const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const content = UI.buildForm([
      { type: 'section', label: `${icon('shield',14)} Case Details`, icon: '' },
      { id: 'dc_employee_id', label: 'Employee', type: 'select', required: true, options: emps.data.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` })) },
      { id: 'dc_charge', label: 'Charge Description', type: 'textarea', required: true, fullWidth: true },
      { id: 'dc_offence_date', label: 'Date of Offence', type: 'date', required: true },
      { id: 'dc_hearing_date', label: 'Hearing Date', type: 'date' },
      { id: 'dc_chairperson', label: 'Hearing Chairperson', type: 'text' },
    ]);
    UI.modal({
      title: 'Initiate Disciplinary Case',
      content: `<div class="form-grid" id="dc-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-danger" onclick="DisciplinaryModule.saveCase()">Initiate Case</button>`
    });
  },

  async saveCase() {
    const d = UI.getFormData('dc-form');
    try {
      await apiPost('/disciplinary/cases', {
        employee_id: parseInt(d.dc_employee_id), charge_description: d.dc_charge,
        offence_date: d.dc_offence_date, hearing_date: d.dc_hearing_date, hearing_chairperson: d.dc_chairperson
      });
      UI.closeModal(); UI.toast('success', 'Case Initiated', 'Disciplinary case created successfully');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editCase(id) {
    const { data: c } = await api(`/disciplinary/cases/${id}`);
    const content = UI.buildForm([
      { type: 'section', label: `${icon('shield',14)} Case ${c.case_number}`, icon: '' },
      { id: 'ec_status', label: 'Status', type: 'select', value: c.status, options: ['INITIATED','HEARING_SCHEDULED','HEARING_COMPLETED','APPEAL','CCMA','CLOSED'] },
      { id: 'ec_outcome', label: 'Outcome', type: 'select', value: c.outcome, options: ['','VERBAL_WARNING','WRITTEN_WARNING','FINAL_WARNING','DISMISSAL','NOT_GUILTY','COUNSELLING'] },
      { id: 'ec_sanction', label: 'Sanction Details', type: 'textarea', value: c.sanction || '', fullWidth: true },
      { id: 'ec_hearing_date', label: 'Hearing Date', type: 'date', value: c.hearing_date ? c.hearing_date.split('T')[0] : '' },
      { id: 'ec_chairperson', label: 'Chairperson', type: 'text', value: c.hearing_chairperson || '' },
      { type: 'section', label: `${icon('alertTriangle',14)} CCMA`, icon: '' },
      { id: 'ec_ccma', label: 'CCMA Referral', type: 'checkbox', value: c.ccma_referral },
      { id: 'ec_ccma_case', label: 'CCMA Case Number', type: 'text', value: c.ccma_case_number || '' },
      { id: 'ec_ccma_outcome', label: 'CCMA Outcome', type: 'select', value: c.ccma_outcome, options: ['','SETTLED','ARBITRATION_WON','ARBITRATION_LOST','WITHDRAWN','CONDONATION_REFUSED'] },
    ]);
    UI.modal({
      title: `Update Case ${c.case_number}`,
      content: `
        <div class="form-grid" id="ec-form">${content}</div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)">
          <div class="section-header" style="margin-bottom:8px">${icon('fileText',14)} Document Generation</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="window.open(API_BASE + '/disciplinary/${id}/notice-to-attend','_blank')">${icon('file',12)} Notice to Attend</button>
            <button class="btn btn-primary" onclick="window.open(API_BASE + '/disciplinary/${id}/outcome-letter','_blank')">${icon('file',12)} Outcome Letter</button>
          </div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)">
          <div class="section-header" style="margin-bottom:8px">${icon('trendingUp',14)} Progressive Discipline</div>
          <button class="btn" onclick="DisciplinaryModule.viewProgression(${c.employee_id})">${icon('trendingUp',12)} View Discipline Timeline</button>
          <button class="btn" onclick="DisciplinaryModule.checkCompliance(${c.employee_id})">${icon('checkCircle',12)} Check LRA Compliance</button>
        </div>
      `,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="DisciplinaryModule.updateCase(${id})">Update</button>`
    });
  },

  async updateCase(id) {
    const d = UI.getFormData('ec-form');
    try {
      await fetch(`${API_BASE}/disciplinary/cases/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: d.ec_status, outcome: d.ec_outcome, sanction: d.ec_sanction,
          hearing_date: d.ec_hearing_date, hearing_chairperson: d.ec_chairperson,
          ccma_referral: d.ec_ccma, ccma_case_number: d.ec_ccma_case, ccma_outcome: d.ec_ccma_outcome
        })
      });
      UI.closeModal(); UI.toast('success', 'Case Updated', 'Disciplinary case updated');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async viewProgression(employeeId) {
    try {
      const data = await api(`/disciplinary/progression/${employeeId}`);
      const steps = data.data || [];
      const stepOrder = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'DISMISSAL'];
      const stepLabels = { VERBAL_WARNING: 'Verbal Warning', WRITTEN_WARNING: 'Written Warning', FINAL_WARNING: 'Final Warning', DISMISSAL: 'Dismissal' };
      const stepIcons = { VERBAL_WARNING: 'messageCircle', WRITTEN_WARNING: 'fileText', FINAL_WARNING: 'alertTriangle', DISMISSAL: 'xCircle' };

      let timelineHtml = '';
      stepOrder.forEach((stepKey, idx) => {
        const match = steps.find(s => (s.outcome || '').toUpperCase() === stepKey || (s.step_type || '').toUpperCase() === stepKey);
        const isActive = !!match;
        const dateStr = match && match.date ? new Date(match.date).toLocaleDateString('en-ZA') : (match && match.offence_date ? new Date(match.offence_date).toLocaleDateString('en-ZA') : '');
        const outcomeStr = match ? (match.outcome || match.step_type || stepKey) : '';
        const caseNum = match ? (match.case_number || '') : '';
        const isLast = idx === stepOrder.length - 1;

        timelineHtml += `
          <div style="display:flex;gap:16px;position:relative;min-height:70px">
            <div style="display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0">
              <div style="width:24px;height:24px;border-radius:50%;background:${isActive ? 'var(--primary)' : 'var(--border-color)'};display:flex;align-items:center;justify-content:center;color:${isActive ? '#fff' : 'var(--text-muted)'};z-index:1;flex-shrink:0">
                ${icon(stepIcons[stepKey], 12)}
              </div>
              ${!isLast ? `<div style="width:2px;flex:1;background:${isActive ? 'var(--primary)' : 'var(--border-color)'};margin:4px 0"></div>` : ''}
            </div>
            <div style="flex:1;padding-bottom:${isLast ? '0' : '16px'}">
              <div style="font-weight:600;color:${isActive ? 'var(--text-primary)' : 'var(--text-muted)'}">${stepLabels[stepKey]}</div>
              ${isActive ? `
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${dateStr}${caseNum ? ' - ' + caseNum : ''}</div>
                <div style="font-size:12px;margin-top:2px"><span class="badge badge-primary">${outcomeStr}</span></div>
              ` : `<div style="font-size:12px;color:var(--text-muted);margin-top:2px">No record</div>`}
            </div>
          </div>
        `;
      });

      UI.modal({
        title: `${icon('trendingUp',16)} Progressive Discipline Timeline`,
        content: `
          <div style="padding:16px;background:var(--bg-secondary);border-radius:8px">
            ${timelineHtml || '<div style="text-align:center;color:var(--text-muted)">No disciplinary progression records found</div>'}
          </div>
        `,
        size: 'md',
        footer: `<button class="btn" data-close-modal>Close</button>`
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async checkCompliance(employeeId) {
    try {
      const data = await api(`/disciplinary/compliance-check/${employeeId}`);
      const result = data.data || data;
      const items = result.checks || result.issues || [];

      let checksHtml = '';
      if (Array.isArray(items) && items.length > 0) {
        checksHtml = items.map(item => {
          const passed = item.passed || item.compliant || item.status === 'PASS';
          return `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg-primary);border-radius:6px;margin-bottom:6px;border-left:3px solid ${passed ? 'var(--success)' : 'var(--danger)'}">
              ${icon(passed ? 'checkCircle' : 'xCircle', 14)}
              <span style="flex:1">${item.description || item.check || item.message || '-'}</span>
              <span class="badge ${passed ? 'badge-success' : 'badge-danger'}">${passed ? 'PASS' : 'FAIL'}</span>
            </div>
          `;
        }).join('');
      } else {
        const compStatus = result.compliant || result.is_compliant;
        checksHtml = `
          <div style="text-align:center;padding:20px">
            ${icon(compStatus ? 'checkCircle' : 'alertTriangle', 32)}
            <div style="font-size:16px;font-weight:600;margin-top:8px">${compStatus ? 'LRA Compliant' : 'Compliance Issues Found'}</div>
            <div style="color:var(--text-secondary);margin-top:4px">${result.message || result.summary || 'Review completed'}</div>
          </div>
        `;
      }

      UI.modal({
        title: `${icon('checkCircle',16)} LRA Compliance Check`,
        content: `
          <div style="padding:12px">
            <div class="section-header" style="margin-bottom:12px">${icon('shield',14)} Compliance Results</div>
            ${checksHtml}
          </div>
        `,
        size: 'md',
        footer: `<button class="btn" data-close-modal>Close</button>`
      });
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async renderProgression(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
      const empOptions = emps.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('trendingUp',16)} Progressive Discipline</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
          <select id="prog-employee-select" class="form-control" style="max-width:350px">
            <option value="">-- Select Employee --</option>
            ${empOptions}
          </select>
          <button class="btn btn-primary" onclick="DisciplinaryModule.loadProgressionTimeline()">${icon('search',14)} View Timeline</button>
        </div>
        <div id="progression-timeline" style="padding:16px;background:var(--bg-secondary);border-radius:8px">
          <div style="text-align:center;color:var(--text-muted);padding:40px">${icon('trendingUp',32)}<br>Select an employee to view their progressive discipline timeline</div>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async loadProgressionTimeline() {
    const empId = document.getElementById('prog-employee-select')?.value;
    const container = document.getElementById('progression-timeline');
    if (!empId || !container) {
      UI.toast('error', 'Error', 'Please select an employee');
      return;
    }

    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';

    try {
      const data = await api(`/disciplinary/progression/${empId}`);
      const steps = data.data || [];
      const stepOrder = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WARNING', 'DISMISSAL'];
      const stepLabels = { VERBAL_WARNING: 'Verbal Warning', WRITTEN_WARNING: 'Written Warning', FINAL_WARNING: 'Final Warning', DISMISSAL: 'Dismissal' };
      const stepIcons = { VERBAL_WARNING: 'messageCircle', WRITTEN_WARNING: 'fileText', FINAL_WARNING: 'alertTriangle', DISMISSAL: 'xCircle' };

      let timelineHtml = '';
      stepOrder.forEach((stepKey, idx) => {
        const match = steps.find(s => (s.outcome || '').toUpperCase() === stepKey || (s.step_type || '').toUpperCase() === stepKey);
        const isActive = !!match;
        const dateStr = match && match.date ? new Date(match.date).toLocaleDateString('en-ZA') : (match && match.offence_date ? new Date(match.offence_date).toLocaleDateString('en-ZA') : '');
        const outcomeStr = match ? (match.outcome || match.step_type || stepKey) : '';
        const caseNum = match ? (match.case_number || '') : '';
        const chargeDesc = match ? (match.charge_description || '') : '';
        const isLast = idx === stepOrder.length - 1;

        timelineHtml += `
          <div style="display:flex;gap:16px;position:relative;min-height:80px">
            <div style="display:flex;flex-direction:column;align-items:center;width:32px;flex-shrink:0">
              <div style="width:28px;height:28px;border-radius:50%;background:${isActive ? 'var(--primary)' : 'var(--border-color)'};display:flex;align-items:center;justify-content:center;color:${isActive ? '#fff' : 'var(--text-muted)'};z-index:1;flex-shrink:0">
                ${icon(stepIcons[stepKey], 14)}
              </div>
              ${!isLast ? `<div style="width:2px;flex:1;background:${isActive ? 'var(--primary)' : 'var(--border-color)'};margin:4px 0"></div>` : ''}
            </div>
            <div style="flex:1;padding-bottom:${isLast ? '0' : '20px'}">
              <div style="font-weight:600;font-size:14px;color:${isActive ? 'var(--text-primary)' : 'var(--text-muted)'}">${stepLabels[stepKey]}</div>
              ${isActive ? `
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${icon('calendar',10)} ${dateStr}${caseNum ? '  |  Case: ' + caseNum : ''}</div>
                ${chargeDesc ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${chargeDesc}</div>` : ''}
                <div style="margin-top:4px"><span class="badge badge-primary">${outcomeStr}</span></div>
              ` : `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">No record at this level</div>`}
            </div>
          </div>
        `;
      });

      container.innerHTML = timelineHtml || '<div style="text-align:center;color:var(--text-muted);padding:20px">No disciplinary progression records found for this employee</div>';

      const compBtn = `<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-color)"><button class="btn btn-primary" onclick="DisciplinaryModule.checkCompliance(${empId})">${icon('checkCircle',14)} Check LRA Compliance</button></div>`;
      container.innerHTML += compBtn;
    } catch (err) {
      container.innerHTML = `<div style="text-align:center;color:var(--danger);padding:20px">${err.message}</div>`;
    }
  },

  async renderGrievances(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/disciplinary/grievances');
      const slaColors = { ON_TIME: 'badge-success', WARNING: 'badge-warning', OVERDUE: 'badge-danger' };
      const rows = data.data.map(g => {
        const slaStatus = g.sla_status || '';
        const slaDeadline = g.sla_deadline ? new Date(g.sla_deadline).toLocaleDateString('en-ZA') : '-';
        const slaBadge = slaStatus ? `<span class="badge ${slaColors[slaStatus] || ''}">${slaStatus}</span>` : '-';
        return `
          <tr>
            <td><strong>${g.grievance_number}</strong></td>
            <td>${g.first_name} ${g.surname}</td>
            <td>${g.category || '-'}</td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.description}</td>
            <td>${new Date(g.date_submitted).toLocaleDateString('en-ZA')}</td>
            <td><span class="status-badge status-${(g.status||'').toLowerCase()}">${g.status}</span></td>
            <td>${slaDeadline}</td>
            <td>${slaBadge}</td>
            <td>
              <button class="btn btn-sm" onclick="DisciplinaryModule.editGrievance(${g.id})">${icon('edit',12)}</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('alertTriangle',16)} Grievances (${data.data.length})</div>
          <button class="btn btn-primary" onclick="DisciplinaryModule.addGrievance()">${icon('plus',14)} File Grievance</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Ref</th><th>Employee</th><th>Category</th><th>Description</th><th>Submitted</th><th>Status</th><th>SLA Deadline</th><th>SLA Status</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No grievances filed</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async addGrievance() {
    const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const content = UI.buildForm([
      { id: 'gr_employee_id', label: 'Employee', type: 'select', required: true, options: emps.data.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` })) },
      { id: 'gr_category', label: 'Category', type: 'select', options: ['UNFAIR_TREATMENT','HARASSMENT','WORKING_CONDITIONS','SALARY_DISPUTE','POLICY_VIOLATION','OTHER'] },
      { id: 'gr_description', label: 'Description', type: 'textarea', required: true, fullWidth: true },
    ]);
    UI.modal({
      title: 'File Grievance',
      content: `<div class="form-grid" id="gr-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="DisciplinaryModule.saveGrievance()">Submit Grievance</button>`
    });
  },

  async saveGrievance() {
    const d = UI.getFormData('gr-form');
    try {
      await apiPost('/disciplinary/grievances', { employee_id: parseInt(d.gr_employee_id), description: d.gr_description, category: d.gr_category });
      UI.closeModal(); UI.toast('success', 'Grievance Filed', 'Grievance submitted successfully');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editGrievance(id) {
    const data = await api('/disciplinary/grievances');
    const g = data.data.find(x => x.id === id);
    if (!g) return;
    const content = UI.buildForm([
      { id: 'eg_status', label: 'Status', type: 'select', value: g.status, options: ['SUBMITTED','INVESTIGATING','RESOLVED','ESCALATED','WITHDRAWN'] },
      { id: 'eg_investigator', label: 'Investigator', type: 'text', value: g.investigator || '' },
      { id: 'eg_resolution', label: 'Resolution', type: 'textarea', value: g.resolution || '', fullWidth: true },
    ]);
    UI.modal({
      title: `Update Grievance ${g.grievance_number}`,
      content: `<div class="form-grid" id="eg-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="DisciplinaryModule.updateGrievance(${id})">Update</button>`
    });
  },

  async updateGrievance(id) {
    const d = UI.getFormData('eg-form');
    try {
      await fetch(`${API_BASE}/disciplinary/grievances/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: d.eg_status, investigator: d.eg_investigator, resolution: d.eg_resolution }) });
      UI.closeModal(); UI.toast('success', 'Updated', 'Grievance updated');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  }
};
