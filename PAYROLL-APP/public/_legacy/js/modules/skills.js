const SkillsModule = {
  state: { activeTab: 'courses' },

  async render(el) {
    el.innerHTML = `
      <div class="module-tabs">
        <div class="detail-tab active" data-stab="courses">${icon('award',14)} Training Courses</div>
        <div class="detail-tab" data-stab="qualifications">${icon('file',14)} Qualifications</div>
        <div class="detail-tab" data-stab="records">${icon('clipboard',14)} Training Records</div>
        <div class="detail-tab" data-stab="wsp">${icon('barChart',14)} WSP / ATR</div>
        <div class="detail-tab" data-stab="competencies">${icon('layers',14)} Competency Framework</div>
        <div class="detail-tab" data-stab="gapAnalysis">${icon('alertTriangle',14)} Gap Analysis</div>
        <div class="detail-tab" data-stab="trainingCalendar">${icon('calendar',14)} Training Calendar</div>
      </div>
      <div id="skills-content"></div>
    `;
    el.querySelectorAll('[data-stab]').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.state.activeTab = tab.dataset.stab;
        this.loadTab();
      });
    });
    this.loadTab();
  },

  async loadTab() {
    const el = document.getElementById('skills-content');
    if (!el) return;
    switch (this.state.activeTab) {
      case 'courses': await this.renderCourses(el); break;
      case 'qualifications': await this.renderQualifications(el); break;
      case 'records': await this.renderRecords(el); break;
      case 'wsp': await this.renderWSP(el); break;
      case 'competencies': await this.renderCompetencies(el); break;
      case 'gapAnalysis': await this.renderGapAnalysis(el); break;
      case 'trainingCalendar': await this.renderTrainingCalendar(el); break;
    }
  },

  async renderCourses(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/skills/courses');
      const rows = data.data.map(c => `
        <tr>
          <td><strong>${c.course_code || '-'}</strong></td>
          <td>${c.course_name}</td>
          <td>${c.category || '-'}</td>
          <td>${c.provider || '-'}</td>
          <td style="text-align:right">${c.duration_hours ? c.duration_hours + 'h' : '-'}</td>
          <td style="text-align:right">${c.cost ? 'R ' + parseFloat(c.cost).toLocaleString() : '-'}</td>
          <td>${c.nqf_level ? 'NQF ' + c.nqf_level : '-'}</td>
          <td><span class="status-badge ${c.is_active ? 'status-approved' : 'status-failed'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
          <td><button class="btn btn-sm" onclick="SkillsModule.editCourse(${c.id})">${icon('edit',12)}</button></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('award',16)} Training Course Catalogue (${data.data.length})</div>
          <button class="btn btn-primary" onclick="SkillsModule.addCourse()">${icon('plus',14)} Add Course</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Code</th><th>Course Name</th><th>Category</th><th>Provider</th><th>Duration</th><th>Cost</th><th>NQF</th><th>Status</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No courses registered</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  addCourse() {
    const content = UI.buildForm([
      { id: 'tc_code', label: 'Course Code', type: 'text' },
      { id: 'tc_name', label: 'Course Name', type: 'text', required: true },
      { id: 'tc_category', label: 'Category', type: 'select', options: ['TECHNICAL','MANAGEMENT','COMPLIANCE','SAFETY','SOFT_SKILLS','IT','FINANCE','LEGAL'] },
      { id: 'tc_provider', label: 'Training Provider', type: 'text' },
      { id: 'tc_duration', label: 'Duration (hours)', type: 'number' },
      { id: 'tc_cost', label: 'Cost (R)', type: 'number' },
      { id: 'tc_nqf', label: 'NQF Level', type: 'select', options: ['','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'tc_saqa', label: 'SAQA ID', type: 'text' },
      { id: 'tc_desc', label: 'Description', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Add Training Course',
      content: `<div class="form-grid" id="tc-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.saveCourse()">Save Course</button>`
    });
  },

  async saveCourse() {
    const d = UI.getFormData('tc-form');
    try {
      await apiPost('/skills/courses', {
        course_code: d.tc_code, course_name: d.tc_name, category: d.tc_category,
        provider: d.tc_provider, duration_hours: d.tc_duration ? parseInt(d.tc_duration) : null,
        cost: d.tc_cost ? parseFloat(d.tc_cost) : null, nqf_level: d.tc_nqf ? parseInt(d.tc_nqf) : null,
        saqa_id: d.tc_saqa, description: d.tc_desc
      });
      UI.closeModal(); UI.toast('success', 'Course Added', 'Training course registered');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editCourse(id) {
    const data = await api('/skills/courses');
    const c = data.data.find(x => x.id === id);
    if (!c) return;
    const content = UI.buildForm([
      { id: 'ec_code', label: 'Course Code', type: 'text', value: c.course_code || '' },
      { id: 'ec_name', label: 'Course Name', type: 'text', required: true, value: c.course_name },
      { id: 'ec_category', label: 'Category', type: 'select', value: c.category, options: ['TECHNICAL','MANAGEMENT','COMPLIANCE','SAFETY','SOFT_SKILLS','IT','FINANCE','LEGAL'] },
      { id: 'ec_provider', label: 'Provider', type: 'text', value: c.provider || '' },
      { id: 'ec_duration', label: 'Duration (hours)', type: 'number', value: c.duration_hours || '' },
      { id: 'ec_cost', label: 'Cost (R)', type: 'number', value: c.cost || '' },
      { id: 'ec_nqf', label: 'NQF Level', type: 'select', value: c.nqf_level, options: ['','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'ec_active', label: 'Active', type: 'checkbox', value: c.is_active },
    ]);
    UI.modal({
      title: 'Edit Course',
      content: `<div class="form-grid" id="ec-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.updateCourse(${id})">Update</button>`
    });
  },

  async updateCourse(id) {
    const d = UI.getFormData('ec-form');
    try {
      await fetch(`${API_BASE}/skills/courses/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_code: d.ec_code, course_name: d.ec_name, category: d.ec_category,
          provider: d.ec_provider, duration_hours: d.ec_duration ? parseInt(d.ec_duration) : null,
          cost: d.ec_cost ? parseFloat(d.ec_cost) : null, nqf_level: d.ec_nqf ? parseInt(d.ec_nqf) : null,
          is_active: d.ec_active
        })
      });
      UI.closeModal(); UI.toast('success', 'Updated', 'Course updated'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderQualifications(el) {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-header" style="margin:0">${icon('file',16)} Employee Qualifications</div>
        <button class="btn btn-primary" onclick="SkillsModule.addQualification()">${icon('plus',14)} Add Qualification</button>
      </div>
      <div class="form-group" style="max-width:300px;margin-bottom:12px">
        <label>Select Employee</label>
        <select class="form-control" id="qual-employee" onchange="SkillsModule.loadQualifications()"><option value="">Loading...</option></select>
      </div>
      <div id="qual-list"></div>
    `;
    const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const sel = document.getElementById('qual-employee');
    if (sel) sel.innerHTML = '<option value="">-- Select Employee --</option>' + emps.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
  },

  async loadQualifications() {
    const empId = document.getElementById('qual-employee')?.value;
    const el = document.getElementById('qual-list');
    if (!el || !empId) { if (el) el.innerHTML = ''; return; }
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api(`/skills/qualifications/${empId}`);
      const rows = data.data.map(q => `
        <tr>
          <td><strong>${q.qualification_name}</strong></td>
          <td>${q.qualification_type || '-'}</td>
          <td>${q.institution || '-'}</td>
          <td>${q.nqf_level ? 'NQF ' + q.nqf_level : '-'}</td>
          <td>${q.year_obtained || '-'}</td>
          <td><span class="status-badge ${q.verified ? 'status-approved' : 'status-pending'}">${q.verified ? 'Verified' : 'Unverified'}</span></td>
        </tr>
      `).join('');
      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead><tr><th>Qualification</th><th>Type</th><th>Institution</th><th>NQF</th><th>Year</th><th>Status</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No qualifications on record</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async addQualification() {
    const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const content = UI.buildForm([
      { id: 'aq_emp', label: 'Employee', type: 'select', required: true, options: emps.data.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` })) },
      { id: 'aq_name', label: 'Qualification Name', type: 'text', required: true },
      { id: 'aq_type', label: 'Type', type: 'select', options: ['CERTIFICATE','DIPLOMA','DEGREE','HONOURS','MASTERS','DOCTORATE','MATRIC','TRADE_TEST','NCV','OTHER'] },
      { id: 'aq_inst', label: 'Institution', type: 'text' },
      { id: 'aq_nqf', label: 'NQF Level', type: 'select', options: ['','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'aq_year', label: 'Year Obtained', type: 'number' },
      { id: 'aq_ref', label: 'Reference / Student No.', type: 'text' },
    ]);
    UI.modal({
      title: 'Add Qualification',
      content: `<div class="form-grid" id="aq-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.saveQualification()">Save</button>`
    });
  },

  async saveQualification() {
    const d = UI.getFormData('aq-form');
    try {
      await apiPost('/skills/qualifications', {
        employee_id: parseInt(d.aq_emp), qualification_name: d.aq_name, qualification_type: d.aq_type,
        institution: d.aq_inst, nqf_level: d.aq_nqf ? parseInt(d.aq_nqf) : null,
        year_obtained: d.aq_year ? parseInt(d.aq_year) : null, reference_number: d.aq_ref
      });
      UI.closeModal(); UI.toast('success', 'Added', 'Qualification recorded'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderRecords(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/skills/records');
      const rows = data.data.map(r => `
        <tr>
          <td>${r.first_name ? r.first_name + ' ' + r.surname : 'ID:' + r.employee_id}</td>
          <td>${r.course_name || 'Course ID:' + r.course_id}</td>
          <td>${r.training_date ? new Date(r.training_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td><span class="status-badge status-${(r.status||'').toLowerCase()}">${r.status || '-'}</span></td>
          <td>${r.score !== null && r.score !== undefined ? r.score + '%' : '-'}</td>
          <td>${r.nqf_level ? 'NQF ' + r.nqf_level : '-'}</td>
          <td style="text-align:right">${r.cpd_points != null ? r.cpd_points : '-'}</td>
          <td style="text-align:right">${r.cost_actual ? 'R ' + parseFloat(r.cost_actual).toLocaleString() : '-'}</td>
          <td><button class="btn btn-sm" onclick="SkillsModule.editRecord(${r.id})">${icon('edit',12)}</button></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('clipboard',16)} Training Records (${data.data.length})</div>
          <button class="btn btn-primary" onclick="SkillsModule.addRecord()">${icon('plus',14)} Log Training</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Employee</th><th>Course</th><th>Date</th><th>Status</th><th>Score</th><th>NQF</th><th>CPD Points</th><th>Cost</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No training records</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async addRecord() {
    const [emps, courses] = await Promise.all([
      api('/employees?limit=100&sort_by=surname&sort_order=asc'),
      api('/skills/courses')
    ]);
    const content = UI.buildForm([
      { id: 'tr_emp', label: 'Employee', type: 'select', required: true, options: emps.data.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` })) },
      { id: 'tr_course', label: 'Course', type: 'select', required: true, options: courses.data.map(c => ({ value: c.id, label: c.course_name })) },
      { id: 'tr_date', label: 'Training Date', type: 'date' },
      { id: 'tr_status', label: 'Status', type: 'select', options: ['ENROLLED','IN_PROGRESS','COMPLETED','CANCELLED','FAILED'] },
      { id: 'tr_cost', label: 'Actual Cost (R)', type: 'number' },
      { id: 'tr_nqf', label: 'NQF Level', type: 'select', options: ['','1','2','3','4','5','6','7','8','9','10'] },
      { id: 'tr_cpd', label: 'CPD Points', type: 'number', placeholder: 'Continuing Professional Development points' },
      { id: 'tr_wsp', label: 'WSP Year', type: 'number', value: new Date().getFullYear() },
    ]);
    UI.modal({
      title: 'Log Training Record',
      content: `<div class="form-grid" id="tr-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.saveRecord()">Save</button>`
    });
  },

  async saveRecord() {
    const d = UI.getFormData('tr-form');
    try {
      await apiPost('/skills/records', {
        employee_id: parseInt(d.tr_emp), course_id: parseInt(d.tr_course),
        training_date: d.tr_date, status: d.tr_status,
        cost_actual: d.tr_cost ? parseFloat(d.tr_cost) : null,
        nqf_level: d.tr_nqf ? parseInt(d.tr_nqf) : null,
        cpd_points: d.tr_cpd ? parseInt(d.tr_cpd) : null,
        wsp_year: d.tr_wsp ? parseInt(d.tr_wsp) : null
      });
      UI.closeModal(); UI.toast('success', 'Recorded', 'Training record saved'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editRecord(id) {
    const content = UI.buildForm([
      { id: 'er_status', label: 'Status', type: 'select', options: ['ENROLLED','IN_PROGRESS','COMPLETED','CANCELLED','FAILED'] },
      { id: 'er_score', label: 'Score (%)', type: 'number' },
      { id: 'er_cert', label: 'Certificate Reference', type: 'text' },
    ]);
    UI.modal({
      title: 'Update Training Record',
      content: `<div class="form-grid" id="er-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.updateRecord(${id})">Update</button>`
    });
  },

  async updateRecord(id) {
    const d = UI.getFormData('er-form');
    try {
      await fetch(`${API_BASE}/skills/records/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: d.er_status, score: d.er_score ? parseInt(d.er_score) : null, certificate_reference: d.er_cert })
      });
      UI.closeModal(); UI.toast('success', 'Updated', 'Training record updated'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  wspYear: new Date().getFullYear(),

  async renderWSP(el) {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-header" style="margin:0">${icon('barChart',16)} Workplace Skills Plan (WSP) / Annual Training Report (ATR)</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-control" id="wsp-year" style="width:120px" onchange="SkillsModule.wspYear=parseInt(this.value);SkillsModule.loadWSPData()">
            ${[0,1,2,3,4].map(i => { const y = new Date().getFullYear() - i; return `<option value="${y}" ${y === this.wspYear ? 'selected' : ''}>${y}</option>`; }).join('')}
          </select>
          <button class="btn btn-primary" onclick="SkillsModule.loadWSPData()">${icon('refreshCw',14)} Refresh</button>
        </div>
      </div>
      <div id="wsp-data"><div class="loading"><div class="spinner"></div>Loading WSP summary...</div></div>
    `;
    this.loadWSPData();
  },

  async loadWSPData() {
    const el = document.getElementById('wsp-data');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading WSP summary...</div>';
    try {
      const data = await api(`/skills/wsp-summary/${this.wspYear}`);
      const d = data.data;
      const t = d.totals || {};
      const totalPlanned = parseInt(t.total_records || 0);
      const totalCompleted = parseInt(t.completed_count || 0);
      const totalInProgress = parseInt(t.in_progress_count || 0);
      const totalEnrolled = parseInt(t.enrolled_count || 0);
      const budgetAllocated = parseFloat(t.budget_allocated || 0);
      const budgetSpent = parseFloat(t.budget_spent || 0);
      const budgetPct = budgetAllocated > 0 ? Math.round((budgetSpent / budgetAllocated) * 100) : 0;
      const completionPct = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

      const categoryMap = {};
      (d.planned || []).forEach(r => { categoryMap[r.category] = { planned: parseInt(r.planned_count), planned_cost: parseFloat(r.planned_cost), completed: 0, actual_cost: 0 }; });
      (d.completed || []).forEach(r => { if (!categoryMap[r.category]) categoryMap[r.category] = { planned: 0, planned_cost: 0, completed: 0, actual_cost: 0 }; categoryMap[r.category].completed = parseInt(r.completed_count); categoryMap[r.category].actual_cost = parseFloat(r.actual_cost); });
      const catRows = Object.entries(categoryMap).map(([cat, v]) => `
        <tr>
          <td><strong>${cat || 'Uncategorised'}</strong></td>
          <td style="text-align:right">${v.planned}</td>
          <td style="text-align:right">${v.completed}</td>
          <td style="text-align:right">${v.planned > 0 ? Math.round((v.completed / v.planned) * 100) : 0}%</td>
          <td style="text-align:right">R ${v.planned_cost.toLocaleString()}</td>
          <td style="text-align:right">R ${v.actual_cost.toLocaleString()}</td>
        </tr>
      `).join('');

      const nqfRows = (d.nqf_distribution || []).map(n => `
        <tr><td>NQF ${n.nqf_level}</td><td style="text-align:right">${n.count}</td></tr>
      `).join('');

      el.innerHTML = `
        <div class="summary-row" style="margin-bottom:20px">
          <div class="summary-card sc-blue">
            <div class="summary-icon" style="background:var(--info-bg)">${icon('clipboard',18)}</div>
            <div><div class="summary-label">Total Planned</div><div class="summary-value">${totalPlanned}</div></div>
          </div>
          <div class="summary-card sc-green">
            <div class="summary-icon" style="background:var(--success-bg)">${icon('check',18)}</div>
            <div><div class="summary-label">Completed</div><div class="summary-value">${totalCompleted} (${completionPct}%)</div></div>
          </div>
          <div class="summary-card sc-orange">
            <div class="summary-icon" style="background:var(--warning-bg)">${icon('clock',18)}</div>
            <div><div class="summary-label">In Progress / Enrolled</div><div class="summary-value">${totalInProgress} / ${totalEnrolled}</div></div>
          </div>
          <div class="summary-card sc-purple">
            <div class="summary-icon" style="background:var(--purple-bg)">${icon('dollar',18)}</div>
            <div><div class="summary-label">Budget Spent / Allocated</div><div class="summary-value">R ${budgetSpent.toLocaleString()} / R ${budgetAllocated.toLocaleString()}</div></div>
          </div>
        </div>
        <div style="background:var(--bg-secondary);border-radius:6px;padding:12px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:var(--text-secondary)">Budget Utilisation</span><span style="font-size:12px;font-weight:600">${budgetPct}%</span></div>
          <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:${Math.min(budgetPct, 100)}%;background:${budgetPct > 90 ? 'var(--danger)' : budgetPct > 70 ? 'var(--warning)' : 'var(--success)'};border-radius:4px"></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div class="section-header" style="font-size:13px;margin-bottom:8px">${icon('barChart',14)} Planned vs Actual by Category</div>
            <div class="data-grid">
              <table>
                <thead><tr><th>Category</th><th>Planned</th><th>Completed</th><th>Rate</th><th>Budget</th><th>Actual</th></tr></thead>
                <tbody>${catRows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No data for this year</td></tr>'}</tbody>
              </table>
            </div>
          </div>
          <div>
            <div class="section-header" style="font-size:13px;margin-bottom:8px">${icon('award',14)} NQF Level Distribution</div>
            <div class="data-grid">
              <table>
                <thead><tr><th>NQF Level</th><th>Count</th></tr></thead>
                <tbody>${nqfRows || '<tr><td colspan="2" style="text-align:center;color:var(--text-muted)">No NQF data</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:16px">Submit WSP annually to LGSETA by 30 April. ATR reports on training completed during the previous year.</p>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async renderCompetencies(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/skills/competencies');
      const items = data.data || [];
      const rows = items.map(c => `
        <tr>
          <td><strong>${c.name || '-'}</strong></td>
          <td>${c.category || '-'}</td>
          <td>${c.description || '-'}</td>
          <td><button class="action-btn" onclick="SkillsModule.editCompetency(${c.id})">${icon('edit',12)}</button></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('layers',16)} Competency Framework (${items.length})</div>
          <button class="btn btn-primary" onclick="SkillsModule.addCompetency()">${icon('plus',14)} Add Competency</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Description</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No competencies defined</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  addCompetency() {
    const content = UI.buildForm([
      { id: 'comp_name', label: 'Name', type: 'text', required: true },
      { id: 'comp_category', label: 'Category', type: 'select', options: ['CORE','FUNCTIONAL','LEADERSHIP','TECHNICAL'] },
      { id: 'comp_desc', label: 'Description', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Add Competency',
      content: `<div class="form-grid" id="comp-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.saveCompetency()">Save Competency</button>`
    });
  },

  async saveCompetency() {
    const d = UI.getFormData('comp-form');
    try {
      await apiPost('/skills/competencies', {
        name: d.comp_name, category: d.comp_category, description: d.comp_desc
      });
      UI.closeModal(); UI.toast('success', 'Added', 'Competency created');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editCompetency(id) {
    const data = await api('/skills/competencies');
    const c = (data.data || []).find(x => x.id === id);
    if (!c) return;
    const content = UI.buildForm([
      { id: 'ecomp_name', label: 'Name', type: 'text', required: true, value: c.name || '' },
      { id: 'ecomp_category', label: 'Category', type: 'select', value: c.category, options: ['CORE','FUNCTIONAL','LEADERSHIP','TECHNICAL'] },
      { id: 'ecomp_desc', label: 'Description', type: 'textarea', fullWidth: true, value: c.description || '' },
    ]);
    UI.modal({
      title: 'Edit Competency',
      content: `<div class="form-grid" id="ecomp-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="SkillsModule.updateCompetency(${id})">Update</button>`
    });
  },

  async updateCompetency(id) {
    const d = UI.getFormData('ecomp-form');
    try {
      await fetch(`${API_BASE}/skills/competencies/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: d.ecomp_name, category: d.ecomp_category, description: d.ecomp_desc })
      });
      UI.closeModal(); UI.toast('success', 'Updated', 'Competency updated'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderGapAnalysis(el) {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-header" style="margin:0">${icon('alertTriangle',16)} Skills Gap Analysis</div>
      </div>
      <div class="form-group" style="max-width:300px;margin-bottom:12px">
        <label>Select Employee</label>
        <select class="form-control" id="gap-employee" onchange="SkillsModule.loadGapAnalysis()"><option value="">Loading...</option></select>
      </div>
      <div id="gap-list"></div>
    `;
    const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const sel = document.getElementById('gap-employee');
    if (sel) sel.innerHTML = '<option value="">-- Select Employee --</option>' + emps.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
  },

  async loadGapAnalysis() {
    const empId = document.getElementById('gap-employee')?.value;
    const el = document.getElementById('gap-list');
    if (!el || !empId) { if (el) el.innerHTML = ''; return; }
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api(`/skills/gap-analysis/${empId}`);
      const items = data.data || [];
      const rows = items.map(g => {
        const gap = (parseInt(g.required_level) || 0) - (parseInt(g.assessed_level) || 0);
        let badgeClass = 'badge-success';
        if (gap >= 2) badgeClass = 'badge-danger';
        else if (gap === 1) badgeClass = 'badge-warning';
        return `
          <tr>
            <td><strong>${g.competency_name || g.name || '-'}</strong></td>
            <td style="text-align:center">${g.required_level != null ? g.required_level : '-'}</td>
            <td style="text-align:center">${g.assessed_level != null ? g.assessed_level : '-'}</td>
            <td style="text-align:center"><span class="${badgeClass}" style="padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${gap}</span></td>
          </tr>
        `;
      }).join('');
      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead><tr><th>Competency</th><th style="text-align:center">Required Level</th><th style="text-align:center">Assessed Level</th><th style="text-align:center">Gap</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No gap analysis data available</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,

  async renderTrainingCalendar(el) {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthOptions = monthNames.map((m, i) => `<option value="${i + 1}" ${(i + 1) === this.calendarMonth ? 'selected' : ''}>${m}</option>`).join('');
    const yearOptions = [0,1,2,3,4].map(i => { const y = new Date().getFullYear() - i + 1; return `<option value="${y}" ${y === this.calendarYear ? 'selected' : ''}>${y}</option>`; }).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="section-header" style="margin:0">${icon('calendar',16)} Training Calendar</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="form-control" id="tc-month" style="width:140px" onchange="SkillsModule.calendarMonth=parseInt(this.value);SkillsModule.loadTrainingCalendar()">
            ${monthOptions}
          </select>
          <select class="form-control" id="tc-year" style="width:100px" onchange="SkillsModule.calendarYear=parseInt(this.value);SkillsModule.loadTrainingCalendar()">
            ${yearOptions}
          </select>
          <button class="btn btn-primary" onclick="SkillsModule.loadTrainingCalendar()">${icon('refreshCw',14)} Refresh</button>
        </div>
      </div>
      <div id="tc-data"><div class="loading"><div class="spinner"></div>Loading training calendar...</div></div>
    `;
    this.loadTrainingCalendar();
  },

  async loadTrainingCalendar() {
    const el = document.getElementById('tc-data');
    if (!el) return;
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading training calendar...</div>';
    try {
      const data = await api(`/skills/training-calendar/${this.calendarYear}/${this.calendarMonth}`);
      const items = data.data || [];
      const rows = items.map(e => `
        <tr>
          <td>${e.training_date ? new Date(e.training_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td><strong>${e.course_name || '-'}</strong></td>
          <td>${e.employee_name || (e.first_name ? e.first_name + ' ' + e.surname : '-')}</td>
          <td>${e.provider || '-'}</td>
          <td><span class="status-badge status-${(e.status||'').toLowerCase()}">${e.status || '-'}</span></td>
          <td>${e.venue || '-'}</td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead><tr><th>Date</th><th>Course</th><th>Employee</th><th>Provider</th><th>Status</th><th>Venue</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No training events for this period</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  }
};
