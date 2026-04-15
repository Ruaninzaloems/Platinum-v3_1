const RecruitmentModule = {
  state: { activeTab: 'vacancies' },

  async render(el) {
    el.innerHTML = `
      <div class="module-tabs">
        <div class="detail-tab active" data-rctab="vacancies">${icon('briefcase',14)} Vacancies</div>
        <div class="detail-tab" data-rctab="organogram">${icon('grid',14)} From Organogram</div>
        <div class="detail-tab" data-rctab="applicants">${icon('users',14)} Applicants</div>
        <div class="detail-tab" data-rctab="interviews">${icon('calendar',14)} Interview Scheduling</div>
        <div class="detail-tab" data-rctab="onboarding">${icon('clipboard',14)} Onboarding</div>
        <div class="detail-tab" data-rctab="pipeline">${icon('barChart',14)} Pipeline Dashboard</div>
        <div class="detail-tab" data-rctab="scoring">${icon('star',14)} Scoring</div>
        <div class="detail-tab" data-rctab="probation">${icon('alertTriangle',14)} Probation Alerts</div>
      </div>
      <div id="recruit-content"></div>
    `;
    el.querySelectorAll('[data-rctab]').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.state.activeTab = tab.dataset.rctab;
        this.loadTab();
      });
    });
    this.loadTab();
  },

  async loadTab() {
    const el = document.getElementById('recruit-content');
    if (!el) return;
    if (this.state.activeTab === 'vacancies') await this.renderVacancies(el);
    else if (this.state.activeTab === 'organogram') await this.renderOrganogramVacancies(el);
    else if (this.state.activeTab === 'applicants') await this.renderApplicants(el);
    else if (this.state.activeTab === 'interviews') await this.renderInterviews(el);
    else if (this.state.activeTab === 'onboarding') await this.renderOnboarding(el);
    else if (this.state.activeTab === 'pipeline') await this.renderPipeline(el);
    else if (this.state.activeTab === 'scoring') await this.renderScoring(el);
    else if (this.state.activeTab === 'probation') await this.renderProbationAlerts(el);
  },

  async renderVacancies(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/recruitment/vacancies');
      const statusColors = { DRAFT:'status-pending', OPEN:'status-processing', SHORTLISTING:'status-locked', INTERVIEWING:'status-completed', OFFERED:'status-approved', FILLED:'status-approved', CANCELLED:'status-failed' };

      const rows = data.data.map(v => `
        <tr>
          <td><strong>${v.requisition_number}</strong></td>
          <td>${v.position_title || v.title || '-'}</td>
          <td>${v.department_name || '-'}</td>
          <td>${v.salary_range_min ? 'R ' + parseFloat(v.salary_range_min).toLocaleString() + (v.salary_range_max ? ' - R ' + parseFloat(v.salary_range_max).toLocaleString() : '') : '-'}</td>
          <td>${v.closing_date ? new Date(v.closing_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td><span class="status-badge ${statusColors[v.status] || ''}">${v.status}</span></td>
          <td style="text-align:center">${v.applicant_count || 0}</td>
          <td>
            <button class="btn btn-sm" onclick="RecruitmentModule.viewVacancy(${v.id})">${icon('eye',12)}</button>
            <button class="btn btn-sm" onclick="RecruitmentModule.editVacancy(${v.id})">${icon('edit',12)}</button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('briefcase',16)} Vacancies (${data.data.length})</div>
          <button class="btn btn-primary" onclick="RecruitmentModule.addVacancy()">${icon('plus',14)} Create Vacancy</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Requisition</th><th>Position</th><th>Department</th><th>Salary Range</th><th>Closing Date</th><th>Status</th><th style="text-align:center">Applicants</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No vacancies</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async renderOrganogramVacancies(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading vacant positions...</div>';
    try {
      const data = await api('/recruitment/vacancies/from-organogram');
      const positions = data.data || [];

      const rows = positions.map(p => `
        <tr>
          <td><strong>${p.position_code}</strong></td>
          <td>${p.title || '-'}</td>
          <td>${p.department_name || '-'}</td>
          <td>${p.division_name || '-'}</td>
          <td>${p.grade_code || '-'}</td>
          <td>${p.funded ? `<span style="color:var(--success)">${icon('check',12)} Funded</span>` : `<span style="color:var(--danger)">${icon('alertTriangle',12)} Unfunded</span>`}</td>
          <td>${p.is_hod ? '<span class="status-badge status-active">HOD</span>' : '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="RecruitmentModule.createVacancyFromPosition(${p.id},'${(p.title||'').replace(/'/g,"\\'")}','${(p.department_name||'').replace(/'/g,"\\'")}','${p.position_code||''}',${p.department_id||'null'})">${icon('plus',12)} Create Vacancy</button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('grid',16)} Vacancies from Organogram (${positions.length})</div>
        </div>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#0c4a6e">
          ${icon('alertTriangle',14)} These are vacant positions in the staff establishment that do not yet have an active recruitment vacancy. Click "Create Vacancy" to start recruiting for a position.
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Position Code</th><th>Title</th><th>Department</th><th>Division</th><th>Grade</th><th>Funded</th><th>HOD</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">All vacant positions have recruitment vacancies</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async createVacancyFromPosition(positionId, title, deptName, posCode, deptId) {
    UI.modal({
      title: 'Create Vacancy from Position',
      content: `
        <div style="padding:12px">
          <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid var(--border);margin-bottom:16px">
            <div style="font-size:14px;font-weight:600">${title}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${deptName} | ${posCode}</div>
          </div>
          <div class="form-grid" id="cvp-form">
            ${UI.buildForm([
              { id: 'cvp_salary', label: 'Salary Range', type: 'text', placeholder: 'e.g. R 250,000 - R 350,000' },
              { id: 'cvp_closing', label: 'Closing Date', type: 'date' },
              { id: 'cvp_type', label: 'Employment Type', type: 'select', options: ['PERMANENT','CONTRACT','FIXED_TERM','TEMPORARY','INTERNSHIP'] },
              { id: 'cvp_requirements', label: 'Requirements', type: 'textarea', fullWidth: true },
              { id: 'cvp_description', label: 'Job Description', type: 'textarea', fullWidth: true },
            ])}
          </div>
        </div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveVacancyFromPosition(${positionId},${deptId})">Create Vacancy</button>`
    });
  },

  async saveVacancyFromPosition(positionId, deptId) {
    const d = UI.getFormData('cvp-form');
    try {
      const salaryParts = (d.cvp_salary || '').replace(/[R,\s]/g, '').split('-');
      await apiPost('/recruitment/vacancies', {
        position_id: positionId,
        department_id: deptId,
        title: '',
        salary_range_min: salaryParts[0] ? parseFloat(salaryParts[0]) : null,
        salary_range_max: salaryParts[1] ? parseFloat(salaryParts[1]) : null,
        closing_date: d.cvp_closing,
        requirements: d.cvp_requirements,
        duties: d.cvp_description
      });
      UI.closeModal();
      UI.toast('success', 'Vacancy Created', 'Recruitment vacancy created from organogram position');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async addVacancy() {
    let positions = [], departments = [];
    try {
      const [p, d] = await Promise.all([api('/positions?limit=100'), api('/departments?limit=100')]);
      positions = p.data; departments = d.data;
    } catch (e) {}
    const content = UI.buildForm([
      { id: 'rv_position', label: 'Position', type: 'select', required: true, options: positions.map(p => ({ value: p.id, label: `${p.position_code} - ${p.title}` })) },
      { id: 'rv_department', label: 'Department', type: 'select', options: departments.map(d => ({ value: d.id, label: d.name })) },
      { id: 'rv_salary', label: 'Salary Range', type: 'text', placeholder: 'e.g. R 250,000 - R 350,000' },
      { id: 'rv_closing', label: 'Closing Date', type: 'date' },
      { id: 'rv_type', label: 'Employment Type', type: 'select', options: ['PERMANENT','CONTRACT','FIXED_TERM','TEMPORARY','INTERNSHIP'] },
      { id: 'rv_requirements', label: 'Requirements', type: 'textarea', fullWidth: true },
      { id: 'rv_description', label: 'Job Description', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Create Vacancy',
      content: `<div class="form-grid" id="rv-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveVacancy()">Create</button>`
    });
  },

  async saveVacancy() {
    const d = UI.getFormData('rv-form');
    try {
      const salaryParts = (d.rv_salary || '').replace(/[R,\s]/g, '').split('-');
      await apiPost('/recruitment/vacancies', {
        position_id: parseInt(d.rv_position), department_id: d.rv_department ? parseInt(d.rv_department) : null,
        title: d.rv_position ? '' : 'Vacancy', salary_range_min: salaryParts[0] ? parseFloat(salaryParts[0]) : null,
        salary_range_max: salaryParts[1] ? parseFloat(salaryParts[1]) : null,
        closing_date: d.rv_closing, requirements: d.rv_requirements, duties: d.rv_description
      });
      UI.closeModal(); UI.toast('success', 'Vacancy Created', 'New vacancy posted');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async viewVacancy(id) {
    try {
      const data = await api(`/recruitment/vacancies/${id}`);
      const v = data.data;
      const apps = v.applicants || [];

      const appRows = apps.map(a => `
        <tr>
          <td>${a.first_name} ${a.surname}</td>
          <td>${a.id_number || '-'}</td>
          <td>${a.email || '-'}</td>
          <td>${a.phone || '-'}</td>
          <td><span class="status-badge status-${(a.status||'').toLowerCase()}">${a.status}</span></td>
          <td>${a.score !== null ? a.score : '-'}</td>
          <td>
            <button class="btn btn-sm" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'SHORTLISTED')" title="Shortlist">${icon('check',12)}</button>
            <button class="btn btn-sm" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'INTERVIEW')" title="Schedule Interview">${icon('calendar',12)}</button>
            <button class="btn btn-sm btn-success" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'APPOINTED')" title="Appoint">${icon('award',12)}</button>
            <button class="btn btn-sm" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'REJECTED')" title="Reject">${icon('trash',12)}</button>
          </td>
        </tr>
      `).join('');

      UI.modal({
        title: `Vacancy: ${v.requisition_number}`,
        content: `
          <div class="form-grid" style="margin-bottom:16px">
            <div><strong>Position:</strong> ${v.position_title || '-'}</div>
            <div><strong>Status:</strong> <span class="status-badge">${v.status}</span></div>
            <div><strong>Salary Range:</strong> ${v.salary_range_min ? 'R ' + parseFloat(v.salary_range_min).toLocaleString() + (v.salary_range_max ? ' - R ' + parseFloat(v.salary_range_max).toLocaleString() : '') : '-'}</div>
            <div><strong>Closing:</strong> ${v.closing_date ? new Date(v.closing_date).toLocaleDateString('en-ZA') : '-'}</div>
          </div>
          ${v.requirements ? `<div style="margin-bottom:12px"><strong>Requirements:</strong><p style="font-size:13px;white-space:pre-wrap">${v.requirements}</p></div>` : ''}
          <div class="section-header" style="margin-top:16px">${icon('users',14)} Applicants (${apps.length})</div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Name</th><th>ID No.</th><th>Email</th><th>Phone</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead>
              <tbody>${appRows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No applicants yet</td></tr>'}</tbody>
            </table>
          </div>
          <button class="btn btn-primary" style="margin-top:12px" onclick="RecruitmentModule.addApplicant(${v.id})">${icon('plus',14)} Add Applicant</button>
        `,
        size: 'xl'
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editVacancy(id) {
    const data = await api('/recruitment/vacancies');
    const v = data.data.find(x => x.id === id);
    if (!v) return;
    const content = UI.buildForm([
      { id: 'ev_status', label: 'Status', type: 'select', value: v.status, options: ['DRAFT','OPEN','SHORTLISTING','INTERVIEWING','OFFERED','FILLED','CANCELLED'] },
      { id: 'ev_closing', label: 'Closing Date', type: 'date', value: v.closing_date ? v.closing_date.split('T')[0] : '' },
      { id: 'ev_salary', label: 'Salary Range', type: 'text', value: v.salary_range_min ? `${v.salary_range_min}-${v.salary_range_max || ''}` : '' },
      { id: 'ev_requirements', label: 'Requirements', type: 'textarea', value: v.requirements || '', fullWidth: true },
    ]);
    UI.modal({
      title: `Edit Vacancy ${v.requisition_number}`,
      content: `<div class="form-grid" id="ev-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.updateVacancy(${id})">Update</button>`
    });
  },

  async updateVacancy(id) {
    const d = UI.getFormData('ev-form');
    try {
      await fetch(`${API_BASE}/recruitment/vacancies/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: d.ev_status, closing_date: d.ev_closing, requirements: d.ev_requirements, duties: '' })
      });
      UI.closeModal(); UI.toast('success', 'Updated', 'Vacancy updated'); this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async addApplicant(vacancyId) {
    UI.closeModal();
    const content = UI.buildForm([
      { id: 'ap_first', label: 'First Name', type: 'text', required: true },
      { id: 'ap_surname', label: 'Surname', type: 'text', required: true },
      { id: 'ap_id', label: 'SA ID Number', type: 'text' },
      { id: 'ap_email', label: 'Email', type: 'email' },
      { id: 'ap_phone', label: 'Phone', type: 'text' },
      { id: 'ap_race', label: 'Race', type: 'select', options: ['','African','Coloured','Indian','White','Other'] },
      { id: 'ap_gender', label: 'Gender', type: 'select', options: ['','Male','Female','Other'] },
      { id: 'ap_disability', label: 'Disability', type: 'checkbox' },
      { id: 'ap_qualifications', label: 'Qualifications', type: 'textarea', fullWidth: true },
      { id: 'ap_experience', label: 'Experience (years)', type: 'number' },
      { id: 'ap_notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Add Applicant',
      content: `<div class="form-grid" id="ap-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveApplicant(${vacancyId})">Submit</button>`
    });
  },

  async saveApplicant(vacancyId) {
    const d = UI.getFormData('ap-form');
    try {
      await apiPost('/recruitment/applicants', {
        vacancy_id: vacancyId, first_name: d.ap_first, surname: d.ap_surname,
        id_number: d.ap_id, email: d.ap_email, phone: d.ap_phone,
        race: d.ap_race, gender: d.ap_gender, disability: d.ap_disability,
        qualifications: d.ap_qualifications, experience_years: d.ap_experience ? parseInt(d.ap_experience) : null,
        notes: d.ap_notes
      });
      UI.closeModal(); UI.toast('success', 'Applicant Added', 'Applicant registered');
      this.viewVacancy(vacancyId);
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async updateApplicantStatus(id, status) {
    if (status === 'APPOINTED') {
      await this.confirmAppointment(id);
      return;
    }
    try {
      await fetch(`${API_BASE}/recruitment/applicants/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      UI.toast('success', 'Status Updated', `Applicant status set to ${status}`);
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async confirmAppointment(applicantId) {
    let applicant = null;
    let vacancy = null;
    try {
      const appData = await api('/recruitment/applicants');
      applicant = (appData.data || []).find(a => a.id === applicantId);
    } catch (e) {}
    if (applicant) {
      try {
        const vacData = await api(`/recruitment/vacancies/${applicant.vacancy_id}`);
        vacancy = vacData.data;
      } catch (e) {}
    }

    const posInfo = vacancy ? `
      <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin-bottom:16px">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#065f46;margin-bottom:8px;font-weight:600">Position Details</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
          <div><strong>Position:</strong> ${vacancy.position_title || '-'}</div>
          <div><strong>Department:</strong> ${vacancy.department_name || '-'}</div>
          <div><strong>Requisition:</strong> ${vacancy.requisition_number || '-'}</div>
          <div><strong>Salary Range:</strong> ${vacancy.salary_range_min ? 'R ' + parseFloat(vacancy.salary_range_min).toLocaleString() + (vacancy.salary_range_max ? ' - R ' + parseFloat(vacancy.salary_range_max).toLocaleString() : '') : '-'}</div>
        </div>
      </div>
    ` : '';

    UI.modal({
      title: 'Confirm Appointment',
      content: `
        <div style="padding:12px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:40px;height:40px;border-radius:10px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;color:#10b981;flex-shrink:0">
              ${icon('award', 20)}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text)">Appoint ${applicant ? applicant.first_name + ' ' + applicant.surname : 'Applicant'}?</div>
              <div style="font-size:12px;color:var(--text-muted)">This action will create an employee record and onboarding checklist.</div>
            </div>
          </div>
          ${posInfo}
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:13px;color:#92400e">
            ${icon('alertTriangle',14)} This will:
            <ul style="margin:8px 0 0 16px;padding:0">
              <li>Set the position status to FILLED</li>
              <li>Create an employee record from applicant data</li>
              <li>Generate an onboarding checklist</li>
              <li>Mark the vacancy as FILLED</li>
            </ul>
          </div>
        </div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="confirm-appoint-btn">${icon('award',14)} Confirm Appointment</button>
      `
    });

    document.getElementById('confirm-appoint-btn')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_BASE}/recruitment/applicants/${applicantId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPOINTED' })
        });
        const result = await res.json();
        UI.closeModal();
        if (result.employee) {
          UI.toast('success', 'Appointed', `${applicant ? applicant.first_name + ' ' + applicant.surname : 'Applicant'} has been appointed. Employee record ${result.employee.employee_code || ''} created.`);
        } else {
          UI.toast('success', 'Status Updated', 'Applicant status set to APPOINTED');
        }
        this.loadTab();
      } catch (err) { UI.toast('error', 'Error', err.message); }
    });
  },

  async renderApplicants(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';
    try {
      const data = await api('/recruitment/applicants');
      const statusColors = { APPLIED:'status-pending', SHORTLISTED:'status-processing', INTERVIEW:'status-locked', OFFERED:'status-completed', APPOINTED:'status-approved', REJECTED:'status-failed', WITHDRAWN:'status-failed' };
      const rows = data.data.map(a => `
        <tr>
          <td><strong>${a.first_name} ${a.surname}</strong></td>
          <td>${a.vacancy_title || a.position_title || '-'}</td>
          <td>${a.email || '-'}</td>
          <td>${a.phone || '-'}</td>
          <td><span class="status-badge ${statusColors[a.status] || ''}">${a.status}</span></td>
          <td>${a.applied_date ? new Date(a.applied_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td>
            <button class="btn btn-sm" onclick="RecruitmentModule.viewApplicantDetail(${a.id})" title="View Detail">${icon('eye',12)}</button>
            <button class="btn btn-sm" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'SHORTLISTED')">${icon('check',12)}</button>
            <button class="btn btn-sm" onclick="RecruitmentModule.updateApplicantStatus(${a.id},'INTERVIEW')">${icon('calendar',12)}</button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="section-header">${icon('users',16)} All Applicants (${data.data.length})</div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Name</th><th>Position</th><th>Email</th><th>Phone</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No applicants</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async renderInterviews(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading interview slots...</div>';
    try {
      const data = await api('/recruitment/interview-slots');
      const rows = (data.data || []).map(slot => {
        const statusClass = (slot.status || '').toLowerCase();
        return `
          <tr>
            <td>${slot.applicant_name || (slot.first_name ? slot.first_name + ' ' + slot.surname : '-')}</td>
            <td>${slot.position_title || '-'}</td>
            <td>${slot.interview_date ? new Date(slot.interview_date).toLocaleDateString('en-ZA') : '-'}</td>
            <td>${slot.interview_time || '-'}</td>
            <td>${slot.interviewer_name || '-'}</td>
            <td>${slot.venue || '-'}</td>
            <td><span class="status-badge status-${statusClass}">${slot.status || 'SCHEDULED'}</span></td>
            <td>
              <button class="btn btn-sm" onclick="RecruitmentModule.scoreInterview(${slot.id})">${icon('edit',12)}</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('calendar',16)} Interview Scheduling</div>
          <button class="btn btn-primary" onclick="RecruitmentModule.showScheduleInterview()">${icon('plus',14)} Schedule Interview</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Applicant</th><th>Position</th><th>Date</th><th>Time</th><th>Interviewer</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No interview slots scheduled</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async showScheduleInterview() {
    let applicants = [];
    try {
      const appData = await api('/recruitment/applicants');
      applicants = appData.data || [];
    } catch (e) {}
    const content = UI.buildForm([
      { id: 'iv_applicant_id', label: 'Applicant', type: 'select', required: true, options: applicants.map(a => ({ value: a.id, label: `${a.first_name} ${a.surname}` })) },
      { id: 'iv_date', label: 'Interview Date', type: 'date', required: true },
      { id: 'iv_time', label: 'Interview Time', type: 'text', placeholder: 'e.g. 09:00', required: true },
      { id: 'iv_interviewer', label: 'Interviewer Name', type: 'text' },
      { id: 'iv_venue', label: 'Venue', type: 'text', placeholder: 'e.g. Boardroom 2' },
      { id: 'iv_type', label: 'Interview Type', type: 'select', options: ['Panel','One-on-One','Technical','HR Screening','Final'] },
      { id: 'iv_notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ]);
    UI.modal({
      title: 'Schedule Interview',
      content: `<div class="form-grid" id="iv-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveInterview()">Schedule</button>`
    });
  },

  async saveInterview() {
    const d = UI.getFormData('iv-form');
    try {
      await apiPost('/recruitment/interview-slots', {
        applicant_id: parseInt(d.iv_applicant_id),
        interview_date: d.iv_date,
        interview_time: d.iv_time,
        interviewer_name: d.iv_interviewer,
        venue: d.iv_venue,
        interview_type: d.iv_type,
        notes: d.iv_notes,
      });
      UI.closeModal();
      UI.toast('success', 'Scheduled', 'Interview slot created');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  scoreInterview(slotId) {
    const content = UI.buildForm([
      { id: 'ivs_score', label: 'Score (1-10)', type: 'number', min: 1, max: 10 },
      { id: 'ivs_feedback', label: 'Feedback', type: 'textarea', fullWidth: true },
      { id: 'ivs_status', label: 'Status', type: 'select', options: ['SCHEDULED','COMPLETED','NO_SHOW','CANCELLED'] },
    ]);
    UI.modal({
      title: 'Update Interview Score/Feedback',
      content: `<div class="form-grid" id="ivs-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveInterviewScore(${slotId})">Update</button>`
    });
  },

  async saveInterviewScore(slotId) {
    const d = UI.getFormData('ivs-form');
    try {
      await fetch(`${API_BASE}/recruitment/interview-slots/${slotId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: d.ivs_score ? parseFloat(d.ivs_score) : null,
          feedback: d.ivs_feedback,
          status: d.ivs_status,
        })
      });
      UI.closeModal();
      UI.toast('success', 'Updated', 'Interview score updated');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderOnboarding(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading onboarding checklists...</div>';
    try {
      const data = await api('/recruitment/onboarding');
      const rows = (data.data || []).map(cl => {
        const completedItems = cl.completed_items || 0;
        const totalItems = cl.total_items || 0;
        const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        const pctColor = pct >= 75 ? '#10B981' : pct >= 50 ? '#3B82F6' : pct >= 25 ? '#F59E0B' : '#EF4444';
        return `
          <tr>
            <td>${cl.employee_name || (cl.first_name ? cl.first_name + ' ' + cl.surname : '-')}</td>
            <td>${cl.start_date ? new Date(cl.start_date).toLocaleDateString('en-ZA') : '-'}</td>
            <td style="text-align:center">${completedItems}/${totalItems}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="background:#E2E8F0;border-radius:4px;height:8px;width:100px;flex-shrink:0">
                  <div style="background:${pctColor};border-radius:4px;height:8px;width:${pct}%"></div>
                </div>
                <span style="font-weight:600;color:${pctColor}">${pct}%</span>
              </div>
            </td>
            <td><span class="status-badge status-${(cl.status||'').toLowerCase()}">${cl.status || 'IN_PROGRESS'}</span></td>
            <td>
              <button class="btn btn-sm" onclick="RecruitmentModule.viewOnboarding(${cl.id})">${icon('eye',12)}</button>
            </td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('clipboard',16)} Onboarding Checklists</div>
          <button class="btn btn-primary" onclick="RecruitmentModule.showOnboardingForm()">${icon('plus',14)} Create Checklist</button>
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Employee</th><th>Start Date</th><th style="text-align:center">Progress</th><th>Completion</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No onboarding checklists</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async showOnboardingForm() {
    let employees = [];
    try {
      const empData = await api('/employees?limit=200&sort_by=surname&sort_order=asc');
      employees = empData.data || [];
    } catch (e) {}
    const content = UI.buildForm([
      { id: 'ob_employee_id', label: 'Employee', type: 'select', required: true, options: employees.map(e => ({ value: e.id, label: `${e.employee_code} - ${e.first_name} ${e.surname}` })) },
      { id: 'ob_start_date', label: 'Start Date', type: 'date', required: true },
      { id: 'ob_items', label: 'Checklist Items (one per line)', type: 'textarea', required: true, fullWidth: true, placeholder: 'IT equipment setup\nBuilding access card\nEmail account creation\nPolicy handbook\nIntroduction to team' },
    ]);
    UI.modal({
      title: 'Create Onboarding Checklist',
      content: `<div class="form-grid" id="ob-form">${content}</div>`,
      size: 'lg',
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveOnboarding()">Create</button>`
    });
  },

  async saveOnboarding() {
    const d = UI.getFormData('ob-form');
    try {
      const items = (d.ob_items || '').split('\n').filter(i => i.trim()).map(i => i.trim());
      await apiPost('/recruitment/onboarding', {
        employee_id: parseInt(d.ob_employee_id),
        start_date: d.ob_start_date,
        items: items,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'Onboarding checklist created');
      this.loadTab();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async viewOnboarding(checklistId) {
    try {
      const data = await api(`/recruitment/onboarding/${checklistId}`);
      const cl = data.data;
      const items = cl.items || [];
      const itemRows = items.map(item => `
        <tr>
          <td>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="RecruitmentModule.toggleOnboardingItem(${checklistId}, ${item.id}, this.checked)">
              <span style="${item.completed ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${item.description || item.name || '-'}</span>
            </label>
          </td>
          <td>${item.completed_date ? new Date(item.completed_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td><span class="status-badge status-${item.completed ? 'approved' : 'pending'}">${item.completed ? 'DONE' : 'PENDING'}</span></td>
        </tr>
      `).join('');

      UI.modal({
        title: 'Onboarding Checklist',
        size: 'lg',
        content: `
          <div class="info-grid" style="margin-bottom:16px">
            <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${cl.employee_name || '-'}</div></div>
            <div class="info-item"><div class="info-label">Start Date</div><div class="info-value">${cl.start_date ? new Date(cl.start_date).toLocaleDateString('en-ZA') : '-'}</div></div>
            <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="status-badge status-${(cl.status||'').toLowerCase()}">${cl.status || 'IN_PROGRESS'}</span></div></div>
          </div>
          <div class="section-header">${icon('clipboard',14)} Checklist Items</div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Item</th><th>Completed Date</th><th>Status</th></tr></thead>
              <tbody>${itemRows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">No items</td></tr>'}</tbody>
            </table>
          </div>
        `,
        footer: `<button class="btn" data-close-modal>Close</button>`,
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async toggleOnboardingItem(checklistId, itemId, completed) {
    try {
      await fetch(`${API_BASE}/recruitment/onboarding/${checklistId}/items/${itemId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      UI.toast('success', 'Updated', completed ? 'Item marked as complete' : 'Item marked as incomplete');
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderPipeline(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading pipeline...</div>';
    try {
      const data = await api('/recruitment/pipeline');
      const pipeline = data.data || data || {};
      const stages = [
        { key: 'applied', label: 'Applied', icon: 'fileText', color: '#3B82F6' },
        { key: 'shortlisted', label: 'Shortlisted', icon: 'filter', color: '#8B5CF6' },
        { key: 'interviewed', label: 'Interviewed', icon: 'calendar', color: '#F59E0B' },
        { key: 'offered', label: 'Offered', icon: 'send', color: '#06B6D4' },
        { key: 'hired', label: 'Hired', icon: 'userCheck', color: '#10B981' },
        { key: 'rejected', label: 'Rejected', icon: 'xCircle', color: '#EF4444' }
      ];
      const total = stages.reduce((sum, s) => sum + (parseInt(pipeline[s.key]) || 0), 0) || 1;
      const cards = stages.map(s => ({
        title: s.label,
        value: parseInt(pipeline[s.key]) || 0,
        icon: s.icon
      }));
      const bars = stages.map(s => {
        const count = parseInt(pipeline[s.key]) || 0;
        const pct = Math.round((count / total) * 100);
        return `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <div style="width:100px;font-size:13px;font-weight:500;color:var(--text)">${s.label}</div>
            <div style="flex:1;background:#E2E8F0;border-radius:6px;height:24px;overflow:hidden">
              <div style="background:${s.color};height:100%;width:${pct}%;border-radius:6px;transition:width 0.3s;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;min-width:${count > 0 ? '32px' : '0'}">
                <span style="color:#fff;font-size:11px;font-weight:600">${count > 0 ? count : ''}</span>
              </div>
            </div>
            <div style="width:40px;text-align:right;font-size:13px;color:var(--text-muted)">${pct}%</div>
          </div>
        `;
      }).join('');

      el.innerHTML = `
        <div class="section-header">${icon('barChart',16)} Recruitment Pipeline Dashboard</div>
        ${UI.statCards(cards)}
        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:16px">
          <div style="font-weight:600;margin-bottom:16px;font-size:14px">${icon('barChart',14)} Pipeline Distribution</div>
          ${bars}
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async renderScoring(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading applicants...</div>';
    try {
      const data = await api('/recruitment/applicants');
      const applicants = data.data || [];
      const rows = applicants.map(a => `
        <tr>
          <td><strong>${a.first_name} ${a.surname}</strong></td>
          <td>${a.vacancy_title || a.position_title || '-'}</td>
          <td><span class="status-badge">${a.status}</span></td>
          <td>${a.score !== null && a.score !== undefined ? a.score : '-'}</td>
          <td>
            <button class="btn btn-sm" onclick="RecruitmentModule.viewApplicantDetail(${a.id})" title="View Scoring Matrix">${icon('star',12)} Scores</button>
          </td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="section-header">${icon('star',16)} Applicant Scoring</div>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#0c4a6e">
          ${icon('alertTriangle',14)} Click "Scores" to view and manage the scoring matrix for each applicant.
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Name</th><th>Position</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No applicants</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  },

  async viewApplicantDetail(applicantId) {
    try {
      const appData = await api('/recruitment/applicants');
      const applicant = (appData.data || []).find(a => a.id === applicantId);
      if (!applicant) { UI.toast('error', 'Error', 'Applicant not found'); return; }

      let scoresHtml = '';
      let totalScore = 0;
      let totalMax = 0;
      try {
        const scoresData = await api(`/recruitment/applicants/${applicantId}/scores`);
        const scores = scoresData.data || [];
        if (scores.length > 0) {
          totalScore = scores.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0);
          totalMax = scores.reduce((sum, s) => sum + (parseFloat(s.max_score) || 0), 0);
          const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
          const scoreColor = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
          const scoreRows = scores.map(s => `
            <tr>
              <td>${s.criterion || s.criteria || '-'}</td>
              <td style="text-align:center">${s.score}</td>
              <td style="text-align:center">${s.max_score}</td>
              <td style="text-align:center">${s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) + '%' : '-'}</td>
            </tr>
          `).join('');
          scoresHtml = `
            <div class="section-header" style="margin-top:16px">${icon('star',14)} Scoring Matrix</div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="font-size:24px;font-weight:700;color:${scoreColor}">${pct}%</div>
              <div style="font-size:13px;color:var(--text-muted)">Overall Score (${totalScore}/${totalMax})</div>
            </div>
            <div class="data-grid">
              <table>
                <thead><tr><th>Criterion</th><th style="text-align:center">Score</th><th style="text-align:center">Max</th><th style="text-align:center">%</th></tr></thead>
                <tbody>${scoreRows}</tbody>
              </table>
            </div>
          `;
        } else {
          scoresHtml = `
            <div class="section-header" style="margin-top:16px">${icon('star',14)} Scoring Matrix</div>
            <div style="color:var(--text-muted);font-size:13px;margin-bottom:12px">No scores recorded yet.</div>
          `;
        }
      } catch (e) {
        scoresHtml = `
          <div class="section-header" style="margin-top:16px">${icon('star',14)} Scoring Matrix</div>
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:12px">No scores recorded yet.</div>
        `;
      }

      UI.modal({
        title: `Applicant: ${applicant.first_name} ${applicant.surname}`,
        size: 'lg',
        content: `
          <div class="form-grid" style="margin-bottom:16px">
            <div><strong>Position:</strong> ${applicant.vacancy_title || applicant.position_title || '-'}</div>
            <div><strong>Status:</strong> <span class="status-badge">${applicant.status}</span></div>
            <div><strong>Email:</strong> ${applicant.email || '-'}</div>
            <div><strong>Phone:</strong> ${applicant.phone || '-'}</div>
            <div><strong>ID Number:</strong> ${applicant.id_number || '-'}</div>
            <div><strong>Applied:</strong> ${applicant.applied_date ? new Date(applicant.applied_date).toLocaleDateString('en-ZA') : '-'}</div>
          </div>
          ${scoresHtml}
          <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="RecruitmentModule.showAddScore(${applicantId})">${icon('plus',14)} Add Score</button>
            <button class="btn btn-primary" onclick="RecruitmentModule.generateOfferLetter(${applicantId})">${icon('fileText',14)} Generate Offer Letter</button>
          </div>
        `,
        footer: `<button class="btn" data-close-modal>Close</button>`
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  showAddScore(applicantId) {
    UI.closeModal();
    const content = UI.buildForm([
      { id: 'sc_criterion', label: 'Criterion', type: 'text', required: true, placeholder: 'e.g. Technical Skills' },
      { id: 'sc_score', label: 'Score', type: 'number', required: true, min: 0 },
      { id: 'sc_max_score', label: 'Max Score', type: 'number', required: true, min: 1 },
    ]);
    UI.modal({
      title: 'Add Score',
      content: `<div class="form-grid" id="sc-form">${content}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="RecruitmentModule.saveScore(${applicantId})">Save Score</button>`
    });
  },

  async saveScore(applicantId) {
    const d = UI.getFormData('sc-form');
    try {
      await apiPost(`/recruitment/applicants/${applicantId}/scores`, {
        criterion: d.sc_criterion,
        score: parseFloat(d.sc_score),
        max_score: parseFloat(d.sc_max_score)
      });
      UI.closeModal();
      UI.toast('success', 'Score Added', 'Score has been recorded');
      this.viewApplicantDetail(applicantId);
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  generateOfferLetter(applicantId) {
    window.open(API_BASE + `/recruitment/applicants/${applicantId}/offer-letter`);
  },

  async renderProbationAlerts(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading probation alerts...</div>';
    try {
      const data = await api('/employees/probation-alerts');
      const employees = data.data || [];
      const rows = employees.map(e => `
        <tr>
          <td><strong>${e.employee_code || '-'}</strong></td>
          <td>${e.first_name || ''} ${e.surname || ''}</td>
          <td>${e.department_name || '-'}</td>
          <td>${e.position_title || '-'}</td>
          <td>${e.probation_end_date ? new Date(e.probation_end_date).toLocaleDateString('en-ZA') : '-'}</td>
          <td>${e.days_remaining !== undefined ? `<span style="color:${e.days_remaining <= 7 ? 'var(--danger)' : e.days_remaining <= 30 ? '#F59E0B' : 'var(--success)'};font-weight:600">${e.days_remaining} days</span>` : '-'}</td>
          <td><span class="status-badge ${e.days_remaining <= 7 ? 'status-failed' : e.days_remaining <= 30 ? 'status-pending' : 'status-approved'}">${e.days_remaining <= 7 ? 'URGENT' : e.days_remaining <= 30 ? 'SOON' : 'OK'}</span></td>
        </tr>
      `).join('');

      el.innerHTML = `
        <div class="section-header">${icon('alertTriangle',16)} Probation Period Alerts</div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;color:#92400e">
          ${icon('alertTriangle',14)} Employees approaching the end of their probation period.
        </div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Employee Code</th><th>Name</th><th>Department</th><th>Position</th><th>Probation End</th><th>Days Remaining</th><th>Urgency</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No probation alerts</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) { el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`; }
  }
};
