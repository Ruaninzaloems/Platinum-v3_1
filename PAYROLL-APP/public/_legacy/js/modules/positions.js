const PositionsModule = {
  state: {
    positions: [],
    departments: [],
    divisions: [],
    taskGrades: [],
    jobProfiles: [],
    filters: { status: '', department_id: '', search: '' },
    pagination: { page: 1, limit: 25, total: 0 },
    currentView: 'list',
    currentPosition: null,
    currentTab: 'details',
  },

  async render(el) {
    this.el = el;
    await this.loadLookups();
    this.renderList();
  },

  async loadLookups() {
    try {
      const [depts, grades, profiles] = await Promise.all([
        api('/departments'),
        api('/positions/task-grades'),
        api('/positions/job-profiles'),
      ]);
      this.state.departments = depts.data || [];
      this.state.taskGrades = grades.data || [];
      this.state.jobProfiles = profiles.data || [];
    } catch (e) {
      console.error('Failed to load lookups:', e);
    }
  },

  async loadDivisions(deptId) {
    if (!deptId) { this.state.divisions = []; return; }
    try {
      const res = await api(`/departments/${deptId}/divisions`);
      this.state.divisions = res.data || [];
    } catch (e) { this.state.divisions = []; }
  },

  async renderList() {
    this.state.currentView = 'list';
    const { status, department_id, search } = this.state.filters;
    const { page, limit } = this.state.pagination;
    let url = `/positions?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (department_id) url += `&department_id=${department_id}`;

    this.el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading positions...</div>';

    try {
      const data = await api(url);
      this.state.positions = data.data || [];
      this.state.pagination.total = data.meta?.total || 0;

      let filtered = this.state.positions;
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.position_code?.toLowerCase().includes(s) ||
          p.title?.toLowerCase().includes(s) ||
          p.department_name?.toLowerCase().includes(s) ||
          (p.incumbent_first_name && `${p.incumbent_first_name} ${p.incumbent_surname}`.toLowerCase().includes(s))
        );
      }

      const totalPos = this.state.pagination.total;
      const filledCount = filtered.filter(p => p.status === 'FILLED').length;
      const vacantCount = filtered.filter(p => p.status === 'VACANT').length;
      const frozenCount = filtered.filter(p => p.status === 'FROZEN').length;

      const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
      const statusOpts = [
        { value: '', label: 'All Statuses' },
        { value: 'FILLED', label: 'Filled' },
        { value: 'VACANT', label: 'Vacant' },
        { value: 'FROZEN', label: 'Frozen' },
        { value: 'ABOLISHED', label: 'Abolished' },
      ];

      const rows = filtered.map(p => `
        <tr class="clickable-row" onclick="PositionsModule.viewPosition(${p.id})">
          <td><strong>${p.position_code}</strong></td>
          <td>${p.title}</td>
          <td>${p.department_name || '-'}</td>
          <td>${p.division_name || '-'}</td>
          <td>${p.grade_code || '-'}</td>
          <td>${p.incumbent_surname ? `${p.incumbent_first_name} ${p.incumbent_surname}` : '<span style="color:#94A3B8">Vacant</span>'}</td>
          <td>${p.funded ? '<span style="color:#10B981">Yes</span>' : '<span style="color:#EF4444">No</span>'}</td>
          <td><span class="status-badge status-${(p.status || '').toLowerCase()}">${p.status}</span></td>
          <td>
            <div class="action-bar">
              <button class="action-btn" onclick="event.stopPropagation();PositionsModule.editPosition(${p.id})" title="Edit">${icon('edit',14)}</button>
            </div>
          </td>
        </tr>
      `).join('');

      this.el.innerHTML = `
        ${UI.statCards([
          { value: totalPos, label: 'Total Positions', color: '#4F6AFF' },
          { value: filledCount, label: 'Filled', color: '#10B981' },
          { value: vacantCount, label: 'Vacant', color: '#F59E0B' },
          { value: frozenCount, label: 'Frozen', color: '#94A3B8' },
        ])}

        <div class="toolbar">
          <div class="toolbar-search">
            <input type="text" placeholder="Search positions..." data-search value="${search}" />
          </div>
          <div class="toolbar-filter">
            <select data-filter="department_id">
              <option value="">All Departments</option>
              ${deptOpts.map(o => `<option value="${o.value}" ${department_id == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
            <select data-filter="status">
              ${statusOpts.map(o => `<option value="${o.value}" ${status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" onclick="PositionsModule.showAddPosition()">+ Add Position</button>
          <button class="btn" onclick="PositionsModule.showTaskGradeBrowser()">TASK Grades</button>
          <button class="btn" onclick="PositionsModule.showJobProfiles()">Job Profiles</button>
          <button class="btn" onclick="PositionsModule.showDepartmentManager()">Departments</button>
        </div>

        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Title</th><th>Department</th><th>Division</th><th>Grade</th><th>Incumbent</th><th>Funded</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:#94A3B8;padding:40px">No positions found</td></tr>'}</tbody>
          </table>
        </div>

        ${UI.pagination({
          page: this.state.pagination.page,
          limit: this.state.pagination.limit,
          total: this.state.pagination.total,
          onPageChange: 'PositionsModule.goToPage',
        })}
      `;

      this.el.querySelector('[data-search]')?.addEventListener('input', (e) => {
        this.state.filters.search = e.target.value;
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => this.renderList(), 300);
      });
      this.el.querySelectorAll('[data-filter]').forEach(sel => {
        sel.addEventListener('change', (e) => {
          this.state.filters[e.target.dataset.filter] = e.target.value;
          this.state.pagination.page = 1;
          this.renderList();
        });
      });
    } catch (err) {
      this.el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load positions: ${err.message}</div>`;
    }
  },

  goToPage(page) {
    PositionsModule.state.pagination.page = page;
    PositionsModule.renderList();
  },

  showAddPosition() {
    const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
    const gradeOpts = this.state.taskGrades.map(g => ({ value: g.id, label: `${g.grade_code} - ${g.grade_name}` }));
    const profileOpts = this.state.jobProfiles.map(p => ({ value: p.id, label: p.job_title }));

    const fields = UI.buildForm([
      { type: 'section', label: 'Position Details', icon: icon('briefcase',16) },
      { id: 'pos_code', label: 'Position Code', required: true, placeholder: 'e.g. POS-001' },
      { id: 'pos_title', label: 'Position Title', required: true, placeholder: 'e.g. Senior Accountant' },
      { id: 'pos_department', label: 'Department', type: 'select', options: deptOpts, required: true },
      { id: 'pos_division', label: 'Division', type: 'select', options: [] },
      { type: 'section', label: 'Classification', icon: icon('grid',16) },
      { id: 'pos_job_profile', label: 'Job Profile', type: 'select', options: profileOpts },
      { id: 'pos_task_grade', label: 'TASK Grade', type: 'select', options: gradeOpts },
      { id: 'pos_funded', label: 'Funding Status', type: 'select', options: [{ value: 'true', label: 'Funded' }, { value: 'false', label: 'Unfunded' }], value: 'true' },
      { id: 'pos_start_date', label: 'Start Date', type: 'date', value: new Date().toISOString().split('T')[0] },
    ]);

    const overlay = UI.modal({
      title: 'Add New Position',
      size: 'lg',
      content: `<div class="form-grid" id="add-position-form">${fields}</div>`,
      footer: `
        <button class="btn" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="PositionsModule.saveNewPosition()">Create Position</button>
      `,
    });

    const deptSelect = overlay.querySelector('#pos_department');
    if (deptSelect) {
      deptSelect.addEventListener('change', async (e) => {
        await this.loadDivisions(e.target.value);
        const divSelect = overlay.querySelector('#pos_division');
        if (divSelect) {
          divSelect.innerHTML = '<option value="">-- Select --</option>' +
            this.state.divisions.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        }
      });
    }
  },

  async saveNewPosition() {
    const v = UI.validateForm('#add-position-form');
    if (!v.valid) {
      UI.toast('error', 'Validation Error', v.errors.join(', '));
      return;
    }
    const data = UI.getFormData('#add-position-form');
    const body = {
      position_code: data.pos_code,
      title: data.pos_title,
      department_id: parseInt(data.pos_department),
      division_id: data.pos_division ? parseInt(data.pos_division) : null,
      job_profile_id: data.pos_job_profile ? parseInt(data.pos_job_profile) : null,
      task_grade_id: data.pos_task_grade ? parseInt(data.pos_task_grade) : null,
      funded: data.pos_funded === 'true',
      start_date: data.pos_start_date,
    };

    try {
      const res = await fetch(`${API_BASE}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to create position');
      UI.closeModal();
      UI.toast('success', 'Position Created', `Position ${body.position_code} has been created successfully.`);
      this.renderList();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async viewPosition(id) {
    this.state.currentView = 'detail';
    this.el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading position details...</div>';

    try {
      const res = await api(`/positions/${id}`);
      this.state.currentPosition = res.data;
      this.renderPositionDetail();
    } catch (err) {
      this.el.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load position: ${err.message}</div>`;
    }
  },

  async renderPositionDetail() {
    const p = this.state.currentPosition;
    if (!p) return;

    const tabs = [
      { id: 'details', label: 'Position Details', icon: icon('briefcase',16) },
      { id: 'incumbent', label: 'Incumbent', icon: icon('user',14) },
      { id: 'jobprofile', label: 'Job Profile', icon: icon('fileText',14) },
      { id: 'history', label: 'History', icon: icon('clock',14) },
    ];

    const statusColor = {
      FILLED: '#10B981', VACANT: '#F59E0B', FROZEN: '#94A3B8', ABOLISHED: '#EF4444',
    };

    this.el.innerHTML = `
      <div style="margin-bottom:16px">
        <button class="btn" onclick="PositionsModule.renderList()">Back to Positions</button>
        <button class="btn" style="margin-left:8px" onclick="PositionsModule.editPosition(${p.id})"> Edit</button>
      </div>

      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div>
          <h2 style="margin:0;font-size:22px;color:#1E293B">${p.title}</h2>
          <div style="font-size:14px;color:#64748B;margin-top:4px">
            ${p.position_code} &middot; ${p.department_name || 'No Department'} ${p.division_name ? '&middot; ' + p.division_name : ''}
          </div>
        </div>
        <span class="status-badge status-${(p.status || '').toLowerCase()}" style="font-size:14px;padding:6px 14px">${p.status}</span>
      </div>

      ${UI.statCards([
        { value: p.grade_code || 'N/A', label: 'TASK Grade' },
        { value: p.funded ? 'Funded' : 'Unfunded', label: 'Funding', color: p.funded ? '#10B981' : '#EF4444' },
        { value: p.capacity ? parseFloat(p.capacity).toFixed(2) : '1.00', label: 'FTE Capacity' },
        { value: p.is_hod ? 'Yes' : 'No', label: 'HOD Position' },
      ])}

      ${UI.detailTabs(tabs, this.state.currentTab)}

      <div id="position-tab-content"></div>
    `;

    this.renderTabContent();
    this.el.querySelectorAll('[data-detail-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.state.currentTab = e.target.dataset.detailTab;
        this.el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderTabContent();
      });
    });
  },

  renderTabContent() {
    const p = this.state.currentPosition;
    const container = this.el.querySelector('#position-tab-content');
    if (!container) return;

    switch (this.state.currentTab) {
      case 'details':
        container.innerHTML = `
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Position Code</div><div class="info-value">${p.position_code}</div></div>
            <div class="info-item"><div class="info-label">Title</div><div class="info-value">${p.title}</div></div>
            <div class="info-item"><div class="info-label">Department</div><div class="info-value">${p.department_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Division</div><div class="info-value">${p.division_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">TASK Grade</div><div class="info-value">${p.grade_code ? `${p.grade_code} - ${p.grade_name}` : '-'}</div></div>
            <div class="info-item"><div class="info-label">Employee Type</div><div class="info-value">${p.employee_type_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Condition of Service</div><div class="info-value">${p.condition_of_service_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(p.status || '').toLowerCase()}">${p.status}</span></div></div>
            <div class="info-item"><div class="info-label">Funded</div><div class="info-value">${p.funded ? 'Yes' : 'No'}</div></div>
            <div class="info-item"><div class="info-label">HOD Position</div><div class="info-value">${p.is_hod ? 'Yes' : 'No'}</div></div>
            <div class="info-item"><div class="info-label">Capacity (FTE)</div><div class="info-value">${p.capacity ? parseFloat(p.capacity).toFixed(2) : '1.00'}</div></div>
            <div class="info-item"><div class="info-label">Start Date</div><div class="info-value">${p.start_date ? p.start_date.split('T')[0] : '-'}</div></div>
            <div class="info-item"><div class="info-label">Created</div><div class="info-value">${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</div></div>
            <div class="info-item"><div class="info-label">Last Updated</div><div class="info-value">${p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '-'}</div></div>
          </div>
        `;
        break;

      case 'incumbent':
        if (p.incumbent_id) {
          container.innerHTML = `
            <div style="background:#ECFDF5;border:1px solid #10B981;border-radius:10px;padding:20px;margin-bottom:16px">
              <div style="font-size:16px;font-weight:600;color:#065F46">Position is Filled</div>
              <div style="font-size:14px;color:#047857;margin-top:4px">Current incumbent assigned to this position</div>
            </div>
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Employee Code</div><div class="info-value">${p.incumbent_code || '-'}</div></div>
              <div class="info-item"><div class="info-label">Name</div><div class="info-value">${p.incumbent_first_name} ${p.incumbent_surname}</div></div>
            </div>
          `;
        } else {
          container.innerHTML = UI.emptyState(icon('user',32), 'No Incumbent', 'This position is currently vacant. No employee is assigned.');
        }
        break;

      case 'jobprofile':
        if (p.job_title) {
          container.innerHTML = `
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Job Title</div><div class="info-value">${p.job_title}</div></div>
              <div class="info-item"><div class="info-label">Job Purpose</div><div class="info-value">${p.job_purpose || '-'}</div></div>
              <div class="info-item"><div class="info-label">Qualifications Required</div><div class="info-value">${p.qualifications_required || '-'}</div></div>
              <div class="info-item"><div class="info-label">Experience Required</div><div class="info-value">${p.experience_required || '-'}</div></div>
            </div>
          `;
        } else {
          container.innerHTML = UI.emptyState(icon('fileText',32), 'No Job Profile', 'No job profile has been linked to this position.');
        }
        break;

      case 'history':
        this.renderHistoryTab(container, p.id);
        break;
    }
  },

  async renderHistoryTab(container, positionId) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading history...</div>';
    try {
      const data = await api(`/positions/${positionId}/history`);
      const history = data.data || [];

      const rows = history.map(h => `
        <tr>
          <td><strong>${h.field_name || '-'}</strong></td>
          <td>${h.old_value || '-'}</td>
          <td>${h.new_value || '-'}</td>
          <td>${h.changed_by || '-'}</td>
          <td>${h.changed_at ? new Date(h.changed_at).toLocaleString() : '-'}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Field</th><th>Old Value</th><th>New Value</th><th>Changed By</th><th>Changed At</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No history records found</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async editPosition(id) {
    let pos = this.state.currentPosition;
    if (!pos || pos.id !== id) {
      try {
        const res = await api(`/positions/${id}`);
        pos = res.data;
      } catch (err) {
        UI.toast('error', 'Error', 'Failed to load position for editing');
        return;
      }
    }

    if (pos.department_id) await this.loadDivisions(pos.department_id);

    const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
    const divOpts = this.state.divisions.map(d => ({ value: d.id, label: d.name }));
    const gradeOpts = this.state.taskGrades.map(g => ({ value: g.id, label: `${g.grade_code} - ${g.grade_name}` }));
    const profileOpts = this.state.jobProfiles.map(p => ({ value: p.id, label: p.job_title }));
    const statusOpts = ['VACANT', 'FILLED', 'FROZEN', 'ABOLISHED'];

    const fields = UI.buildForm([
      { type: 'section', label: 'Position Details', icon: icon('briefcase',16) },
      { id: 'edit_title', label: 'Position Title', required: true, value: pos.title },
      { id: 'edit_department', label: 'Department', type: 'select', options: deptOpts, value: pos.department_id },
      { id: 'edit_division', label: 'Division', type: 'select', options: divOpts, value: pos.division_id },
      { id: 'edit_status', label: 'Status', type: 'select', options: statusOpts, value: pos.status },
      { type: 'section', label: 'Classification', icon: icon('grid',16) },
      { id: 'edit_job_profile', label: 'Job Profile', type: 'select', options: profileOpts, value: pos.job_profile_id },
      { id: 'edit_task_grade', label: 'TASK Grade', type: 'select', options: gradeOpts, value: pos.task_grade_id },
      { id: 'edit_funded', label: 'Funding Status', type: 'select', options: [{ value: 'true', label: 'Funded' }, { value: 'false', label: 'Unfunded' }], value: pos.funded ? 'true' : 'false' },
      { id: 'edit_is_hod', label: 'HOD Position', type: 'checkbox', value: pos.is_hod },
      { id: 'edit_capacity', label: 'Capacity (FTE)', type: 'number', value: pos.capacity || 1, min: 0, max: 1, step: 0.01 },
    ]);

    const overlay = UI.modal({
      title: `Edit Position: ${pos.position_code}`,
      size: 'lg',
      content: `<div class="form-grid" id="edit-position-form">${fields}</div>`,
      footer: `
        <button class="btn" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="PositionsModule.saveEditPosition(${pos.id})">Save Changes</button>
      `,
    });

    const deptSelect = overlay.querySelector('#edit_department');
    if (deptSelect) {
      deptSelect.addEventListener('change', async (e) => {
        await this.loadDivisions(e.target.value);
        const divSelect = overlay.querySelector('#edit_division');
        if (divSelect) {
          divSelect.innerHTML = '<option value="">-- Select --</option>' +
            this.state.divisions.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        }
      });
    }
  },

  async saveEditPosition(id) {
    const v = UI.validateForm('#edit-position-form');
    if (!v.valid) {
      UI.toast('error', 'Validation Error', v.errors.join(', '));
      return;
    }
    const data = UI.getFormData('#edit-position-form');
    const body = {
      title: data.edit_title,
      department_id: data.edit_department ? parseInt(data.edit_department) : null,
      division_id: data.edit_division ? parseInt(data.edit_division) : null,
      job_profile_id: data.edit_job_profile ? parseInt(data.edit_job_profile) : null,
      task_grade_id: data.edit_task_grade ? parseInt(data.edit_task_grade) : null,
      status: data.edit_status,
      funded: data.edit_funded === 'true',
      is_hod: data.edit_is_hod || false,
      capacity: data.edit_capacity,
    };

    try {
      const res = await fetch(`${API_BASE}/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to update position');
      UI.closeModal();
      UI.toast('success', 'Position Updated', 'Position has been updated successfully.');
      if (this.state.currentView === 'detail') {
        this.viewPosition(id);
      } else {
        this.renderList();
      }
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async showTaskGradeBrowser() {
    const grades = this.state.taskGrades;
    const rows = grades.map(g => `
      <tr class="clickable-row" data-grade-id="${g.id}">
        <td><strong>${g.grade_code}</strong></td>
        <td>${g.grade_name}</td>
        <td style="text-align:right">${formatCurrency(g.minimum_salary || 0)}</td>
        <td style="text-align:right">${formatCurrency(g.midpoint_salary || 0)}</td>
        <td style="text-align:right">${formatCurrency(g.maximum_salary || 0)}</td>
        <td style="text-align:center">${g.notch_count_actual || g.notch_count || 0}</td>
        <td><button class="action-btn" onclick="event.stopPropagation();PositionsModule.showNotches(${g.id}, '${g.grade_code}')">View Notches</button></td>
      </tr>
    `).join('');

    UI.modal({
      title: 'TASK Grade Browser',
      size: 'xl',
      content: `
        <p style="font-size:13px;color:#64748B;margin-bottom:16px">
          TASK job evaluation grading system with salary scales. Click a grade to view its notch salary table.
        </p>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Grade Code</th><th>Grade Name</th><th style="text-align:right">Minimum</th><th style="text-align:right">Midpoint</th><th style="text-align:right">Maximum</th><th style="text-align:center">Notches</th><th>Actions</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94A3B8;padding:40px">No TASK grades configured</td></tr>'}</tbody>
          </table>
        </div>
      `,
      footer: '<button class="btn" onclick="UI.closeModal()">Close</button>',
    });
  },

  async showNotches(gradeId, gradeCode) {
    try {
      const res = await api(`/positions/task-grades/${gradeId}/notches`);
      const notches = res.data || [];

      const rows = notches.map(n => `
        <tr>
          <td style="text-align:center"><strong>${n.notch_number}</strong></td>
          <td>${n.notch_code || '-'}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(n.annual_salary)}</td>
          <td style="text-align:right">${formatCurrency(parseFloat(n.annual_salary || 0) / 12)}</td>
          <td style="text-align:right">${formatCurrency(n.hourly_rate || (parseFloat(n.annual_salary || 0) / 2080))}</td>
          <td>${n.start_date ? n.start_date.split('T')[0] : '-'}</td>
          <td>${n.end_date ? n.end_date.split('T')[0] : '-'}</td>
        </tr>
      `).join('');

      UI.closeModal();
      UI.modal({
        title: `Notch Salary Table - Grade ${gradeCode}`,
        size: 'lg',
        content: `
          <div class="data-grid">
            <table>
              <thead>
                <tr><th style="text-align:center">Notch</th><th>Code</th><th style="text-align:right">Annual Salary</th><th style="text-align:right">Monthly</th><th style="text-align:right">Hourly Rate</th><th>Start Date</th><th>End Date</th></tr>
              </thead>
              <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#94A3B8;padding:40px">No notches defined for this grade</td></tr>'}</tbody>
            </table>
          </div>
        `,
        footer: `
          <button class="btn" onclick="PositionsModule.showTaskGradeBrowser()">Back to Grades</button>
          <button class="btn" onclick="UI.closeModal()">Close</button>
        `,
      });
    } catch (err) {
      UI.toast('error', 'Error', `Failed to load notches: ${err.message}`);
    }
  },

  showJobProfiles() {
    const profiles = this.state.jobProfiles;
    const rows = profiles.map(p => `
      <tr class="clickable-row" onclick="PositionsModule.viewJobProfile(${p.id})">
        <td><strong>${p.job_title}</strong></td>
        <td>${p.job_purpose ? (p.job_purpose.length > 80 ? p.job_purpose.substring(0, 80) + '...' : p.job_purpose) : '-'}</td>
        <td>${p.qualifications_required ? (p.qualifications_required.length > 60 ? p.qualifications_required.substring(0, 60) + '...' : p.qualifications_required) : '-'}</td>
      </tr>
    `).join('');

    UI.modal({
      title: 'Job Profiles',
      size: 'xl',
      content: `
        <div class="data-grid">
          <table>
            <thead><tr><th>Job Title</th><th>Purpose</th><th>Qualifications</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#94A3B8;padding:40px">No job profiles configured</td></tr>'}</tbody>
          </table>
        </div>
      `,
      footer: '<button class="btn" onclick="UI.closeModal()">Close</button>',
    });
  },

  viewJobProfile(id) {
    const profile = this.state.jobProfiles.find(p => p.id === id);
    if (!profile) return;

    UI.closeModal();
    UI.modal({
      title: profile.job_title,
      size: 'lg',
      content: `
        <div class="info-grid" style="gap:20px">
          <div class="info-item" style="grid-column:1/-1"><div class="info-label">Job Title</div><div class="info-value">${profile.job_title}</div></div>
          <div class="info-item" style="grid-column:1/-1"><div class="info-label">Job Purpose</div><div class="info-value">${profile.job_purpose || 'Not specified'}</div></div>
          <div class="info-item" style="grid-column:1/-1"><div class="info-label">Qualifications Required</div><div class="info-value">${profile.qualifications_required || 'Not specified'}</div></div>
          <div class="info-item" style="grid-column:1/-1"><div class="info-label">Experience Required</div><div class="info-value">${profile.experience_required || 'Not specified'}</div></div>
          ${profile.key_competencies ? `<div class="info-item" style="grid-column:1/-1"><div class="info-label">Key Competencies</div><div class="info-value">${profile.key_competencies}</div></div>` : ''}
          ${profile.key_responsibilities ? `<div class="info-item" style="grid-column:1/-1"><div class="info-label">Key Responsibilities</div><div class="info-value">${profile.key_responsibilities}</div></div>` : ''}
        </div>
      `,
      footer: `
        <button class="btn" onclick="PositionsModule.showJobProfiles()">Back to Profiles</button>
        <button class="btn" onclick="UI.closeModal()">Close</button>
      `,
    });
  },

  async showDepartmentManager() {
    try {
      const res = await api('/departments');
      const departments = res.data || [];

      const rows = departments.map(d => `
        <tr>
          <td><strong>${d.code}</strong></td>
          <td>${d.name}</td>
          <td style="text-align:center">${d.division_count || 0}</td>
          <td style="text-align:center">${d.filled_positions || 0}</td>
          <td style="text-align:center">${d.vacant_positions || 0}</td>
          <td style="text-align:center">${d.position_count || 0}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" onclick="event.stopPropagation();PositionsModule.editDepartment(${d.id}, '${d.code}', '${d.name.replace(/'/g, "\\'")}')">Edit</button>
              <button class="action-btn" onclick="event.stopPropagation();PositionsModule.viewDivisions(${d.id}, '${d.name.replace(/'/g, "\\'")}')">Divisions</button>
            </div>
          </td>
        </tr>
      `).join('');

      UI.modal({
        title: 'Department & Division Management',
        size: 'xl',
        content: `
          <div style="margin-bottom:16px">
            <button class="btn btn-primary" onclick="PositionsModule.showAddDepartment()">+ Add Department</button>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Code</th><th>Department</th><th style="text-align:center">Divisions</th><th style="text-align:center">Filled</th><th style="text-align:center">Vacant</th><th style="text-align:center">Total Positions</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `,
        footer: '<button class="btn" onclick="UI.closeModal()">Close</button>',
      });
    } catch (err) {
      UI.toast('error', 'Error', `Failed to load departments: ${err.message}`);
    }
  },

  showAddDepartment() {
    UI.closeModal();
    const fields = UI.buildForm([
      { id: 'dept_code', label: 'Department Code', required: true, placeholder: 'e.g. CORP' },
      { id: 'dept_name', label: 'Department Name', required: true, placeholder: 'e.g. Corporate Services' },
    ]);

    UI.modal({
      title: 'Add Department',
      size: 'sm',
      content: `<div class="form-grid" id="add-dept-form">${fields}</div>`,
      footer: `
        <button class="btn" onclick="PositionsModule.showDepartmentManager()">Cancel</button>
        <button class="btn btn-primary" onclick="PositionsModule.saveNewDepartment()">Create</button>
      `,
    });
  },

  async saveNewDepartment() {
    const v = UI.validateForm('#add-dept-form');
    if (!v.valid) {
      UI.toast('error', 'Validation Error', v.errors.join(', '));
      return;
    }
    const data = UI.getFormData('#add-dept-form');
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.dept_code, name: data.dept_name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to create department');
      UI.closeModal();
      UI.toast('success', 'Department Created', `${data.dept_name} has been created.`);
      await this.loadLookups();
      this.showDepartmentManager();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  editDepartment(id, code, name) {
    UI.closeModal();
    const fields = UI.buildForm([
      { id: 'edit_dept_code', label: 'Department Code', value: code, disabled: true },
      { id: 'edit_dept_name', label: 'Department Name', required: true, value: name },
    ]);

    UI.modal({
      title: `Edit Department: ${code}`,
      size: 'sm',
      content: `<div class="form-grid" id="edit-dept-form">${fields}</div>`,
      footer: `
        <button class="btn" onclick="PositionsModule.showDepartmentManager()">Cancel</button>
        <button class="btn btn-primary" onclick="PositionsModule.saveEditDepartment(${id})">Save</button>
      `,
    });
  },

  async saveEditDepartment(id) {
    const v = UI.validateForm('#edit-dept-form');
    if (!v.valid) {
      UI.toast('error', 'Validation Error', v.errors.join(', '));
      return;
    }
    const data = UI.getFormData('#edit-dept-form');
    try {
      const res = await fetch(`${API_BASE}/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.edit_dept_name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to update department');
      UI.closeModal();
      UI.toast('success', 'Department Updated', 'Department has been updated.');
      await this.loadLookups();
      this.showDepartmentManager();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async viewDivisions(deptId, deptName) {
    UI.closeModal();
    try {
      const res = await api(`/departments/${deptId}/divisions`);
      const divisions = res.data || [];

      const rows = divisions.map(d => `
        <tr>
          <td><strong>${d.code}</strong></td>
          <td>${d.name}</td>
        </tr>
      `).join('');

      UI.modal({
        title: `Divisions - ${deptName}`,
        size: 'lg',
        content: `
          <div style="margin-bottom:16px">
            <button class="btn btn-primary" onclick="PositionsModule.showAddDivision(${deptId}, '${deptName.replace(/'/g, "\\'")}')">+ Add Division</button>
          </div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Code</th><th>Division Name</th></tr></thead>
              <tbody>${rows || '<tr><td colspan="2" style="text-align:center;color:#94A3B8;padding:40px">No divisions</td></tr>'}</tbody>
            </table>
          </div>
        `,
        footer: `
          <button class="btn" onclick="PositionsModule.showDepartmentManager()">Back to Departments</button>
          <button class="btn" onclick="UI.closeModal()">Close</button>
        `,
      });
    } catch (err) {
      UI.toast('error', 'Error', `Failed to load divisions: ${err.message}`);
    }
  },

  showAddDivision(deptId, deptName) {
    UI.closeModal();
    const fields = UI.buildForm([
      { id: 'div_code', label: 'Division Code', required: true, placeholder: 'e.g. FIN' },
      { id: 'div_name', label: 'Division Name', required: true, placeholder: 'e.g. Finance Division' },
    ]);

    UI.modal({
      title: `Add Division to ${deptName}`,
      size: 'sm',
      content: `<div class="form-grid" id="add-div-form">${fields}</div>`,
      footer: `
        <button class="btn" onclick="PositionsModule.viewDivisions(${deptId}, '${deptName.replace(/'/g, "\\'")}')">Cancel</button>
        <button class="btn btn-primary" onclick="PositionsModule.saveNewDivision(${deptId}, '${deptName.replace(/'/g, "\\'")}')">Create</button>
      `,
    });
  },

  async saveNewDivision(deptId, deptName) {
    const v = UI.validateForm('#add-div-form');
    if (!v.valid) {
      UI.toast('error', 'Validation Error', v.errors.join(', '));
      return;
    }
    const data = UI.getFormData('#add-div-form');
    try {
      const res = await fetch(`${API_BASE}/departments/${deptId}/divisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.div_code, name: data.div_name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to create division');
      UI.closeModal();
      UI.toast('success', 'Division Created', `${data.div_name} has been created.`);
      await this.loadLookups();
      this.viewDivisions(deptId, deptName);
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },
};
