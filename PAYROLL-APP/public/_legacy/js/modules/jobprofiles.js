const JobProfilesModule = {
  state: { profiles: [], taskGrades: [], employeeTypes: [], employeeSubtypes: [], conditions: [], salTransGroups: [], upperLimits: [], view: 'list', selectedId: null },

  esc(v) { const d = document.createElement('div'); d.textContent = v || ''; return d.innerHTML; },

  fmtDate(d) { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'); },

  async render(el) {
    this.container = el;
    if (this.state.view === 'detail' && this.state.selectedId) {
      await this.renderDetail(el);
    } else {
      await this.renderList(el);
    }
  },

  async loadLookups() {
    const [tgRes, etRes, esRes, cosRes, stgRes, ulRes] = await Promise.all([
      api('/settings/task-grades'),
      api('/settings/employee-types'),
      api('/settings/employee-subtypes'),
      api('/settings/conditions-of-service'),
      api('/settings/salary-transaction-groups'),
      api('/settings/upper-limits')
    ]);
    this.state.taskGrades = tgRes.data || [];
    this.state.employeeTypes = etRes.data || [];
    this.state.employeeSubtypes = esRes.data || [];
    this.state.conditions = cosRes.data || [];
    this.state.salTransGroups = stgRes.data || [];
    this.state.upperLimits = ulRes.data || [];
  },

  async renderList(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading job profiles...</div>';
    try {
      const [profRes] = await Promise.all([api('/positions/job-profiles')]);
      this.state.profiles = profRes.data || [];
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${icon('alertTriangle',32)}<p>Failed to load job profiles</p></div>`;
      return;
    }

    const profiles = this.state.profiles;
    const rows = profiles.map(p => `
      <tr class="clickable-row" data-view-profile="${p.id}">
        <td><strong>${this.esc(p.job_title)}</strong></td>
        <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${this.esc(p.ofo_code) || '-'}</code></td>
        <td>${this.esc(p.occupation) || '-'}</td>
        <td>${this.esc(p.employee_type_name) || '<span style="color:var(--text-muted)">Not set</span>'}</td>
        <td>${this.esc(p.salary_transaction_group_name) || '<span style="color:var(--text-muted)">Not set</span>'}</td>
        <td>${p.grading_type === 'UPPER_LIMIT'
          ? (p.upper_limit_grading ? `<span style="font-size:11px;background:#c9a84c;color:#fff;padding:2px 6px;border-radius:3px">UL Grading ${this.esc(p.upper_limit_grading)}</span>` : '<span style="color:var(--text-muted)">Not set</span>')
          : (this.esc(p.grade_name) || '<span style="color:var(--text-muted)">Not set</span>')}</td>
        <td style="text-align:center">${p.position_count || 0}</td>
        <td><div style="display:flex;gap:4px;align-items:center">
          <button class="action-btn" data-edit-profile="${p.id}" title="Edit">${icon('edit',14)}</button>
          <button class="action-btn danger" data-del-profile="${p.id}" title="Delete">${icon('trash',14)}</button>
        </div></td>
      </tr>
    `).join('');

    el.innerHTML = `
      <div class="module-header">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:700;color:#0f2b46">Job Profiles</h2>
          <p style="margin:4px 0 0;color:var(--text-muted);font-size:13px">Define job profiles with classification, TASK grades, salary transaction groups, OFO codes, and skills planning. Positions are linked to job profiles.</p>
        </div>
      </div>
      ${UI.statCards([
        { value: profiles.length, label: 'Total Profiles', color: '#0f2b46' },
        { value: profiles.filter(p => p.task_grade_id || p.upper_limit_id).length, label: 'With Grading', color: '#2e7d32' },
        { value: profiles.filter(p => p.salary_transaction_group_id).length, label: 'With Sal Trans Group', color: '#c9a84c' },
        { value: profiles.reduce((s, p) => s + parseInt(p.position_count || 0), 0), label: 'Linked Positions', color: '#0f2b46' },
      ])}
      <div class="toolbar" style="margin-bottom:16px">
        <div class="toolbar-search">
          <input type="text" placeholder="Search job profiles..." id="jp-search">
        </div>
        <div>
          <button class="btn btn-primary" id="btn-add-profile">${icon('plus',13)} Add Job Profile</button>
        </div>
      </div>
      <div class="data-grid">
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>OFO Code</th>
              <th>Occupation</th>
              <th>Employee Type</th>
              <th>Sal Trans Group</th>
              <th>Grading</th>
              <th style="text-align:center">Positions</th>
              <th style="width:80px">Actions</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">No job profiles found. Click "Add Job Profile" to create one.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-add-profile')?.addEventListener('click', () => this.showProfileModal(null));
    document.getElementById('jp-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      el.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
    el.querySelectorAll('[data-view-profile]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        this.state.selectedId = parseInt(row.dataset.viewProfile);
        this.state.view = 'detail';
        this.render(this.container);
      });
    });
    el.querySelectorAll('[data-edit-profile]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = profiles.find(pr => pr.id == btn.dataset.editProfile);
        if (p) this.showProfileModal(p);
      });
    });
    el.querySelectorAll('[data-del-profile]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = profiles.find(pr => pr.id == btn.dataset.delProfile);
        if (p) this.deleteProfile(p);
      });
    });
  },

  detailField(label, value) {
    return `<div><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px">${label}</div><div style="font-weight:600">${value || '<span style="color:var(--text-muted)">Not assigned</span>'}</div></div>`;
  },

  async renderDetail(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading profile...</div>';
    try {
      const res = await api(`/positions/job-profiles/${this.state.selectedId}`);
      const p = res.data;
      if (!p) throw new Error('Not found');

      const posRes = await api(`/positions?job_profile_id=${p.id}`);
      const positions = (posRes.data || []).filter(pos => pos.job_profile_id == p.id);

      const posRows = positions.map(pos => `
        <tr>
          <td><code style="font-size:11px;background:var(--bg-light);padding:2px 6px;border-radius:3px">${this.esc(pos.position_code)}</code></td>
          <td>${this.esc(pos.title)}</td>
          <td>${this.esc(pos.department_name) || '-'}</td>
          <td>${pos.employee_name ? this.esc(pos.employee_name) : '<span class="badge badge-warning">Vacant</span>'}</td>
          <td>${pos.status === 'ACTIVE' ? '<span class="badge badge-success">Active</span>' : `<span class="badge badge-secondary">${pos.status}</span>`}</td>
        </tr>
      `).join('');

      const yesNo = (v) => v ? '<span style="color:#2e7d32;font-weight:600">Yes</span>' : '<span style="color:var(--text-muted)">No</span>';

      el.innerHTML = `
        <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center">
          <button class="btn" id="btn-back-list">${icon('chevronLeft',13)} Back to List</button>
          <button class="btn btn-primary" id="btn-edit-detail">${icon('edit',13)} Edit Profile</button>
        </div>
        <div class="module-header">
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:700;color:#0f2b46">${this.esc(p.job_title)}</h2>
            <p style="margin:4px 0 0;color:var(--text-muted);font-size:13px">${this.esc(p.occupation) || 'No occupation specified'} ${p.ofo_code ? `| OFO: ${this.esc(p.ofo_code)}` : ''} ${p.job_description_code ? `| JD Code: ${this.esc(p.job_description_code)}` : ''}</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px">
          <div>
            <h4 style="font-size:14px;color:#0f2b46;margin:0 0 12px;display:flex;align-items:center;gap:8px">${icon('briefcase',16)} Job Details</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                ${this.detailField('Employee Type', this.esc(p.employee_type_name))}
                ${this.detailField('Start Date', this.fmtDate(p.start_date))}
                ${this.detailField('Employee Sub Type', this.esc(p.employee_subtype_name))}
                ${this.detailField('End Date', this.fmtDate(p.end_date))}
                ${this.detailField('Salary Transaction Group', this.esc(p.salary_transaction_group_name))}
                ${this.detailField('Occupation Level', this.esc(p.occupational_level))}
                ${this.detailField('Grading Type', p.grading_type === 'UPPER_LIMIT' ? 'Upper Limit' : 'TASK Grade')}
                ${this.detailField('Job Description Code', this.esc(p.job_description_code))}
                ${p.grading_type === 'UPPER_LIMIT'
                  ? this.detailField('Upper Limit', p.upper_limit_grading ? `Grading ${this.esc(p.upper_limit_grading)}` : null)
                  : this.detailField('TASK Grade', p.grade_name ? `${this.esc(p.grade_code)} - ${this.esc(p.grade_name)}` : null)}
                ${this.detailField('Disable Job Profile', p.enabled === false ? yesNo(true) : yesNo(false))}
                ${this.detailField('Allow Over Time', yesNo(p.allow_overtime))}
                ${this.detailField('Performance Assessment', yesNo(p.performance_assessment))}
              </div>
            </div>

            <h4 style="font-size:14px;color:#0f2b46;margin:20px 0 12px;display:flex;align-items:center;gap:8px">${icon('mapPin',16)} OFO Classification</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                ${this.detailField('Major Group', this.esc(p.ofo_major_group))}
                ${this.detailField('Specialist Title', this.esc(p.specialist_title))}
                ${this.detailField('Sub Major Group', this.esc(p.ofo_sub_major_group))}
                ${this.detailField('OFO Code', this.esc(p.ofo_code))}
                ${this.detailField('Minor Group', this.esc(p.ofo_minor_group))}
                ${this.detailField('Occupation', this.esc(p.occupation))}
                ${this.detailField('Unit Group', this.esc(p.ofo_unit_group))}
              </div>
            </div>
          </div>

          <div>
            <h4 style="font-size:14px;color:#0f2b46;margin:0 0 12px;display:flex;align-items:center;gap:8px">${icon('fileText',16)} Job Duties and Responsibilities</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="margin-bottom:12px"><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Job Purpose</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.job_purpose) || 'Not specified'}</div></div>
              <div><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Key Responsibilities</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.job_responsibility) || 'Not specified'}</div></div>
            </div>

            <h4 style="font-size:14px;color:#0f2b46;margin:20px 0 12px;display:flex;align-items:center;gap:8px">${icon('target',16)} Skills Planning (WSP)</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                ${this.detailField('Employment Category', this.esc(p.employment_category))}
                ${this.detailField('Employment Code', this.esc(p.employment_code))}
                ${this.detailField('Work Area', this.esc(p.work_area))}
              </div>
            </div>

            <h4 style="font-size:14px;color:#0f2b46;margin:20px 0 12px;display:flex;align-items:center;gap:8px">${icon('award',16)} Requirements</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px">
              <div style="margin-bottom:12px"><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Qualifications</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.qualifications_required) || 'Not specified'}</div></div>
              <div style="margin-bottom:12px"><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Experience</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.experience_required) || 'Not specified'}</div></div>
              <div style="margin-bottom:12px"><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Knowledge</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.knowledge) || 'Not specified'}</div></div>
              <div><div style="font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">Skills</div><div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${this.esc(p.skills) || 'Not specified'}</div></div>
            </div>

            <h4 style="font-size:14px;color:#0f2b46;margin:20px 0 12px;display:flex;align-items:center;gap:8px">${icon('shield',16)} Authority</h4>
            <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div><span style="font-size:12px;color:var(--text-muted)">Can Draft Policies:</span> <strong>${yesNo(p.can_draft_policies)}</strong></div>
              <div><span style="font-size:12px;color:var(--text-muted)">Contractual Agreements:</span> <strong>${yesNo(p.contractual_agreements)}</strong></div>
            </div>
          </div>
        </div>

        <h4 style="font-size:14px;color:#0f2b46;margin:24px 0 12px;display:flex;align-items:center;gap:8px">${icon('users',16)} Linked Positions (${positions.length})</h4>
        <div class="data-grid">
          <table>
            <thead><tr><th>Code</th><th>Title</th><th>Department</th><th>Incumbent</th><th>Status</th></tr></thead>
            <tbody>${posRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No positions linked to this job profile</td></tr>'}</tbody>
          </table>
        </div>
      `;

      document.getElementById('btn-back-list')?.addEventListener('click', () => {
        this.state.view = 'list';
        this.state.selectedId = null;
        this.render(this.container);
      });
      document.getElementById('btn-edit-detail')?.addEventListener('click', () => this.showProfileModal(p));
    } catch (err) {
      el.innerHTML = `<div class="empty-state">${icon('alertTriangle',32)}<p>Failed to load profile: ${err.message}</p><button class="btn" onclick="JobProfilesModule.state.view='list';JobProfilesModule.render(JobProfilesModule.container)">Back to List</button></div>`;
    }
  },

  async showProfileModal(existing) {
    await this.loadLookups();

    const gradeOpts = this.state.taskGrades.map(g => ({ value: g.id, label: `${g.grade_code} - ${g.grade_name}` }));
    const typeOpts = this.state.employeeTypes.map(t => ({ value: t.id, label: t.name }));
    const selectedTypeId = existing?.employee_type_id || '';
    const filteredSubtypeOpts = selectedTypeId
      ? this.state.employeeSubtypes.filter(s => s.employee_type_id == selectedTypeId).map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
      : [];
    const cosOpts = this.state.conditions.map(c => ({ value: c.id, label: c.name }));
    const stgOpts = this.state.salTransGroups.map(g => ({ value: g.id, label: g.name }));
    const ulOpts = this.state.upperLimits.map(u => ({ value: u.id, label: `${u.municipal_grading} - ${u.employee_subtype_name || ''} (${u.minimum_value}-${u.maximum_value})` }));
    const profileOpts = this.state.profiles.filter(p => !existing || p.id !== existing.id).map(p => ({ value: p.id, label: p.job_title }));

    const occLevelOpts = [
      { value: 'Top Management', label: 'Top Management' },
      { value: 'Senior Management', label: 'Senior Management' },
      { value: 'Professionally Qualified', label: 'Professionally Qualified' },
      { value: 'Skilled Technical', label: 'Skilled Technical' },
      { value: 'Semi-Skilled', label: 'Semi-Skilled' },
      { value: 'Unskilled', label: 'Unskilled' },
    ];

    const formHtml = UI.buildForm([
      { type: 'section', label: 'Job Details', icon: icon('briefcase',16) },
      { id: 'jp_title', label: 'Job Title', type: 'text', value: existing?.job_title || '', required: true },
      { id: 'jp_reports_to', label: 'Reports To (Job Profile)', type: 'select', value: existing?.reports_to_job_profile_id || '', options: profileOpts },
      { id: 'jp_emp_type', label: 'Employee Type', type: 'select', value: existing?.employee_type_id || '', options: typeOpts, required: true },
      { id: 'jp_start_date', label: 'Start Date', type: 'date', value: existing?.start_date ? existing.start_date.substring(0,10) : '' },
      { id: 'jp_emp_subtype', label: 'Employee Sub Type', type: 'select', value: existing?.employee_subtype_id || '', options: filteredSubtypeOpts, required: true },
      { id: 'jp_end_date', label: 'End Date', type: 'date', value: existing?.end_date ? existing.end_date.substring(0,10) : '' },
      { id: 'jp_sal_trans_group', label: 'Salary Transaction Group', type: 'select', value: existing?.salary_transaction_group_id || '', options: stgOpts, required: true },
      { id: 'jp_occ_level', label: 'Occupation Level', type: 'select', value: existing?.occupational_level || '', options: occLevelOpts },
      { id: 'jp_grading_type', label: 'Grading Type', type: 'select', value: existing?.grading_type || 'TASK_GRADE', options: [
        { value: 'TASK_GRADE', label: 'TASK Grade' },
        { value: 'UPPER_LIMIT', label: 'Upper Limit' }
      ], required: true },
      { id: 'jp_jd_code', label: 'Job Description Code', type: 'text', value: existing?.job_description_code || '' },
      { id: 'jp_grade', label: 'TASK Grade', type: 'select', value: existing?.task_grade_id || '', options: gradeOpts },
      { id: 'jp_upper_limit', label: 'Upper Limit', type: 'select', value: existing?.upper_limit_id || '', options: ulOpts },
      { id: 'jp_cos', label: 'Conditions of Service', type: 'select', value: existing?.condition_of_service_id || '', options: cosOpts },
      { id: 'jp_allow_ot', label: 'Allow Over Time', type: 'checkbox', value: existing?.allow_overtime || false, checkLabel: 'Employees on this profile may work overtime' },
      { id: 'jp_perf_assess', label: 'Performance Assessment', type: 'checkbox', value: existing?.performance_assessment || false, checkLabel: 'Subject to performance assessment' },

      { type: 'section', label: 'OFO Classification', icon: icon('mapPin',16) },
      { id: 'jp_ofo_major', label: 'Major Group', type: 'text', value: existing?.ofo_major_group || '', placeholder: 'e.g. 1 - MANAGERS' },
      { id: 'jp_specialist_title', label: 'Specialist Title', type: 'text', value: existing?.specialist_title || '' },
      { id: 'jp_ofo_sub_major', label: 'Sub Major Group', type: 'text', value: existing?.ofo_sub_major_group || '', placeholder: 'e.g. 12 - Administrative and Commercial' },
      { id: 'jp_ofo', label: 'OFO Code', type: 'text', value: existing?.ofo_code || '', placeholder: 'e.g. 121101' },
      { id: 'jp_ofo_minor', label: 'Minor Group', type: 'text', value: existing?.ofo_minor_group || '', placeholder: 'e.g. 121 - Business Services and Admin' },
      { id: 'jp_occupation', label: 'Occupation', type: 'text', value: existing?.occupation || '' },
      { id: 'jp_ofo_unit', label: 'Unit Group', type: 'text', value: existing?.ofo_unit_group || '', placeholder: 'e.g. 1211 - Finance Managers' },

      { type: 'section', label: 'Skills Planning (WSP)', icon: icon('target',16) },
      { id: 'jp_emp_category', label: 'Employment Category', type: 'text', value: existing?.employment_category || '', placeholder: 'e.g. SOC 100 Legislators' },
      { id: 'jp_emp_code', label: 'Employment Code', type: 'text', value: existing?.employment_code || '', placeholder: 'e.g. Executive Mayor' },
      { id: 'jp_work_area', label: 'Work Area', type: 'text', value: existing?.work_area || '' },

      { type: 'section', label: 'Job Duties and Responsibilities', icon: icon('fileText',16) },
      { id: 'jp_purpose', label: 'Job Purpose', type: 'textarea', value: existing?.job_purpose || '', fullWidth: true },
      { id: 'jp_responsibility', label: 'Key Responsibilities', type: 'textarea', value: existing?.job_responsibility || '', fullWidth: true },

      { type: 'section', label: 'Requirements', icon: icon('award',16) },
      { id: 'jp_qualifications', label: 'Qualifications Required', type: 'textarea', value: existing?.qualifications_required || '', fullWidth: true },
      { id: 'jp_experience', label: 'Experience Required', type: 'textarea', value: existing?.experience_required || '', fullWidth: true },
      { id: 'jp_knowledge', label: 'Knowledge', type: 'textarea', value: existing?.knowledge || '', fullWidth: true },
      { id: 'jp_skills', label: 'Skills', type: 'textarea', value: existing?.skills || '', fullWidth: true },

      { type: 'section', label: 'Authority', icon: icon('shield',16) },
      { id: 'jp_draft_policies', label: 'Can Draft Policies', type: 'checkbox', value: existing?.can_draft_policies || false, checkLabel: 'This role can draft policies' },
      { id: 'jp_contracts', label: 'Contractual Agreements', type: 'checkbox', value: existing?.contractual_agreements || false, checkLabel: 'This role handles contractual agreements' },
    ]);

    UI.modal({
      title: existing ? `Edit: ${existing.job_title}` : 'Add Job Profile',
      size: 'xl',
      content: `<div class="form-grid">${formHtml}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-profile">${existing ? 'Update' : 'Create'}</button>`
    });

    const empTypeEl = document.getElementById('jp_emp_type');
    const empSubtypeEl = document.getElementById('jp_emp_subtype');
    if (empTypeEl && empSubtypeEl) {
      empTypeEl.addEventListener('change', () => {
        const typeId = empTypeEl.value;
        const filtered = typeId
          ? this.state.employeeSubtypes.filter(s => s.employee_type_id == typeId)
          : [];
        const prevVal = empSubtypeEl.value;
        empSubtypeEl.innerHTML = '<option value="">-- Select --</option>' +
          filtered.map(s => `<option value="${s.id}"${s.id == prevVal ? ' selected' : ''}>${s.name} (${s.code})</option>`).join('');
      });
    }

    const gradingTypeEl = document.getElementById('jp_grading_type');
    const gradeRow = document.getElementById('jp_grade')?.closest('.form-group');
    const ulRow = document.getElementById('jp_upper_limit')?.closest('.form-group');
    const toggleGradingFields = () => {
      const gt = gradingTypeEl?.value;
      if (gradeRow) gradeRow.style.display = gt === 'TASK_GRADE' ? '' : 'none';
      if (ulRow) ulRow.style.display = gt === 'UPPER_LIMIT' ? '' : 'none';
    };
    toggleGradingFields();
    gradingTypeEl?.addEventListener('change', toggleGradingFields);

    document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
      const gv = (id) => document.getElementById(id)?.value || '';
      const gc = (id) => document.getElementById(id)?.checked || false;
      const gi = (id) => { const v = gv(id); return v ? parseInt(v) : null; };
      const gradingType = gv('jp_grading_type') || 'TASK_GRADE';
      const payload = {
        job_title: gv('jp_title'),
        reports_to_job_profile_id: gi('jp_reports_to'),
        employee_type_id: gi('jp_emp_type'),
        employee_subtype_id: gi('jp_emp_subtype'),
        salary_transaction_group_id: gi('jp_sal_trans_group'),
        condition_of_service_id: gi('jp_cos'),
        task_grade_id: gradingType === 'TASK_GRADE' ? gi('jp_grade') : null,
        upper_limit_id: gradingType === 'UPPER_LIMIT' ? gi('jp_upper_limit') : null,
        grading_type: gradingType,
        occupational_level: gv('jp_occ_level') || null,
        link_task_grade: gradingType === 'TASK_GRADE',
        allow_overtime: gc('jp_allow_ot'),
        performance_assessment: gc('jp_perf_assess'),
        start_date: gv('jp_start_date') || null,
        end_date: gv('jp_end_date') || null,
        job_description_code: gv('jp_jd_code') || null,
        specialist_title: gv('jp_specialist_title') || null,
        ofo_code: gv('jp_ofo') || null,
        occupation: gv('jp_occupation') || null,
        ofo_major_group: gv('jp_ofo_major') || null,
        ofo_sub_major_group: gv('jp_ofo_sub_major') || null,
        ofo_minor_group: gv('jp_ofo_minor') || null,
        ofo_unit_group: gv('jp_ofo_unit') || null,
        employment_category: gv('jp_emp_category') || null,
        employment_code: gv('jp_emp_code') || null,
        work_area: gv('jp_work_area') || null,
        job_purpose: gv('jp_purpose') || null,
        job_responsibility: gv('jp_responsibility') || null,
        qualifications_required: gv('jp_qualifications') || null,
        experience_required: gv('jp_experience') || null,
        knowledge: gv('jp_knowledge') || null,
        skills: gv('jp_skills') || null,
        can_draft_policies: gc('jp_draft_policies'),
        contractual_agreements: gc('jp_contracts'),
        job_family: null,
      };
      if (!payload.job_title) { UI.toast('error', 'Validation', 'Job title is required'); return; }

      try {
        const url = existing ? `${API_BASE}/positions/job-profiles/${existing.id}` : `${API_BASE}/positions/job-profiles`;
        const method = existing ? 'PUT' : 'POST';
        const resp = await fetch(url, {
          method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Save failed');
        UI.closeModal();
        UI.toast('success', existing ? 'Updated' : 'Created', `Job profile "${payload.job_title}" saved successfully`);
        this.render(this.container);
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async deleteProfile(profile) {
    UI.modal({
      title: 'Delete Job Profile',
      content: `<p>Are you sure you want to delete <strong>${this.esc(profile.job_title)}</strong>?</p>
        ${parseInt(profile.position_count) > 0 ? `<p style="color:var(--danger);font-size:12px">${icon('alertTriangle',12)} This profile has ${profile.position_count} linked position(s). Deletion will fail until all positions are unlinked.</p>` : ''}`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-confirm-del-profile" style="background:var(--danger)">Delete</button>`
    });
    document.getElementById('btn-confirm-del-profile')?.addEventListener('click', async () => {
      try {
        const resp = await fetch(`${API_BASE}/positions/job-profiles/${profile.id}`, { method: 'DELETE' });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Delete failed');
        UI.closeModal();
        UI.toast('success', 'Deleted', `"${profile.job_title}" removed`);
        this.render(this.container);
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  }
};
