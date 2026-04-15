const EmployeeModule = {
  state: {
    employees: [],
    departments: [],
    positions: [],
    taskGrades: [],
    employeeTypes: [],
    salaryHeads: [],
    page: 1,
    limit: 20,
    total: 0,
    search: '',
    filterDept: '',
    filterStatus: '',
    filterGrade: '',
    sortBy: 'surname',
    sortOrder: 'asc',
    currentEmployee: null,
    activeDetailTab: 'personal',
  },

  async init(container) {
    this.container = container;
    await this.loadReferenceData();
    await this.renderList();
  },

  async loadReferenceData() {
    try {
      const [depts, grades] = await Promise.all([
        api('/departments'),
        api('/positions/task-grades'),
      ]);
      this.state.departments = depts.data || [];
      this.state.taskGrades = grades.data || [];
    } catch (e) {
      console.error('Failed to load reference data:', e);
    }
  },

  async fetchEmployees() {
    const params = new URLSearchParams({
      page: this.state.page,
      limit: this.state.limit,
      sort_by: this.state.sortBy,
      sort_order: this.state.sortOrder,
    });
    if (this.state.search) params.set('search', this.state.search);
    if (this.state.filterDept) params.set('department_id', this.state.filterDept);
    if (this.state.filterStatus) params.set('status', this.state.filterStatus);
    const data = await api(`/employees?${params}`);
    this.state.employees = data.data;
    this.state.total = data.meta.total;
    return data;
  },

  async renderList() {
    this.container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading employees...</div>';
    try {
      await this.fetchEmployees();
      const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
      const statusOpts = [
        { value: '', label: 'All Statuses' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'SUSPENDED', label: 'Suspended' },
        { value: 'TERMINATED', label: 'Terminated' },
        { value: 'DECEASED', label: 'Deceased' },
      ];
      const deptFilterOpts = [{ value: '', label: 'All Departments' }, ...deptOpts];

      const stats = this.getStats();

      const rows = this.state.employees.map(emp => `
        <tr class="clickable-row" data-emp-id="${emp.id}">
          <td><strong>${this.esc(emp.employee_code)}</strong></td>
          <td>${this.esc(emp.title || '')} ${this.esc(emp.first_name)} ${this.esc(emp.surname)}${this.getProbationBadge(emp)}</td>
          <td>${this.esc(emp.id_number || '-')}</td>
          <td>${this.esc(emp.position_title || '-')}</td>
          <td>${this.esc(emp.department_name || '-')}</td>
          <td>${formatCurrency(emp.annual_salary)}</td>
          <td><span class="status-badge status-${(emp.status || '').toLowerCase()}">${this.esc(emp.status || '')}</span></td>
          <td>
            <div class="action-bar">
              <button class="action-btn" data-action="view" data-id="${emp.id}" title="View">${icon('eye',14)}</button>
              <button class="action-btn" data-action="edit" data-id="${emp.id}" title="Edit">${icon('edit',14)}</button>
              ${emp.status === 'ACTIVE' ? `<button class="action-btn danger" data-action="terminate" data-id="${emp.id}" title="Terminate">${icon('trash',14)}</button>` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      let probationAlerts = [];
      try {
        const probRes = await api('/employees/probation-alerts');
        probationAlerts = probRes.data || [];
      } catch (e) {
        probationAlerts = this.state.employees.filter(e => {
          if (e.status !== 'ACTIVE') return false;
          if (e.probation_status === 'ON_PROBATION') return true;
          const probEnd = e.probation_end_date || e.probation_end;
          if (!probEnd) return false;
          const end = new Date(probEnd);
          const now = new Date();
          return !isNaN(end) && end >= now && Math.ceil((end - now) / (1000 * 60 * 60 * 24)) <= 30;
        });
      }

      this.container.innerHTML = `
        ${UI.statCards([
          { value: stats.total, label: 'Total Employees', color: '#6C7AE0' },
          { value: stats.active, label: 'Active', color: '#68D391' },
          { value: stats.terminated, label: 'Terminated', color: '#FC8181' },
          { value: formatCurrency(stats.totalSalary), label: 'Annual CoE', color: '#B794F4' },
        ])}
        ${probationAlerts.length > 0 ? `
          <div style="background:#fdf8e8;border:1px solid #c9a84c;border-radius:8px;padding:12px 16px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#0f2b46">
              ${icon('clock',14)} Probation Alerts - ${probationAlerts.length} employee${probationAlerts.length !== 1 ? 's' : ''} nearing probation end
            </div>
            ${probationAlerts.length <= 10 ? `
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                ${probationAlerts.map(e => {
                  const probEnd = e.probation_end_date || e.probation_end;
                  const daysLeft = probEnd ? Math.ceil((new Date(probEnd) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                  const daysLabel = daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft}d)` : '';
                  return `<span class="badge badge-warning" style="cursor:pointer;font-size:11px" data-action="view" data-id="${e.id}">${this.esc(e.first_name)} ${this.esc(e.surname)}${daysLabel}</span>`;
                }).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        <div class="toolbar">
          <div class="toolbar-search">
            <input type="text" placeholder="Search by name, code, or ID number..." id="emp-search" value="${this.esc(this.state.search)}">
          </div>
          <div class="toolbar-filter">
            <select id="emp-filter-dept">
              ${deptFilterOpts.map(o => `<option value="${o.value}" ${this.state.filterDept == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
            <select id="emp-filter-status">
              ${statusOpts.map(o => `<option value="${o.value}" ${this.state.filterStatus == o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <button class="btn" id="btn-import-employees">${icon('upload',14)} Import Employees</button>
          <button class="btn btn-primary" id="btn-add-employee">${icon('plus',14)} Add Employee</button>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>ID Number</th><th>Position</th><th>Department</th><th>Annual Salary</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">No employees found</td></tr>'}</tbody>
          </table>
        </div>
        ${UI.pagination({
          page: this.state.page,
          limit: this.state.limit,
          total: this.state.total,
          onPageChange: 'EmployeeModule.goToPage',
        })}
      `;

      this.bindListEvents();
    } catch (err) {
      this.container.innerHTML = `<div class="loading" style="color:var(--danger)">Failed to load employees: ${err.message}</div>`;
    }
  },

  getStats() {
    const emps = this.state.employees;
    return {
      total: this.state.total,
      active: emps.filter(e => e.status === 'ACTIVE').length,
      terminated: emps.filter(e => e.status === 'TERMINATED').length,
      totalSalary: emps.reduce((s, e) => s + (parseFloat(e.annual_salary) || 0), 0),
    };
  },

  bindListEvents() {
    const searchInput = document.getElementById('emp-search');
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.state.search = searchInput.value;
          this.state.page = 1;
          this.renderList();
        }, 400);
      });
    }

    const deptFilter = document.getElementById('emp-filter-dept');
    if (deptFilter) {
      deptFilter.addEventListener('change', () => {
        this.state.filterDept = deptFilter.value;
        this.state.page = 1;
        this.renderList();
      });
    }

    const statusFilter = document.getElementById('emp-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.state.filterStatus = statusFilter.value;
        this.state.page = 1;
        this.renderList();
      });
    }

    const addBtn = document.getElementById('btn-add-employee');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddModal());
    }

    const importBtn = document.getElementById('btn-import-employees');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.showImportModal());
    }

    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'view') this.showDetail(id);
        else if (action === 'edit') this.showEditModal(id);
        else if (action === 'terminate') this.showTerminateModal(id);
      });
    });

    this.container.querySelectorAll('.clickable-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.dataset.empId);
        this.showDetail(id);
      });
    });
  },

  goToPage(page) {
    this.state.page = page;
    this.renderList();
  },

  validateSAID(idNumber) {
    if (!idNumber || idNumber.length !== 13) return { valid: false, message: 'SA ID must be 13 digits' };
    if (!/^\d{13}$/.test(idNumber)) return { valid: false, message: 'SA ID must contain only digits' };

    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    if (month < 1 || month > 12) return { valid: false, message: 'Invalid month in ID number' };
    if (day < 1 || day > 31) return { valid: false, message: 'Invalid day in ID number' };

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNumber[i]);
      if (i % 2 !== 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== parseInt(idNumber[12])) return { valid: false, message: 'Invalid ID number (checksum failed)' };

    const fullYear = year >= 0 && year <= 25 ? 2000 + year : 1900 + year;
    const gender = parseInt(idNumber.substring(6, 10)) >= 5000 ? 'Male' : 'Female';
    const dob = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return { valid: true, dob, gender };
  },

  validateEmail(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    if (!phone) return true;
    return /^[\d\s\+\-\(\)]{10,15}$/.test(phone);
  },

  showAddModal() {
    const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
    const gradeOpts = this.state.taskGrades.map(g => ({ value: g.id, label: `${g.grade_code} - ${g.grade_name}` }));
    const genderOpts = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const titleOpts = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Adv', 'Rev'].map(t => ({ value: t, label: t }));
    const raceOpts = ['African', 'Coloured', 'Indian', 'White', 'Other'].map(r => ({ value: r, label: r }));
    const maritalOpts = ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Union'].map(m => ({ value: m, label: m }));
    const bankTypeOpts = ['Cheque/Current', 'Savings', 'Transmission'].map(b => ({ value: b, label: b }));
    const provinceOpts = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'].map(p => ({ value: p, label: p }));

    const fields = UI.buildForm([
      { type: 'section', label: 'Personal Details', icon: icon('user',16) },
      { id: 'add_employee_code', label: 'Employee Code', required: true, placeholder: 'e.g. EMP001' },
      { id: 'add_id_number', label: 'SA ID Number', required: true, maxlength: 13, placeholder: '13-digit SA ID', hint: 'Auto-fills DOB & Gender' },
      { id: 'add_title', label: 'Title', type: 'select', options: titleOpts },
      { id: 'add_first_name', label: 'First Name', required: true },
      { id: 'add_second_name', label: 'Second Name' },
      { id: 'add_surname', label: 'Surname', required: true },
      { id: 'add_known_as', label: 'Known As' },
      { id: 'add_initials', label: 'Initials', maxlength: 5 },
      { id: 'add_date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { id: 'add_gender', label: 'Gender', type: 'select', options: genderOpts, required: true },
      { id: 'add_race', label: 'Race', type: 'select', options: raceOpts },
      { id: 'add_nationality', label: 'Nationality', value: 'South African' },
      { id: 'add_language', label: 'Home Language' },
      { id: 'add_marital_status', label: 'Marital Status', type: 'select', options: maritalOpts },
      { id: 'add_dependants', label: 'Dependants', type: 'number', min: 0, value: 0 },
      { id: 'add_disability_status', label: 'Disability Status', value: 'None' },

      { type: 'section', label: 'Contact Details', icon: icon('link',16) },
      { id: 'add_email_address', label: 'Email Address', type: 'email', placeholder: 'employee@municipality.gov.za' },
      { id: 'add_cell_number', label: 'Cell Number', placeholder: '0XX XXX XXXX' },
      { id: 'add_home_number', label: 'Home Number' },
      { id: 'add_work_number', label: 'Work Number' },

      { type: 'section', label: 'Employment Details', icon: icon('briefcase',16) },
      { id: 'add_joining_date', label: 'Joining Date', type: 'date', required: true },
      { id: 'add_income_tax_number', label: 'Income Tax Number', placeholder: 'SARS Tax Ref' },
      { id: 'add_task_grade_id', label: 'TASK Grade', type: 'select', options: gradeOpts },
      { id: 'add_current_notch', label: 'Notch', type: 'number', min: 1, placeholder: 'Notch number' },
      { id: 'add_annual_salary', label: 'Annual Salary (R)', type: 'number', min: 0, step: '0.01', required: true },

      { type: 'section', label: 'Physical Address', icon: icon('home',16) },
      { id: 'add_physical_address_1', label: 'Address Line 1' },
      { id: 'add_physical_address_2', label: 'Address Line 2' },
      { id: 'add_physical_city', label: 'City' },
      { id: 'add_physical_province', label: 'Province', type: 'select', options: provinceOpts },
      { id: 'add_physical_postal_code', label: 'Postal Code', maxlength: 4 },

      { type: 'section', label: 'Postal Address', icon: icon('file',16) },
      { id: 'add_postal_address_1', label: 'Address Line 1' },
      { id: 'add_postal_address_2', label: 'Address Line 2' },
      { id: 'add_postal_city', label: 'City' },
      { id: 'add_postal_province', label: 'Province', type: 'select', options: provinceOpts },
      { id: 'add_postal_code', label: 'Postal Code', maxlength: 4 },

      { type: 'section', label: 'Banking Details', icon: icon('creditCard',16) },
      { id: 'add_bank_name', label: 'Bank Name', placeholder: 'e.g. ABSA, FNB, Nedbank, Standard Bank' },
      { id: 'add_bank_branch_code', label: 'Branch Code', maxlength: 6 },
      { id: 'add_bank_account_number', label: 'Account Number' },
      { id: 'add_bank_account_type', label: 'Account Type', type: 'select', options: bankTypeOpts },
      { id: 'add_bank_account_holder', label: 'Account Holder Name' },
    ]);

    const overlay = UI.modal({
      title: 'Add New Employee',
      size: 'lg',
      content: `<div class="form-grid" id="add-employee-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-save-employee">Save Employee</button>
      `,
    });

    const idInput = document.getElementById('add_id_number');
    if (idInput) {
      idInput.addEventListener('blur', () => {
        const result = this.validateSAID(idInput.value);
        if (result.valid) {
          const dobField = document.getElementById('add_date_of_birth');
          const genderField = document.getElementById('add_gender');
          if (dobField && result.dob) dobField.value = result.dob;
          if (genderField && result.gender) genderField.value = result.gender;
          idInput.classList.remove('error');
        } else if (idInput.value.length > 0) {
          idInput.classList.add('error');
          const existing = idInput.parentElement.querySelector('.form-error');
          if (existing) existing.remove();
          const errEl = document.createElement('div');
          errEl.className = 'form-error';
          errEl.textContent = result.message;
          idInput.parentElement.appendChild(errEl);
        }
      });
    }

    document.getElementById('btn-save-employee').addEventListener('click', () => this.saveEmployee());
  },

  clearInlineErrors(form) {
    if (!form) return;
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  },

  showInlineError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('input-error');
    const existing = inputEl.parentElement.querySelector('.field-error');
    if (existing) existing.remove();
    const errEl = document.createElement('div');
    errEl.className = 'field-error';
    errEl.style.cssText = 'color:var(--danger);font-size:11px;margin-top:2px';
    errEl.textContent = message;
    inputEl.parentElement.appendChild(errEl);
  },

  validateTaxNumber(taxNum) {
    if (!taxNum) return { valid: true };
    if (!/^\d{10}$/.test(taxNum)) return { valid: false, message: 'Tax number must be 10 digits' };
    return { valid: true };
  },

  validateBankCDV(accountNumber, branchCode) {
    if (!accountNumber || !branchCode) return { valid: true };
    if (!/^\d+$/.test(accountNumber)) return { valid: false, message: 'Account number must contain only digits' };
    if (!/^\d{6}$/.test(branchCode)) return { valid: false, message: 'Branch code must be 6 digits' };
    return { valid: true };
  },

  async saveEmployee() {
    const form = document.getElementById('add-employee-form');
    this.clearInlineErrors(form);
    const validation = UI.validateForm(form);
    if (!validation.valid) {
      UI.toast('error', 'Validation Error', validation.errors.join(', '));
      return;
    }

    const data = UI.getFormData(form);
    let hasErrors = false;

    const idValidation = this.validateSAID(data.add_id_number);
    if (!idValidation.valid) {
      this.showInlineError(document.getElementById('add_id_number'), idValidation.message);
      hasErrors = true;
    }

    const taxValidation = this.validateTaxNumber(data.add_income_tax_number);
    if (!taxValidation.valid) {
      this.showInlineError(document.getElementById('add_income_tax_number'), taxValidation.message);
      hasErrors = true;
    }

    const bankValidation = this.validateBankCDV(data.add_bank_account_number, data.add_bank_branch_code);
    if (!bankValidation.valid) {
      this.showInlineError(document.getElementById('add_bank_account_number'), bankValidation.message);
      hasErrors = true;
    }

    if (data.add_email_address && !this.validateEmail(data.add_email_address)) {
      this.showInlineError(document.getElementById('add_email_address'), 'Please enter a valid email address');
      hasErrors = true;
    }

    if (data.add_cell_number && !this.validatePhone(data.add_cell_number)) {
      this.showInlineError(document.getElementById('add_cell_number'), 'Please enter a valid phone number');
      hasErrors = true;
    }

    if (hasErrors) {
      UI.toast('error', 'Validation Error', 'Please fix the highlighted errors');
      return;
    }

    const payload = {};
    Object.keys(data).forEach(k => {
      const key = k.replace('add_', '');
      payload[key] = data[k];
    });

    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.errors && typeof result.errors === 'object') {
          Object.keys(result.errors).forEach(field => {
            const inputEl = document.getElementById('add_' + field);
            if (inputEl) {
              this.showInlineError(inputEl, result.errors[field]);
            }
          });
          UI.toast('error', 'Validation Error', 'Please fix the highlighted errors');
          return;
        }
        throw new Error(result.error?.message || 'Failed to create employee');
      }
      UI.closeModal();
      UI.toast('success', 'Employee Created', `${payload.first_name} ${payload.surname} has been added successfully`);
      this.renderList();
    } catch (err) {
      UI.toast('error', 'Error', err.message);
    }
  },

  async showDetail(employeeId) {
    this.container.innerHTML = '<div class="loading"><div class="spinner"></div>Loading employee details...</div>';
    try {
      const empRes = await api(`/employees/${employeeId}`);
      this.state.currentEmployee = empRes.data;
      const emp = empRes.data;

      const tabs = [
        { id: 'personal', label: 'Personal', icon: icon('user',14) },
        { id: 'employment', label: 'Employment', icon: icon('briefcase',14) },
        { id: 'banking', label: 'Banking', icon: icon('creditCard',14) },
        { id: 'salary', label: 'Salary Transactions', icon: icon('dollar',14) },
        { id: 'leave', label: 'Leave Balances', icon: icon('calendar',14) },
        { id: 'benefits', label: 'Benefits', icon: icon('heart',14) },
        { id: 'dependants', label: 'Dependants', icon: icon('users',14) },
        { id: 'emergency', label: 'Emergency Contacts', icon: icon('phone',14) },
        { id: 'qualifications', label: 'Qualifications', icon: icon('award',14) },
        { id: 'succession', label: 'Succession', icon: icon('trendingUp',14) },
        { id: 'documents', label: 'Documents', icon: icon('file',14) },
      ];

      this.container.innerHTML = `
        <div style="margin-bottom:20px">
          <button class="btn" id="btn-back-list">Back to List</button>
          <button class="btn" id="btn-edit-emp" style="margin-left:8px">Edit</button>
          ${emp.status === 'ACTIVE' ? `<button class="btn btn-danger" id="btn-terminate-emp" style="margin-left:8px;background:var(--danger);color:#fff;border-color:var(--danger)">Terminate</button>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <div style="position:relative">
            <div style="width:64px;height:64px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;overflow:hidden">
              ${emp.photo_url ? `<img src="${this.esc(emp.photo_url)}" style="width:100%;height:100%;object-fit:cover" alt="">` : `${(emp.first_name || '')[0] || ''}${(emp.surname || '')[0] || ''}`}
            </div>
            <button id="btn-upload-photo" title="Upload Photo" style="position:absolute;bottom:-2px;right:-2px;width:24px;height:24px;border-radius:50%;background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0">${icon('edit',12)}</button>
            <input type="file" id="photo-file-input" accept="image/*" style="display:none">
          </div>
          <div>
            <div style="font-size:22px;font-weight:700">${this.esc(emp.title || '')} ${this.esc(emp.first_name)} ${this.esc(emp.surname)}</div>
            <div style="font-size:14px;color:var(--text-secondary)">${this.esc(emp.employee_code)} &middot; ${this.esc(emp.position_title || 'No Position')} &middot; ${this.esc(emp.department_name || 'No Department')}</div>
            <span class="status-badge status-${(emp.status || '').toLowerCase()}" style="margin-top:4px">${this.esc(emp.status || '')}</span>${this.getProbationBadge(emp)}
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:24px;font-weight:700;color:var(--primary)">${formatCurrency(emp.annual_salary)}</div>
            <div style="font-size:12px;color:var(--text-secondary)">Annual Salary</div>
          </div>
        </div>
        ${UI.detailTabs(tabs, this.state.activeDetailTab)}
        <div id="emp-detail-content"></div>
      `;

      document.getElementById('btn-back-list').addEventListener('click', () => {
        this.state.currentEmployee = null;
        this.renderList();
      });

      document.getElementById('btn-edit-emp').addEventListener('click', () => this.showEditModal(employeeId));

      const photoBtn = document.getElementById('btn-upload-photo');
      const photoInput = document.getElementById('photo-file-input');
      if (photoBtn && photoInput) {
        photoBtn.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', async () => {
          const file = photoInput.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append('photo', file);
          try {
            const res = await fetch(`${API_BASE}/employees/${employeeId}/photo`, {
              method: 'POST',
              body: formData,
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error?.message || 'Failed to upload photo');
            UI.toast('success', 'Photo Updated', 'Employee photo has been updated');
            this.showDetail(employeeId);
          } catch (err) {
            UI.toast('error', 'Error', err.message);
          }
        });
      }

      const termBtn = document.getElementById('btn-terminate-emp');
      if (termBtn) termBtn.addEventListener('click', () => this.showTerminateModal(employeeId));

      this.container.querySelectorAll('[data-detail-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
          this.state.activeDetailTab = tab.dataset.detailTab;
          this.container.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.renderDetailTab(emp);
        });
      });

      this.renderDetailTab(emp);
    } catch (err) {
      this.container.innerHTML = `<div class="loading" style="color:var(--danger)">Error loading employee: ${err.message}</div>`;
    }
  },

  async renderDetailTab(emp) {
    const content = document.getElementById('emp-detail-content');
    if (!content) return;

    switch (this.state.activeDetailTab) {
      case 'personal':
        content.innerHTML = `
          <div class="info-grid">
            ${this.infoItem('Employee Code', emp.employee_code)}
            ${this.infoItem('ID Number', emp.id_number)}
            ${this.infoItem('Title', emp.title)}
            ${this.infoItem('First Name', emp.first_name)}
            ${this.infoItem('Second Name', emp.second_name)}
            ${this.infoItem('Surname', emp.surname)}
            ${this.infoItem('Known As', emp.known_as)}
            ${this.infoItem('Initials', emp.initials)}
            ${this.infoItem('Date of Birth', this.formatDate(emp.date_of_birth))}
            ${this.infoItem('Gender', emp.gender)}
            ${this.infoItem('Race', emp.race)}
            ${this.infoItem('Nationality', emp.nationality)}
            ${this.infoItem('Language', emp.language)}
            ${this.infoItem('Marital Status', emp.marital_status)}
            ${this.infoItem('Dependants', emp.dependants)}
            ${this.infoItem('Disability Status', emp.disability_status)}
            ${this.infoItem('Email', emp.email_address)}
            ${this.infoItem('Cell Number', emp.cell_number)}
            ${this.infoItem('Home Number', emp.home_number)}
            ${this.infoItem('Work Number', emp.work_number)}
            ${this.infoItem('Physical Address', [emp.physical_address_1, emp.physical_address_2, emp.physical_city, emp.physical_province, emp.physical_postal_code].filter(Boolean).join(', '))}
            ${this.infoItem('Postal Address', [emp.postal_address_1, emp.postal_address_2, emp.postal_city, emp.postal_province, emp.postal_code].filter(Boolean).join(', '))}
          </div>
        `;
        break;

      case 'employment':
        content.innerHTML = `
          <div class="info-grid">
            ${this.infoItem('Position', emp.position_title)}
            ${this.infoItem('Position Code', emp.position_code)}
            ${this.infoItem('Department', emp.department_name)}
            ${this.infoItem('Division', emp.division_name)}
            ${this.infoItem('Employee Type', emp.employee_type_name)}
            ${this.infoItem('Condition of Service', emp.condition_of_service_name)}
            ${this.infoItem('TASK Grade', emp.grade_code ? `${emp.grade_code} - ${emp.grade_name}` : null)}
            ${this.infoItem('Current Notch', emp.current_notch)}
            ${this.infoItem('Joining Date', this.formatDate(emp.joining_date))}
            ${this.infoItem('End Date', this.formatDate(emp.end_date))}
            ${this.infoItem('Income Tax Number', emp.income_tax_number)}
            ${this.infoItem('Status', emp.status)}
            ${this.infoItem('Working Hours/Day', emp.working_hours_per_day)}
            ${this.infoItem('Working Days/Week', emp.working_days_per_week)}
          </div>
        `;
        break;

      case 'banking':
        content.innerHTML = `
          <div class="info-grid">
            ${this.infoItem('Bank Name', emp.bank_name)}
            ${this.infoItem('Branch Code', emp.bank_branch_code)}
            ${this.infoItem('Account Number', emp.bank_account_number ? '****' + emp.bank_account_number.slice(-4) : null)}
            ${this.infoItem('Account Type', emp.bank_account_type)}
            ${this.infoItem('Account Holder', emp.bank_account_holder)}
          </div>
          ${!emp.bank_name ? '<div style="margin-top:16px;padding:12px 16px;background:var(--warning-bg);border-radius:8px;color:var(--warning);font-size:13px">Banking details are incomplete. EFT payments cannot be processed.</div>' : ''}
        `;
        break;

      case 'salary':
        await this.renderSalaryTab(emp.id, content);
        break;

      case 'leave':
        await this.renderLeaveTab(emp.id, content);
        break;

      case 'benefits':
        await this.renderBenefitsTab(emp.id, content);
        break;

      case 'dependants':
        await this.renderDependantsTab(emp.id, content);
        break;

      case 'emergency':
        await this.renderEmergencyTab(emp.id, content);
        break;

      case 'qualifications':
        await this.renderQualificationsTab(emp.id, content);
        break;

      case 'succession':
        await this.renderSuccessionTab(emp.id, content);
        break;

      case 'documents':
        await this.renderDocumentsTab(emp.id, content);
        break;
    }
  },

  async renderSalaryTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading salary transactions...</div>';
    try {
      const data = await api(`/employees/${employeeId}/salary-transactions`);
      const txns = data.data || [];

      const earnings = txns.filter(t => t.transaction_type === 'EARNING');
      const deductions = txns.filter(t => t.transaction_type === 'DEDUCTION');
      const companyContribs = txns.filter(t => t.transaction_type === 'COMPANY_CONTRIBUTION');
      const fringeBenefits = txns.filter(t => t.transaction_type === 'FRINGE_BENEFIT');
      const totalEarnings = earnings.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const totalDeductions = deductions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const totalCompany = companyContribs.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const totalFringe = fringeBenefits.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

      const calcMethodLabel = (m) => {
        if (m === 'PERCENTAGE_OF_BASIC') return 'of Basic';
        if (m === 'FIXED') return 'Fixed';
        return '';
      };

      const renderRows = (items, empId) => items.map(t => {
        const pctDisplay = t.percentage ? `<strong>${parseFloat(t.percentage)}%</strong> <span style="color:#888;font-size:11px">${calcMethodLabel(t.calculation_method)}</span>` : '-';
        return `
        <tr>
          <td><strong>${this.esc(t.salary_head_code)}</strong></td>
          <td>${this.esc(t.salary_head_name)}</td>
          <td style="text-align:right;font-weight:600">${formatCurrency(t.amount)}</td>
          <td>${pctDisplay}</td>
          <td>${t.taxable ? '<span class="badge badge-warning">Taxable</span>' : '<span class="badge badge-success">Non-Taxable</span>'}</td>
          <td>${this.formatDate(t.start_date)} - ${t.end_date && t.end_date.startsWith('9999') ? 'Ongoing' : this.formatDate(t.end_date)}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" data-action="edit-txn" data-emp="${empId}" data-txn-id="${t.id}" data-head-name="${this.esc(t.salary_head_name)}" data-amount="${t.amount}" data-pct="${t.percentage || ''}" data-start="${t.start_date ? t.start_date.substring(0,10) : ''}" data-end="${t.end_date ? t.end_date.substring(0,10) : ''}" title="Edit">${icon('edit2',14)}</button>
              <button class="action-btn" data-action="delete-txn" data-emp="${empId}" data-txn-id="${t.id}" data-head-name="${this.esc(t.salary_head_name)}" title="Remove" style="color:var(--danger)">${icon('trash2',14)}</button>
            </div>
          </td>
        </tr>`;
      }).join('');

      const sectionHtml = (title, color, items, badgeClass) => {
        if (items.length === 0) return '';
        return `
          <h4 style="font-size:14px;margin-bottom:8px;color:${color};display:flex;align-items:center;gap:6px">${title}</h4>
          <div class="data-grid" style="margin-bottom:16px">
            <table>
              <thead><tr><th>Code</th><th>Description</th><th style="text-align:right">Amount</th><th>Rate</th><th>Tax</th><th>Period</th><th style="width:80px">Actions</th></tr></thead>
              <tbody>${renderRows(items, employeeId)}</tbody>
            </table>
          </div>
        `;
      };

      const systemNote = '<div style="padding:8px 12px;background:#f0f4f8;border-radius:8px;margin-bottom:16px;font-size:12px;color:#555;display:flex;align-items:center;gap:8px">' + icon('info',14) + ' PAYE, UIF, and SDL are system-calculated during payroll execution and do not appear here. Edit contribution percentages by clicking the edit button on each transaction, or adjust default rates under Payroll &gt; Salary Heads.</div>';

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="badge badge-success" style="font-size:13px;padding:6px 12px">Earnings: ${formatCurrency(totalEarnings)}</span>
            <span class="badge badge-danger" style="font-size:13px;padding:6px 12px">Deductions: ${formatCurrency(totalDeductions)}</span>
            ${totalCompany > 0 ? `<span class="badge badge-primary" style="font-size:13px;padding:6px 12px">Employer: ${formatCurrency(totalCompany)}</span>` : ''}
            ${totalFringe > 0 ? `<span class="badge badge-warning" style="font-size:13px;padding:6px 12px">Fringe: ${formatCurrency(totalFringe)}</span>` : ''}
            <span class="badge" style="font-size:13px;padding:6px 12px;background:var(--navy);color:#fff">Nett: ${formatCurrency(totalEarnings - totalDeductions)}</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-add-salary-txn">${icon('plus',14)} Add Transaction</button>
        </div>
        ${systemNote}
        ${sectionHtml('Earnings', 'var(--success)', earnings)}
        ${sectionHtml('Deductions', 'var(--danger)', deductions)}
        ${sectionHtml('Company Contributions', 'var(--primary)', companyContribs)}
        ${sectionHtml('Fringe Benefits', '#e65100', fringeBenefits)}
        ${txns.length === 0 ? UI.emptyState(icon('dollar',32), 'No Salary Transactions', 'Add earnings and deductions for this employee') : ''}
      `;

      document.getElementById('btn-add-salary-txn')?.addEventListener('click', () => this.showAddSalaryTxnModal(employeeId));

      content.querySelectorAll('[data-action="edit-txn"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showEditSalaryTxnModal(btn.dataset.emp, btn.dataset.txnId, {
            head_name: btn.dataset.headName,
            amount: btn.dataset.amount,
            percentage: btn.dataset.pct,
            start_date: btn.dataset.start,
            end_date: btn.dataset.end
          });
        });
      });

      content.querySelectorAll('[data-action="delete-txn"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.deleteSalaryTxn(btn.dataset.emp, btn.dataset.txnId, btn.dataset.headName);
        });
      });
    } catch (err) {
      content.innerHTML = `<div class="loading" style="color:var(--danger)">Error: ${err.message}</div>`;
    }
  },

  async showAddSalaryTxnModal(employeeId) {
    let salaryHeads = this.state.salaryHeads;
    if (salaryHeads.length === 0) {
      try {
        const data = await api('/payroll/salary-heads');
        salaryHeads = data.data || [];
        this.state.salaryHeads = salaryHeads;
      } catch (e) {
        salaryHeads = [];
      }
    }

    const assignable = salaryHeads.filter(h => h.calculation_method !== 'SYSTEM_CALCULATE');
    const headOpts = assignable.map(h => {
      const typeLabel = h.transaction_type === 'EARNING' ? 'Earning' : h.transaction_type === 'DEDUCTION' ? 'Deduction' : h.transaction_type === 'COMPANY_CONTRIBUTION' ? 'Company' : 'Fringe';
      const pctHint = h.calculation_method === 'PERCENTAGE_OF_BASIC' ? ` [${parseFloat(h.employee_contribution || h.employer_contribution || 0)}%]` : '';
      return { value: h.id, label: `${h.code} - ${h.name} (${typeLabel})${pctHint}` };
    });

    const fields = UI.buildForm([
      { type: 'section', label: 'Transaction Details', icon: icon('dollar',16) },
      { id: 'txn_salary_head_id', label: 'Salary Head', type: 'select', options: headOpts, required: true, hint: 'PAYE, UIF, and SDL are system-calculated and cannot be manually assigned' },
      { id: 'txn_calc_type', label: 'Calculation Type', type: 'select', options: [
        { value: 'FIXED', label: 'Fixed Amount (R)' },
        { value: 'PERCENTAGE', label: 'Percentage of Basic Salary (%)' }
      ], value: 'FIXED' },
      { id: 'txn_amount', label: 'Amount (R)', type: 'number', min: 0, step: '0.01', required: true, hint: 'Monthly amount in Rands' },
      { id: 'txn_percentage', label: 'Percentage of Basic (%)', type: 'number', min: 0, max: 100, step: '0.01', hint: 'e.g. 7.5 for 7.5% of basic salary' },
      { type: 'section', label: 'Effective Period', icon: icon('calendar',16) },
      { id: 'txn_start_date', label: 'Start Date', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
      { id: 'txn_end_date', label: 'End Date', type: 'date', hint: 'Leave empty for ongoing' },
    ]);

    UI.modal({
      title: 'Add Salary Transaction',
      size: 'md',
      content: `
        <div id="txn-head-info" style="display:none;padding:8px 12px;background:#e8f5e9;border-radius:8px;margin-bottom:12px;font-size:12px"></div>
        <div class="form-grid" id="salary-txn-form">${fields}</div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-save-salary-txn">${icon('check',14)} Save Transaction</button>`,
    });

    const headSelect = document.getElementById('txn_salary_head_id');
    const calcSelect = document.getElementById('txn_calc_type');
    const amountInput = document.getElementById('txn_amount');
    const pctInput = document.getElementById('txn_percentage');
    const infoDiv = document.getElementById('txn-head-info');

    const toggleFields = () => {
      const isPct = calcSelect.value === 'PERCENTAGE';
      amountInput.closest('.form-group').style.display = isPct ? 'none' : '';
      pctInput.closest('.form-group').style.display = isPct ? '' : 'none';
      if (isPct) amountInput.removeAttribute('required');
      else amountInput.setAttribute('required', 'true');
    };
    toggleFields();
    calcSelect.addEventListener('change', toggleFields);

    headSelect.addEventListener('change', () => {
      const sel = assignable.find(h => h.id === parseInt(headSelect.value));
      if (sel) {
        const isPctHead = sel.calculation_method === 'PERCENTAGE_OF_BASIC';
        if (isPctHead) {
          calcSelect.value = 'PERCENTAGE';
          toggleFields();
          const defRate = parseFloat(sel.employee_contribution || sel.employer_contribution || 0);
          if (defRate > 0 && !pctInput.value) pctInput.value = defRate;
        }
        const info = [];
        if (sel.taxable) info.push('Taxable');
        if (sel.irp5_code) info.push('IRP5: ' + sel.irp5_code);
        if (isPctHead) info.push('Default rate: ' + (parseFloat(sel.employee_contribution || sel.employer_contribution || 0)) + '%');
        if (info.length > 0) { infoDiv.style.display = ''; infoDiv.textContent = info.join(' | '); }
        else { infoDiv.style.display = 'none'; }
      }
    });

    document.getElementById('btn-save-salary-txn').addEventListener('click', async () => {
      const form = document.getElementById('salary-txn-form');
      const isPct = calcSelect.value === 'PERCENTAGE';
      const pctVal = parseFloat(pctInput.value) || 0;
      const amtVal = parseFloat(amountInput.value) || 0;

      if (!isPct && amtVal <= 0) { UI.toast('error', 'Validation Error', 'Amount is required'); return; }
      if (isPct && pctVal <= 0) { UI.toast('error', 'Validation Error', 'Percentage is required'); return; }

      const fd = UI.getFormData(form);
      try {
        const res = await fetch(`${API_BASE}/employees/${employeeId}/salary-transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salary_head_id: fd.txn_salary_head_id,
            amount: isPct ? 0 : amtVal,
            percentage: isPct ? pctVal : (parseFloat(fd.txn_percentage) || null),
            start_date: fd.txn_start_date,
            end_date: fd.txn_end_date || null,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error?.message || 'Failed to add transaction');
        UI.closeModal();
        UI.toast('success', 'Transaction Added', 'Salary transaction added successfully');
        const content = document.getElementById('emp-detail-content');
        if (content) this.renderSalaryTab(employeeId, content);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  showEditSalaryTxnModal(employeeId, txnId, txnData) {
    const hasPct = txnData.percentage && parseFloat(txnData.percentage) > 0;
    const fields = UI.buildForm([
      { type: 'section', label: `Edit: ${txnData.head_name}`, icon: icon('edit2',16) },
      { id: 'edit_calc_type', label: 'Calculation Type', type: 'select', options: [
        { value: 'FIXED', label: 'Fixed Amount (R)' },
        { value: 'PERCENTAGE', label: 'Percentage of Basic Salary (%)' }
      ], value: hasPct ? 'PERCENTAGE' : 'FIXED' },
      { id: 'edit_amount', label: 'Amount (R)', type: 'number', min: 0, step: '0.01', value: txnData.amount || '' },
      { id: 'edit_percentage', label: 'Percentage of Basic (%)', type: 'number', min: 0, max: 100, step: '0.01', value: txnData.percentage || '', hint: 'e.g. 7.5 for pension at 7.5% of basic salary' },
      { type: 'section', label: 'Effective Period', icon: icon('calendar',16) },
      { id: 'edit_start_date', label: 'Start Date', type: 'date', value: txnData.start_date || '' },
      { id: 'edit_end_date', label: 'End Date', type: 'date', value: txnData.end_date && !txnData.end_date.startsWith('9999') ? txnData.end_date : '', hint: 'Leave empty for ongoing' },
    ]);

    UI.modal({
      title: 'Edit Salary Transaction',
      size: 'sm',
      content: `<div class="form-grid" id="edit-txn-form">${fields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" id="btn-update-txn">${icon('check',14)} Update</button>`,
    });

    const calcSelect = document.getElementById('edit_calc_type');
    const amtInput = document.getElementById('edit_amount');
    const pctInput = document.getElementById('edit_percentage');
    const toggleEdit = () => {
      const isPct = calcSelect.value === 'PERCENTAGE';
      amtInput.closest('.form-group').style.display = isPct ? 'none' : '';
      pctInput.closest('.form-group').style.display = isPct ? '' : 'none';
    };
    toggleEdit();
    calcSelect.addEventListener('change', toggleEdit);

    document.getElementById('btn-update-txn').addEventListener('click', async () => {
      const isPct = calcSelect.value === 'PERCENTAGE';
      const body = {
        amount: isPct ? 0 : (parseFloat(amtInput.value) || 0),
        percentage: isPct ? (parseFloat(pctInput.value) || 0) : null,
      };
      const sd = document.getElementById('edit_start_date').value;
      const ed = document.getElementById('edit_end_date').value;
      if (sd) body.start_date = sd;
      if (ed) body.end_date = ed;

      try {
        const res = await fetch(`${API_BASE}/employees/${employeeId}/salary-transactions/${txnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Update failed'); }
        UI.closeModal();
        UI.toast('success', 'Transaction Updated', `${txnData.head_name} updated successfully`);
        const content = document.getElementById('emp-detail-content');
        if (content) this.renderSalaryTab(employeeId, content);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  deleteSalaryTxn(employeeId, txnId, headName) {
    UI.confirm({
      title: 'Remove Transaction',
      message: `Remove <strong>${headName}</strong> from this employee's salary package? This will take effect from the next payroll run.`,
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_BASE}/employees/${employeeId}/salary-transactions/${txnId}`, { method: 'DELETE' });
          if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Delete failed'); }
          UI.toast('success', 'Transaction Removed', `${headName} has been removed`);
          const content = document.getElementById('emp-detail-content');
          if (content) this.renderSalaryTab(employeeId, content);
        } catch (err) {
          UI.toast('error', 'Error', err.message);
        }
      }
    });
  },

  async renderLeaveTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading leave balances...</div>';
    try {
      const data = await api(`/leave/balances/${employeeId}`);
      const balances = data.data || [];

      if (balances.length === 0) {
        content.innerHTML = UI.emptyState(icon('calendar',32), 'No Leave Balances', 'Leave balances will appear once leave types are configured');
        return;
      }

      const rows = balances.map(b => `
        <tr>
          <td><span class="badge badge-info">${this.esc(b.leave_type_code || '')}</span> ${this.esc(b.leave_type_name || b.name || '')}</td>
          <td style="text-align:center">${parseFloat(b.opening_balance || 0).toFixed(1)}</td>
          <td style="text-align:center">${parseFloat(b.accrued || 0).toFixed(1)}</td>
          <td style="text-align:center">${parseFloat(b.taken || 0).toFixed(1)}</td>
          <td style="text-align:center;font-weight:700;color:${parseFloat(b.balance || 0) < 0 ? 'var(--danger)' : 'var(--success)'}">${parseFloat(b.balance || 0).toFixed(1)}</td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div class="data-grid">
          <table>
            <thead><tr><th>Leave Type</th><th style="text-align:center">Opening</th><th style="text-align:center">Accrued</th><th style="text-align:center">Taken</th><th style="text-align:center">Balance</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('calendar',32), 'Leave Data Unavailable', err.message);
    }
  },

  async renderBenefitsTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading benefits...</div>';
    try {
      const [medData, retData] = await Promise.all([
        api(`/benefits/employee/${employeeId}/medical-aid`).catch(() => ({ data: [] })),
        api(`/benefits/employee/${employeeId}/retirement-funds`).catch(() => ({ data: [] })),
      ]);

      const medRows = (medData.data || []).map(m => `
        <tr>
          <td>${this.esc(m.scheme_name || m.name || '')}</td>
          <td>${this.esc(m.plan_option || '-')}</td>
          <td>${this.esc(m.membership_number || '-')}</td>
          <td>${formatCurrency(m.main_member_contribution)}</td>
          <td><span class="status-badge status-${(m.status || 'active').toLowerCase()}">${this.esc(m.status || 'Active')}</span></td>
        </tr>
      `).join('');

      const retRows = (retData.data || []).map(r => `
        <tr>
          <td>${this.esc(r.fund_name || r.name || '')}</td>
          <td>${this.esc(r.fund_type || '-')}</td>
          <td>${r.employee_contribution_rate || 0}%</td>
          <td>${r.employer_contribution_rate || 0}%</td>
          <td><span class="status-badge status-${(r.status || 'active').toLowerCase()}">${this.esc(r.status || 'Active')}</span></td>
        </tr>
      `).join('');

      content.innerHTML = `
        <h4 style="font-size:14px;margin-bottom:8px">Medical Aid</h4>
        ${medRows ? `
          <div class="data-grid" style="margin-bottom:20px">
            <table>
              <thead><tr><th>Scheme</th><th>Plan</th><th>Membership #</th><th>Contribution</th><th>Status</th></tr></thead>
              <tbody>${medRows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('heart',32), 'No Medical Aid', 'No medical aid enrolment found')}

        <h4 style="font-size:14px;margin-bottom:8px;margin-top:20px">Retirement Funds</h4>
        ${retRows ? `
          <div class="data-grid">
            <table>
              <thead><tr><th>Fund</th><th>Type</th><th>Employee %</th><th>Employer %</th><th>Status</th></tr></thead>
              <tbody>${retRows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('shield',32), 'No Retirement Fund', 'No retirement fund enrolment found')}
      `;
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('heart',32), 'Benefits Data Unavailable', err.message);
    }
  },

  async showEditModal(employeeId) {
    try {
      const empRes = await api(`/employees/${employeeId}`);
      const emp = empRes.data;

      const deptOpts = this.state.departments.map(d => ({ value: d.id, label: d.name }));
      const gradeOpts = this.state.taskGrades.map(g => ({ value: g.id, label: `${g.grade_code} - ${g.grade_name}` }));
      const titleOpts = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Adv', 'Rev'].map(t => ({ value: t, label: t }));
      const raceOpts = ['African', 'Coloured', 'Indian', 'White', 'Other'].map(r => ({ value: r, label: r }));
      const maritalOpts = ['Single', 'Married', 'Divorced', 'Widowed', 'Civil Union'].map(m => ({ value: m, label: m }));
      const bankTypeOpts = ['Cheque/Current', 'Savings', 'Transmission'].map(b => ({ value: b, label: b }));
      const provinceOpts = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'].map(p => ({ value: p, label: p }));

      const fields = UI.buildForm([
        { type: 'section', label: 'Personal Details', icon: icon('user',16) },
        { id: 'edit_title', label: 'Title', type: 'select', options: titleOpts, value: emp.title },
        { id: 'edit_first_name', label: 'First Name', required: true, value: emp.first_name },
        { id: 'edit_second_name', label: 'Second Name', value: emp.second_name },
        { id: 'edit_surname', label: 'Surname', required: true, value: emp.surname },
        { id: 'edit_known_as', label: 'Known As', value: emp.known_as },
        { id: 'edit_initials', label: 'Initials', value: emp.initials, maxlength: 5 },
        { id: 'edit_race', label: 'Race', type: 'select', options: raceOpts, value: emp.race },
        { id: 'edit_marital_status', label: 'Marital Status', type: 'select', options: maritalOpts, value: emp.marital_status },
        { id: 'edit_dependants', label: 'Dependants', type: 'number', min: 0, value: emp.dependants },
        { id: 'edit_disability_status', label: 'Disability Status', value: emp.disability_status },

        { type: 'section', label: 'Contact Details', icon: icon('link',16) },
        { id: 'edit_email_address', label: 'Email Address', type: 'email', value: emp.email_address },
        { id: 'edit_cell_number', label: 'Cell Number', value: emp.cell_number },
        { id: 'edit_home_number', label: 'Home Number', value: emp.home_number },
        { id: 'edit_work_number', label: 'Work Number', value: emp.work_number },

        { type: 'section', label: 'Employment Details', icon: icon('briefcase',16) },
        { id: 'edit_income_tax_number', label: 'Income Tax Number', value: emp.income_tax_number },
        { id: 'edit_task_grade_id', label: 'TASK Grade', type: 'select', options: gradeOpts, value: emp.task_grade_id },
        { id: 'edit_current_notch', label: 'Notch', type: 'number', min: 1, value: emp.current_notch },
        { id: 'edit_annual_salary', label: 'Annual Salary (R)', type: 'number', min: 0, step: '0.01', value: emp.annual_salary },

        { type: 'section', label: 'Physical Address', icon: icon('home',16) },
        { id: 'edit_physical_address_1', label: 'Address Line 1', value: emp.physical_address_1 },
        { id: 'edit_physical_address_2', label: 'Address Line 2', value: emp.physical_address_2 },
        { id: 'edit_physical_city', label: 'City', value: emp.physical_city },
        { id: 'edit_physical_province', label: 'Province', type: 'select', options: provinceOpts, value: emp.physical_province },
        { id: 'edit_physical_postal_code', label: 'Postal Code', value: emp.physical_postal_code, maxlength: 4 },

        { type: 'section', label: 'Postal Address', icon: icon('file',16) },
        { id: 'edit_postal_address_1', label: 'Address Line 1', value: emp.postal_address_1 },
        { id: 'edit_postal_address_2', label: 'Address Line 2', value: emp.postal_address_2 },
        { id: 'edit_postal_city', label: 'City', value: emp.postal_city },
        { id: 'edit_postal_province', label: 'Province', type: 'select', options: provinceOpts, value: emp.postal_province },
        { id: 'edit_postal_code', label: 'Postal Code', value: emp.postal_code, maxlength: 4 },

        { type: 'section', label: 'Banking Details', icon: icon('creditCard',16) },
        { id: 'edit_bank_name', label: 'Bank Name', value: emp.bank_name },
        { id: 'edit_bank_branch_code', label: 'Branch Code', value: emp.bank_branch_code, maxlength: 6 },
        { id: 'edit_bank_account_number', label: 'Account Number', value: emp.bank_account_number },
        { id: 'edit_bank_account_type', label: 'Account Type', type: 'select', options: bankTypeOpts, value: emp.bank_account_type },
        { id: 'edit_bank_account_holder', label: 'Account Holder Name', value: emp.bank_account_holder },
      ]);

      UI.modal({
        title: `Edit Employee - ${emp.first_name} ${emp.surname}`,
        size: 'lg',
        content: `<div class="form-grid" id="edit-employee-form">${fields}</div>`,
        footer: `
          <button class="btn" data-close-modal>Cancel</button>
          <button class="btn btn-primary" id="btn-update-employee">Update Employee</button>
        `,
      });

      document.getElementById('btn-update-employee').addEventListener('click', async () => {
        const form = document.getElementById('edit-employee-form');
        const v = UI.validateForm(form);
        if (!v.valid) { UI.toast('error', 'Validation Error', v.errors.join(', ')); return; }

        const data = UI.getFormData(form);

        if (data.edit_email_address && !this.validateEmail(data.edit_email_address)) {
          UI.toast('error', 'Invalid Email', 'Please enter a valid email address');
          return;
        }

        if (data.edit_cell_number && !this.validatePhone(data.edit_cell_number)) {
          UI.toast('error', 'Invalid Phone', 'Please enter a valid phone number');
          return;
        }

        const payload = {};
        Object.keys(data).forEach(k => {
          const key = k.replace('edit_', '');
          if (data[k] !== null && data[k] !== '') payload[key] = data[k];
        });

        try {
          const res = await fetch(`${API_BASE}/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error?.message || 'Failed to update employee');
          UI.closeModal();
          UI.toast('success', 'Employee Updated', 'Employee details have been updated successfully');
          if (this.state.currentEmployee) {
            this.showDetail(employeeId);
          } else {
            this.renderList();
          }
        } catch (err) {
          UI.toast('error', 'Error', err.message);
        }
      });
    } catch (err) {
      UI.toast('error', 'Error', `Failed to load employee: ${err.message}`);
    }
  },

  async showTerminateModal(employeeId) {
    let emp;
    try {
      const empRes = await api(`/employees/${employeeId}`);
      emp = empRes.data;
    } catch (err) {
      UI.toast('error', 'Error', 'Failed to load employee details');
      return;
    }

    const termTypes = [
      { value: 'RESIGNATION', label: 'Resignation' },
      { value: 'DISMISSAL', label: 'Dismissal' },
      { value: 'RETRENCHMENT', label: 'Retrenchment' },
      { value: 'CONTRACT_END', label: 'End of Contract' },
      { value: 'RETIREMENT', label: 'Retirement' },
      { value: 'DEATH', label: 'Death' },
      { value: 'ABSCONDED', label: 'Absconded' },
      { value: 'MUTUAL', label: 'Mutual Agreement' },
    ];

    let wizardStep = 1;
    let calculatedAmounts = null;
    const wizardState = {
      termination_type: '',
      reason: '',
      last_working_date: '',
      checklist_equipment: false,
      checklist_exit_interview: false,
      checklist_access: false,
      checklist_assets: false,
      checklist_payslip: false,
      exit_interview_notes: '',
    };

    const renderWizardStep = () => {
      const modalBody = document.querySelector('.modal-body');
      const modalFooter = document.querySelector('.modal-footer');
      if (!modalBody || !modalFooter) return;

      const stepIndicator = `
        <div style="display:flex;gap:4px;margin-bottom:20px">
          ${[1,2,3,4].map(s => `
            <div style="flex:1;height:4px;border-radius:2px;background:${s <= wizardStep ? 'var(--primary)' : 'var(--border)'}"></div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;color:var(--text-secondary)">
          <span style="${wizardStep === 1 ? 'color:var(--primary);font-weight:600' : ''}">1. Details</span>
          <span style="${wizardStep === 2 ? 'color:var(--primary);font-weight:600' : ''}">2. Payout</span>
          <span style="${wizardStep === 3 ? 'color:var(--primary);font-weight:600' : ''}">3. Checklist</span>
          <span style="${wizardStep === 4 ? 'color:var(--primary);font-weight:600' : ''}">4. Confirm</span>
        </div>
      `;

      if (wizardStep === 1) {
        const step1Fields = UI.buildForm([
          { id: 'wiz_emp_name', label: 'Employee', type: 'readonly', value: `${emp.employee_code} - ${emp.first_name} ${emp.surname}`, fullWidth: true },
          { id: 'wiz_term_type', label: 'Termination Type', type: 'select', options: termTypes, required: true, value: wizardState.termination_type },
          { id: 'wiz_last_date', label: 'Last Working Date', type: 'date', required: true, value: wizardState.last_working_date },
          { id: 'wiz_reason', label: 'Reason for Termination', type: 'textarea', fullWidth: true, rows: 3, placeholder: 'Provide reason for termination...', value: wizardState.reason },
        ]);
        modalBody.innerHTML = `
          ${stepIndicator}
          <div style="padding:12px 16px;background:var(--danger-bg);border-radius:8px;margin-bottom:16px;color:var(--danger);font-size:13px">
            ${icon('alertTriangle',14)} This action will terminate the employee and update their status. This cannot be easily reversed.
          </div>
          <div class="form-grid" id="wiz-step1-form">${step1Fields}</div>
        `;
        modalFooter.innerHTML = `
          <button class="btn" data-close-modal>Cancel</button>
          <button class="btn btn-primary" id="wiz-next-1">${icon('arrowRight',14)} Next</button>
        `;
        document.querySelector('.modal-overlay')?.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => UI.closeModal()));
        document.getElementById('wiz-next-1')?.addEventListener('click', async () => {
          const termType = document.getElementById('wiz_term_type')?.value;
          const lastDate = document.getElementById('wiz_last_date')?.value;
          const reason = document.getElementById('wiz_reason')?.value || '';
          if (!termType) { UI.toast('error', 'Required', 'Please select a termination type'); return; }
          if (!lastDate) { UI.toast('error', 'Required', 'Please select a last working date'); return; }
          wizardState.termination_type = termType;
          wizardState.last_working_date = lastDate;
          wizardState.reason = reason;
          wizardStep = 2;
          try {
            const calcRes = await apiPost(`/employees/${employeeId}/termination/calculate`, {
              termination_type: wizardState.termination_type,
              termination_date: wizardState.last_working_date,
            });
            calculatedAmounts = calcRes.data || calcRes;
          } catch (e) {
            calculatedAmounts = { notice_pay: 0, severance_pay: 0, leave_payout: 0, pro_rata_bonus: 0, total_payout: 0 };
          }
          renderWizardStep();
        });
      } else if (wizardStep === 2) {
        const amounts = calculatedAmounts || {};
        modalBody.innerHTML = `
          ${stepIndicator}
          <div style="font-size:14px;font-weight:600;margin-bottom:12px">${icon('dollar',16)} Calculated Termination Payout</div>
          <div class="data-grid">
            <table>
              <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                <tr><td>Notice Period Days</td><td style="text-align:right">${amounts.notice_period_days || 0} days</td></tr>
                <tr><td>Notice Pay</td><td style="text-align:right">${formatCurrency(amounts.notice_pay || 0)}</td></tr>
                <tr><td>Severance Pay</td><td style="text-align:right">${formatCurrency(amounts.severance_pay || 0)}</td></tr>
                <tr><td>Leave Payout</td><td style="text-align:right">${formatCurrency(amounts.leave_payout || 0)}</td></tr>
                <tr><td>Pro-rata Bonus</td><td style="text-align:right">${formatCurrency(amounts.pro_rata_bonus || 0)}</td></tr>
                <tr style="font-weight:700;background:var(--primary-light)"><td>Total Payout</td><td style="text-align:right">${formatCurrency(amounts.total_payout || 0)}</td></tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top:12px;padding:8px 12px;background:#f0f4f8;border-radius:8px;font-size:12px;color:#555">
            ${icon('info',14)} These amounts are auto-calculated based on termination type and date. Final amounts may be adjusted during payroll processing.
          </div>
        `;
        modalFooter.innerHTML = `
          <button class="btn" id="wiz-prev-2">${icon('arrowLeft',14)} Previous</button>
          <button class="btn btn-primary" id="wiz-next-2">${icon('arrowRight',14)} Next</button>
        `;
        document.getElementById('wiz-prev-2')?.addEventListener('click', () => { wizardStep = 1; renderWizardStep(); });
        document.getElementById('wiz-next-2')?.addEventListener('click', () => { wizardStep = 3; renderWizardStep(); });
      } else if (wizardStep === 3) {
        modalBody.innerHTML = `
          ${stepIndicator}
          <div style="font-size:14px;font-weight:600;margin-bottom:12px">${icon('clipboard',16)} Exit Checklist</div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="wiz_chk_equipment" ${wizardState.checklist_equipment ? 'checked' : ''}>
              <span>Return equipment (laptop, phone, keys, cards, uniform)</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="wiz_chk_exit_interview" ${wizardState.checklist_exit_interview ? 'checked' : ''}>
              <span>Exit interview conducted</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="wiz_chk_access" ${wizardState.checklist_access ? 'checked' : ''}>
              <span>IT access revoked</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="wiz_chk_assets" ${wizardState.checklist_assets ? 'checked' : ''}>
              <span>Company assets returned</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="wiz_chk_payslip" ${wizardState.checklist_payslip ? 'checked' : ''}>
              <span>Final payslip issued</span>
            </label>
          </div>
          <div style="margin-top:16px">
            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Exit Interview Notes</label>
            <textarea id="wiz_exit_notes" rows="4" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;resize:vertical" placeholder="Notes from exit interview...">${this.esc(wizardState.exit_interview_notes)}</textarea>
          </div>
        `;
        modalFooter.innerHTML = `
          <button class="btn" id="wiz-prev-3">${icon('arrowLeft',14)} Previous</button>
          <button class="btn btn-primary" id="wiz-next-3">${icon('arrowRight',14)} Next</button>
        `;
        const saveStep3State = () => {
          wizardState.checklist_equipment = document.getElementById('wiz_chk_equipment')?.checked || false;
          wizardState.checklist_exit_interview = document.getElementById('wiz_chk_exit_interview')?.checked || false;
          wizardState.checklist_access = document.getElementById('wiz_chk_access')?.checked || false;
          wizardState.checklist_assets = document.getElementById('wiz_chk_assets')?.checked || false;
          wizardState.checklist_payslip = document.getElementById('wiz_chk_payslip')?.checked || false;
          wizardState.exit_interview_notes = document.getElementById('wiz_exit_notes')?.value || '';
        };
        document.getElementById('wiz-prev-3')?.addEventListener('click', () => {
          saveStep3State();
          wizardStep = 2; renderWizardStep();
        });
        document.getElementById('wiz-next-3')?.addEventListener('click', () => {
          saveStep3State();
          wizardStep = 4; renderWizardStep();
        });
      } else if (wizardStep === 4) {
        const amounts = calculatedAmounts || {};
        const termLabel = termTypes.find(t => t.value === wizardState.termination_type)?.label || wizardState.termination_type;
        modalBody.innerHTML = `
          ${stepIndicator}
          <div style="font-size:14px;font-weight:600;margin-bottom:12px">${icon('check',16)} Confirm Termination</div>
          <div class="info-grid" style="margin-bottom:16px">
            <div class="info-item"><div class="info-label">Employee</div><div class="info-value">${this.esc(emp.first_name)} ${this.esc(emp.surname)} (${this.esc(emp.employee_code)})</div></div>
            <div class="info-item"><div class="info-label">Termination Type</div><div class="info-value">${this.esc(termLabel)}</div></div>
            <div class="info-item"><div class="info-label">Last Working Date</div><div class="info-value">${this.esc(wizardState.last_working_date)}</div></div>
            <div class="info-item"><div class="info-label">Total Payout</div><div class="info-value" style="font-weight:700;color:var(--primary)">${formatCurrency(amounts.total_payout || 0)}</div></div>
            <div class="info-item"><div class="info-label">Equipment Returned</div><div class="info-value">${wizardState.checklist_equipment ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'}</div></div>
            <div class="info-item"><div class="info-label">Exit Interview</div><div class="info-value">${wizardState.checklist_exit_interview ? '<span class="badge badge-success">Conducted</span>' : '<span class="badge badge-danger">Not Done</span>'}</div></div>
            <div class="info-item"><div class="info-label">IT Access Revoked</div><div class="info-value">${wizardState.checklist_access ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'}</div></div>
            <div class="info-item"><div class="info-label">Assets Returned</div><div class="info-value">${wizardState.checklist_assets ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'}</div></div>
            <div class="info-item"><div class="info-label">Final Payslip</div><div class="info-value">${wizardState.checklist_payslip ? '<span class="badge badge-success">Issued</span>' : '<span class="badge badge-danger">Not Issued</span>'}</div></div>
          </div>
          ${wizardState.reason ? `<div style="margin-bottom:12px"><strong>Reason:</strong> ${this.esc(wizardState.reason)}</div>` : ''}
          ${wizardState.exit_interview_notes ? `<div style="margin-bottom:12px"><strong>Exit Interview Notes:</strong> ${this.esc(wizardState.exit_interview_notes)}</div>` : ''}
          <div style="padding:12px 16px;background:var(--danger-bg);border-radius:8px;color:var(--danger);font-size:13px">
            ${icon('alertTriangle',14)} Click "Finalise Termination" to complete the process. This action cannot be undone.
          </div>
        `;
        modalFooter.innerHTML = `
          <button class="btn" id="wiz-prev-4">${icon('arrowLeft',14)} Previous</button>
          <button class="btn" id="wiz-finalise" style="background:var(--danger);color:#fff;border-color:var(--danger)">${icon('check',14)} Finalise Termination</button>
        `;
        document.getElementById('wiz-prev-4')?.addEventListener('click', () => { wizardStep = 3; renderWizardStep(); });
        document.getElementById('wiz-finalise')?.addEventListener('click', async () => {
          try {
            await apiPost(`/employees/${employeeId}/termination/finalise`, {
              termination_type: wizardState.termination_type,
              termination_date: wizardState.last_working_date,
              reason: wizardState.reason,
              checklist_equipment_returned: wizardState.checklist_equipment,
              checklist_exit_interview: wizardState.checklist_exit_interview,
              checklist_access_revoked: wizardState.checklist_access,
              checklist_assets_returned: wizardState.checklist_assets,
              checklist_payslip_issued: wizardState.checklist_payslip,
              exit_interview_notes: wizardState.exit_interview_notes,
              calculated_amounts: calculatedAmounts,
            });
            UI.closeModal();
            UI.toast('success', 'Employee Terminated', `${emp.first_name} ${emp.surname} has been terminated successfully`);
            this.state.currentEmployee = null;
            this.renderList();
          } catch (err) {
            UI.toast('error', 'Error', err.message);
          }
        });
      }
    };

    UI.modal({
      title: `Terminate Employee - ${emp.first_name} ${emp.surname}`,
      size: 'lg',
      content: '',
      footer: '',
    });

    renderWizardStep();
  },

  async renderDependantsTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading dependants...</div>';
    try {
      const data = await api(`/employees/${employeeId}/dependants`);
      const dependants = data.data || [];

      const rows = dependants.map(d => `
        <tr>
          <td>${this.esc(d.first_name)} ${this.esc(d.surname)}</td>
          <td>${this.esc(d.id_number || '-')}</td>
          <td>${this.formatDate(d.date_of_birth) || '-'}</td>
          <td>${this.esc(d.relationship || '-')}</td>
          <td>${this.esc(d.gender || '-')}</td>
          <td>${this.esc(d.disability || 'None')}</td>
          <td>${this.esc(d.contact_number || '-')}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" data-dep-edit="${d.id}" title="Edit">${icon('edit',14)}</button>
              <button class="action-btn danger" data-dep-delete="${d.id}" title="Delete">${icon('trash',14)}</button>
            </div>
          </td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600">${dependants.length} Dependant${dependants.length !== 1 ? 's' : ''}</div>
          <button class="btn btn-primary btn-sm" id="btn-add-dependant">${icon('plus',14)} Add Dependant</button>
        </div>
        ${dependants.length > 0 ? `
          <div class="data-grid">
            <table>
              <thead><tr><th>Name</th><th>ID Number</th><th>Date of Birth</th><th>Relationship</th><th>Gender</th><th>Disability</th><th>Contact</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('users',32), 'No Dependants', 'Add dependants for this employee')}
      `;

      document.getElementById('btn-add-dependant')?.addEventListener('click', () => this.showDependantModal(employeeId));

      content.querySelectorAll('[data-dep-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const dep = dependants.find(d => d.id === parseInt(btn.dataset.depEdit));
          if (dep) this.showDependantModal(employeeId, dep);
        });
      });

      content.querySelectorAll('[data-dep-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const depId = parseInt(btn.dataset.depDelete);
          const confirmed = await UI.confirm({
            title: 'Delete Dependant',
            message: 'Are you sure you want to delete this dependant?',
            icon: icon('alertTriangle', 28),
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true,
          });
          if (!confirmed) return;
          try {
            const res = await fetch(`${API_BASE}/employees/${employeeId}/dependants/${depId}`, { method: 'DELETE' });
            if (!res.ok) { const r = await res.json(); throw new Error(r.error?.message || 'Failed to delete'); }
            UI.toast('success', 'Deleted', 'Dependant has been removed');
            this.renderDependantsTab(employeeId, content);
          } catch (err) {
            UI.toast('error', 'Error', err.message);
          }
        });
      });
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('users',32), 'Dependants Unavailable', err.message);
    }
  },

  showDependantModal(employeeId, dep = null) {
    const isEdit = !!dep;
    const genderOpts = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
    const relOpts = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map(r => ({ value: r, label: r }));

    const fields = UI.buildForm([
      { id: 'dep_first_name', label: 'First Name', required: true, value: dep ? dep.first_name : '' },
      { id: 'dep_surname', label: 'Surname', required: true, value: dep ? dep.surname : '' },
      { id: 'dep_id_number', label: 'ID Number', maxlength: 13, value: dep ? dep.id_number : '' },
      { id: 'dep_date_of_birth', label: 'Date of Birth', type: 'date', value: dep ? this.formatDate(dep.date_of_birth) : '' },
      { id: 'dep_relationship', label: 'Relationship', type: 'select', options: relOpts, required: true, value: dep ? dep.relationship : '' },
      { id: 'dep_gender', label: 'Gender', type: 'select', options: genderOpts, value: dep ? dep.gender : '' },
      { id: 'dep_disability', label: 'Disability', value: dep ? dep.disability : 'None' },
      { id: 'dep_contact_number', label: 'Contact Number', value: dep ? dep.contact_number : '' },
    ]);

    UI.modal({
      title: isEdit ? 'Edit Dependant' : 'Add Dependant',
      size: 'sm',
      content: `<div class="form-grid" id="dependant-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-save-dependant">${isEdit ? 'Update' : 'Save'}</button>
      `,
    });

    document.getElementById('btn-save-dependant').addEventListener('click', async () => {
      const form = document.getElementById('dependant-form');
      const v = UI.validateForm(form);
      if (!v.valid) { UI.toast('error', 'Validation Error', v.errors.join(', ')); return; }
      const data = UI.getFormData(form);

      const payload = {
        first_name: data.dep_first_name,
        surname: data.dep_surname,
        id_number: data.dep_id_number,
        date_of_birth: data.dep_date_of_birth,
        relationship: data.dep_relationship,
        gender: data.dep_gender,
        disability: data.dep_disability,
        contact_number: data.dep_contact_number,
      };

      try {
        const url = isEdit
          ? `${API_BASE}/employees/${employeeId}/dependants/${dep.id}`
          : `${API_BASE}/employees/${employeeId}/dependants`;
        const res = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error?.message || 'Failed to save dependant');
        UI.closeModal();
        UI.toast('success', isEdit ? 'Updated' : 'Added', `Dependant ${isEdit ? 'updated' : 'added'} successfully`);
        const content = document.getElementById('emp-detail-content');
        if (content) this.renderDependantsTab(employeeId, content);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async renderEmergencyTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading emergency contacts...</div>';
    try {
      const data = await api(`/employees/${employeeId}/emergency-contacts`);
      const contacts = data.data || [];

      const rows = contacts.map(c => `
        <tr>
          <td>${this.esc(c.contact_name)}</td>
          <td>${this.esc(c.relationship || '-')}</td>
          <td>${this.esc(c.phone_primary || '-')}</td>
          <td>${this.esc(c.phone_secondary || '-')}</td>
          <td>${this.esc(c.email || '-')}</td>
          <td>${c.is_primary ? '<span class="badge badge-success">Primary</span>' : ''}</td>
          <td>
            <div class="action-bar">
              <button class="action-btn" data-ec-edit="${c.id}" title="Edit">${icon('edit',14)}</button>
              <button class="action-btn danger" data-ec-delete="${c.id}" title="Delete">${icon('trash',14)}</button>
            </div>
          </td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600">${contacts.length} Emergency Contact${contacts.length !== 1 ? 's' : ''}</div>
          <button class="btn btn-primary btn-sm" id="btn-add-emergency">${icon('plus',14)} Add Contact</button>
        </div>
        ${contacts.length > 0 ? `
          <div class="data-grid">
            <table>
              <thead><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Alt Phone</th><th>Email</th><th>Primary</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('phone',32), 'No Emergency Contacts', 'Add emergency contacts for this employee')}
      `;

      document.getElementById('btn-add-emergency')?.addEventListener('click', () => this.showEmergencyModal(employeeId));

      content.querySelectorAll('[data-ec-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const ec = contacts.find(c => c.id === parseInt(btn.dataset.ecEdit));
          if (ec) this.showEmergencyModal(employeeId, ec);
        });
      });

      content.querySelectorAll('[data-ec-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const ecId = parseInt(btn.dataset.ecDelete);
          const confirmed = await UI.confirm({
            title: 'Delete Emergency Contact',
            message: 'Are you sure you want to delete this emergency contact?',
            icon: icon('alertTriangle', 28),
            confirmText: 'Delete',
            cancelText: 'Cancel',
            danger: true,
          });
          if (!confirmed) return;
          try {
            const res = await fetch(`${API_BASE}/employees/${employeeId}/emergency-contacts/${ecId}`, { method: 'DELETE' });
            if (!res.ok) { const r = await res.json(); throw new Error(r.error?.message || 'Failed to delete'); }
            UI.toast('success', 'Deleted', 'Emergency contact has been removed');
            this.renderEmergencyTab(employeeId, content);
          } catch (err) {
            UI.toast('error', 'Error', err.message);
          }
        });
      });
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('phone',32), 'Emergency Contacts Unavailable', err.message);
    }
  },

  showEmergencyModal(employeeId, ec = null) {
    const isEdit = !!ec;
    const relOpts = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map(r => ({ value: r, label: r }));

    const fields = UI.buildForm([
      { id: 'ec_contact_name', label: 'Contact Name', required: true, value: ec ? ec.contact_name : '' },
      { id: 'ec_relationship', label: 'Relationship', type: 'select', options: relOpts, required: true, value: ec ? ec.relationship : '' },
      { id: 'ec_phone_primary', label: 'Phone Number', required: true, value: ec ? ec.phone_primary : '', placeholder: '0XX XXX XXXX' },
      { id: 'ec_phone_secondary', label: 'Alt Phone Number', value: ec ? ec.phone_secondary : '' },
      { id: 'ec_email', label: 'Email Address', type: 'email', value: ec ? ec.email : '' },
      { id: 'ec_address', label: 'Address', value: ec ? ec.address : '' },
      { id: 'ec_is_primary', label: 'Primary Contact', type: 'checkbox', checkLabel: 'This is the primary emergency contact', value: ec ? ec.is_primary : false },
    ]);

    UI.modal({
      title: isEdit ? 'Edit Emergency Contact' : 'Add Emergency Contact',
      size: 'sm',
      content: `<div class="form-grid" id="emergency-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-save-emergency">${isEdit ? 'Update' : 'Save'}</button>
      `,
    });

    document.getElementById('btn-save-emergency').addEventListener('click', async () => {
      const form = document.getElementById('emergency-form');
      const v = UI.validateForm(form);
      if (!v.valid) { UI.toast('error', 'Validation Error', v.errors.join(', ')); return; }
      const data = UI.getFormData(form);

      const payload = {
        contact_name: data.ec_contact_name,
        relationship: data.ec_relationship,
        phone_primary: data.ec_phone_primary,
        phone_secondary: data.ec_phone_secondary,
        email: data.ec_email,
        address: data.ec_address,
        is_primary: data.ec_is_primary || false,
      };

      try {
        if (isEdit) {
          const res = await fetch(`${API_BASE}/employees/${employeeId}/emergency-contacts/${ec.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error?.message || 'Failed to update emergency contact');
        } else {
          await apiPost(`/employees/${employeeId}/emergency-contacts`, payload);
        }
        UI.closeModal();
        UI.toast('success', isEdit ? 'Updated' : 'Added', `Emergency contact ${isEdit ? 'updated' : 'added'} successfully`);
        const content = document.getElementById('emp-detail-content');
        if (content) this.renderEmergencyTab(employeeId, content);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async renderQualificationsTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading qualifications...</div>';
    try {
      const data = await api(`/employees/${employeeId}/qualifications`);
      const quals = data.data || [];

      const rows = quals.map(q => `
        <tr>
          <td>${this.esc(q.qualification_name)}</td>
          <td>${this.esc(q.institution || '-')}</td>
          <td>${this.esc(q.year_obtained || '-')}</td>
          <td>${q.nqf_level ? 'NQF ' + this.esc(q.nqf_level) : '-'}</td>
          <td>${this.esc(q.qualification_type || '-')}</td>
          <td>${this.esc(q.document_reference || '-')}</td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600">${quals.length} Qualification${quals.length !== 1 ? 's' : ''}</div>
          <button class="btn btn-primary btn-sm" id="btn-add-qualification">${icon('plus',14)} Add Qualification</button>
        </div>
        ${quals.length > 0 ? `
          <div class="data-grid">
            <table>
              <thead><tr><th>Qualification</th><th>Institution</th><th>Year</th><th>NQF Level</th><th>Type</th><th>Reference</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('award',32), 'No Qualifications', 'Add qualifications for this employee')}
      `;

      document.getElementById('btn-add-qualification')?.addEventListener('click', () => this.showQualificationModal(employeeId));
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('award',32), 'Qualifications Unavailable', err.message);
    }
  },

  showQualificationModal(employeeId) {
    const nqfOpts = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `NQF ${i + 1}` }));
    const typeOpts = ['Certificate', 'Diploma', 'Degree', 'Honours', 'Masters', 'Doctorate', 'Other'].map(t => ({ value: t, label: t }));

    const fields = UI.buildForm([
      { id: 'qual_name', label: 'Qualification Name', required: true },
      { id: 'qual_institution', label: 'Institution', required: true },
      { id: 'qual_year', label: 'Year Obtained', type: 'number', min: 1950, max: new Date().getFullYear(), required: true },
      { id: 'qual_nqf', label: 'NQF Level', type: 'select', options: nqfOpts },
      { id: 'qual_type', label: 'Qualification Type', type: 'select', options: typeOpts },
    ]);

    UI.modal({
      title: 'Add Qualification',
      size: 'sm',
      content: `<div class="form-grid" id="qualification-form">${fields}</div>`,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <button class="btn btn-primary" id="btn-save-qualification">Save</button>
      `,
    });

    document.getElementById('btn-save-qualification').addEventListener('click', async () => {
      const form = document.getElementById('qualification-form');
      const v = UI.validateForm(form);
      if (!v.valid) { UI.toast('error', 'Validation Error', v.errors.join(', ')); return; }
      const data = UI.getFormData(form);

      try {
        const res = await apiPost('/skills/qualifications', {
          employee_id: employeeId,
          qualification_name: data.qual_name,
          institution: data.qual_institution,
          year_obtained: data.qual_year,
          nqf_level: data.qual_nqf,
          qualification_type: data.qual_type,
        });
        UI.closeModal();
        UI.toast('success', 'Added', 'Qualification added successfully');
        const content = document.getElementById('emp-detail-content');
        if (content) this.renderQualificationsTab(employeeId, content);
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async renderSuccessionTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading succession data...</div>';
    try {
      const data = await api(`/employees/${employeeId}/succession`);
      const pools = data.data || [];

      if (pools.length === 0) {
        content.innerHTML = UI.emptyState(icon('trendingUp',32), 'No Succession Plans', 'This employee is not currently in any succession pool');
        return;
      }

      const rows = pools.map(p => `
        <tr>
          <td>${this.esc(p.pool_name || p.position_title || '-')}</td>
          <td>${this.esc(p.position_code || '-')}</td>
          <td><span class="badge badge-${p.readiness === 'READY' ? 'success' : p.readiness === 'DEVELOPING' ? 'warning' : 'info'}">${this.esc(p.readiness || '-')}</span></td>
          <td>${this.esc(p.development_areas || '-')}</td>
          <td>${this.esc(p.mentor_name || '-')}</td>
          <td>${this.formatDate(p.target_date) || '-'}</td>
        </tr>
      `).join('');

      content.innerHTML = `
        <div style="font-size:14px;font-weight:600;margin-bottom:16px">${pools.length} Succession Pool${pools.length !== 1 ? 's' : ''}</div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Position / Pool</th><th>Code</th><th>Readiness</th><th>Development Areas</th><th>Mentor</th><th>Target Date</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('trendingUp',32), 'Succession Data Unavailable', err.message);
    }
  },

  async renderDocumentsTab(employeeId, content) {
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading documents...</div>';
    try {
      const data = await api(`/employees/${employeeId}/documents`);
      const docs = data.data || [];

      const rows = docs.map(d => `
        <tr>
          <td>${icon('fileText',14)} ${this.esc(d.name || d.file_name || '')}</td>
          <td>${this.esc(d.document_type || d.type || '-')}</td>
          <td>${this.formatDate(d.uploaded_at || d.created_at) || '-'}</td>
          <td>
            <div class="action-bar">
              ${d.file_url ? `<a href="${this.esc(d.file_url)}" target="_blank" class="action-btn" title="Download">${icon('download',14)}</a>` : ''}
            </div>
          </td>
        </tr>
      `).join('');

      content.innerHTML = `
        ${docs.length > 0 ? `
          <div class="data-grid">
            <table>
              <thead><tr><th>Document</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        ` : UI.emptyState(icon('file',32), 'No Documents', 'No documents uploaded for this employee')}
      `;
    } catch (err) {
      content.innerHTML = UI.emptyState(icon('file',32), 'Documents Unavailable', err.message);
    }
  },


  infoItem(label, value) {
    return `<div class="info-item"><div class="info-label">${label}</div><div class="info-value">${this.esc(value) || '-'}</div></div>`;
  },

  formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toISOString().split('T')[0];
  },

  getProbationBadge(emp) {
    if (!emp || emp.status !== 'ACTIVE') return '';
    if (emp.probation_status === 'ON_PROBATION') {
      const probEnd = emp.probation_end_date || emp.probation_end;
      if (probEnd) {
        const end = new Date(probEnd);
        const now = new Date();
        if (!isNaN(end) && end >= now) {
          const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30) {
            return ` <span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px;background:#c9a84c;color:#fff">${icon('clock',10)} On Probation (${daysLeft}d)</span>`;
          }
          return ` <span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px;background:#c9a84c;color:#fff">${icon('clock',10)} On Probation</span>`;
        }
      }
      return ` <span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px;background:#c9a84c;color:#fff">${icon('clock',10)} On Probation</span>`;
    }
    const probEnd = emp.probation_end_date || emp.probation_end;
    if (!probEnd) return '';
    const end = new Date(probEnd);
    const now = new Date();
    if (isNaN(end) || end < now) return '';
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) {
      return ` <span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px;background:#c9a84c;color:#fff">${icon('clock',10)} On Probation (${daysLeft}d)</span>`;
    }
    if (daysLeft <= 90) {
      return ` <span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px;background:#c9a84c;color:#fff">${icon('clock',10)} On Probation</span>`;
    }
    return '';
  },

  showImportModal() {
    UI.modal({
      title: 'Import Employees',
      size: 'lg',
      content: `
        <div style="margin-bottom:20px">
          <div style="font-size:14px;font-weight:600;margin-bottom:8px">${icon('upload',16)} Upload Employee Data</div>
          <p style="font-size:13px;color:var(--text-muted);margin:0 0 16px">Upload a CSV or Excel file to bulk-import employees. The file must include the required columns listed below.</p>
        </div>
        <div style="padding:16px;background:#f8f9fb;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Required Columns</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${['employee_code','first_name','surname','id_number','date_of_birth','gender','start_date','position_title','department_name','annual_salary'].map(c => `<span class="badge badge-info" style="font-size:11px">${c}</span>`).join('')}
          </div>
        </div>
        <div style="padding:16px;background:#f8f9fb;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;margin-bottom:8px">Optional Columns</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${['title','email','phone','tax_number','bank_name','bank_account_number','bank_branch_code','employee_type','race','disability','marital_status'].map(c => `<span class="badge" style="font-size:11px;background:#E2E8F0;color:#475569">${c}</span>`).join('')}
          </div>
        </div>
        <div style="border:2px dashed var(--border);border-radius:8px;padding:32px;text-align:center;cursor:pointer;transition:border-color 0.2s" id="import-drop-zone">
          ${icon('upload',32)}
          <div style="font-size:14px;font-weight:600;margin-top:8px">Drop file here or click to browse</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Accepted formats: .csv, .xlsx</div>
          <input type="file" id="import-file-input" accept=".csv,.xlsx" style="display:none">
        </div>
        <div id="import-file-name" style="margin-top:8px;font-size:13px;color:var(--text-muted)"></div>
        <div id="import-preview" style="margin-top:16px"></div>
      `,
      footer: `
        <button class="btn" data-close-modal>Cancel</button>
        <a href="${API_BASE}/employees/import/template" class="btn" style="text-decoration:none">${icon('download',14)} Download Template</a>
        <button class="btn btn-primary" id="btn-do-import" disabled>${icon('upload',14)} Import</button>
      `,
    });

    const dropZone = document.getElementById('import-drop-zone');
    const fileInput = document.getElementById('import-file-input');
    const fileNameEl = document.getElementById('import-file-name');
    const importBtn = document.getElementById('btn-do-import');
    let selectedFile = null;

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--primary)'; });
      dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = 'var(--border)'; });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border)';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
      });
    }

    const handleFile = (file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx'].includes(ext)) {
        UI.toast('error', 'Invalid File', 'Please select a CSV or XLSX file');
        return;
      }
      selectedFile = file;
      if (fileNameEl) fileNameEl.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (importBtn) importBtn.disabled = false;
    };

    if (importBtn) {
      importBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        importBtn.disabled = true;
        importBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px"></div> Importing...';
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch(`${API_BASE}/employees/import`, {
            method: 'POST',
            body: formData,
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error?.message || 'Import failed');
          const imported = result.data?.imported || result.imported || 0;
          const errors = result.data?.errors || result.errors || [];
          UI.closeModal();
          if (errors.length > 0) {
            UI.toast('warning', 'Import Completed', `${imported} employees imported, ${errors.length} rows had errors`);
          } else {
            UI.toast('success', 'Import Successful', `${imported} employees imported successfully`);
          }
          this.renderList();
        } catch (err) {
          UI.toast('error', 'Import Failed', err.message);
          importBtn.disabled = false;
          importBtn.innerHTML = `${icon('upload',14)} Import`;
        }
      });
    }
  },

  esc(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
