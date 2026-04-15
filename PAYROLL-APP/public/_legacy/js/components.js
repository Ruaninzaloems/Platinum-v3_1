const UI = {
  toastContainer: null,

  init() {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  },

  toast(type, title, message, duration = 4000) {
    this.init();
    const toastIcons = {
      success: typeof icon === 'function' ? icon('check', 18) : '',
      error: typeof icon === 'function' ? icon('alertTriangle', 18) : '',
      warning: typeof icon === 'function' ? icon('alertTriangle', 18) : '',
      info: typeof icon === 'function' ? icon('shield', 18) : ''
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${toastIcons[type] || ''}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">\u00D7</button>
    `;
    this.toastContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
  },

  modal({ title, content, size = '', footer = '', onClose = null }) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ${size ? 'modal-' + size : ''}">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" data-close-modal>\u00D7</button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    overlay.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => this.closeModal()));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
    if (onClose) overlay._onClose = onClose;
    return overlay;
  },

  closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      if (overlay._onClose) overlay._onClose();
      setTimeout(() => overlay.remove(), 200);
    }
  },

  confirm({ title, message, icon, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    if (icon === undefined || icon === '') icon = typeof window.icon === 'function' ? window.icon('alertTriangle', 32) : '';
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <div class="confirm-icon">${icon}</div>
          <div class="confirm-title">${title}</div>
          <div class="confirm-message">${message}</div>
          <div class="confirm-actions">
            <button class="btn" data-cancel>${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('[data-cancel]').addEventListener('click', () => { overlay.remove(); resolve(false); });
      overlay.querySelector('[data-confirm]').addEventListener('click', () => { overlay.remove(); resolve(true); });
    });
  },

  buildForm(fields) {
    return fields.map(f => {
      const cls = f.fullWidth ? 'form-group full-width' : 'form-group';
      const req = f.required ? '<span class="required">*</span>' : '';
      const hint = f.hint ? `<div class="form-hint">${f.hint}</div>` : '';
      let input = '';
      switch (f.type) {
        case 'select':
          const opts = (f.options || []).map(o => 
            typeof o === 'object' 
              ? `<option value="${o.value}" ${f.value == o.value ? 'selected' : ''}>${o.label}</option>`
              : `<option value="${o}" ${f.value == o ? 'selected' : ''}>${o}</option>`
          ).join('');
          input = `<select class="form-control" id="${f.id}" name="${f.name || f.id}" ${f.required ? 'required' : ''} ${f.disabled ? 'disabled' : ''}><option value="">-- Select --</option>${opts}</select>`;
          break;
        case 'textarea':
          input = `<textarea class="form-control" id="${f.id}" name="${f.name || f.id}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" rows="${f.rows || 3}">${f.value || ''}</textarea>`;
          break;
        case 'checkbox':
          input = `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="${f.id}" name="${f.name || f.id}" ${f.value ? 'checked' : ''} style="width:16px;height:16px"> ${f.checkLabel || ''}</label>`;
          break;
        case 'date':
          input = `<input type="date" class="form-control" id="${f.id}" name="${f.name || f.id}" value="${f.value || ''}" ${f.required ? 'required' : ''} ${f.min ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''}>`;
          break;
        case 'number':
          input = `<input type="number" class="form-control" id="${f.id}" name="${f.name || f.id}" value="${f.value || ''}" ${f.required ? 'required' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} step="${f.step || 'any'}" placeholder="${f.placeholder || ''}">`;
          break;
        case 'readonly':
          input = `<input type="text" class="form-control" id="${f.id}" value="${f.value || ''}" disabled>`;
          break;
        case 'section':
          return `<div class="form-section-title full-width">${f.icon || ''} ${f.label}</div>`;
        default:
          input = `<input type="${f.type || 'text'}" class="form-control" id="${f.id}" name="${f.name || f.id}" value="${f.value || ''}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" ${f.maxlength ? `maxlength="${f.maxlength}"` : ''} ${f.pattern ? `pattern="${f.pattern}"` : ''} ${f.disabled ? 'disabled' : ''}>`;
      }
      return `<div class="${cls}"><label for="${f.id}">${f.label}${req}</label>${input}${hint}</div>`;
    }).join('');
  },

  getFormData(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) || document.querySelector(containerId) : containerId;
    if (!container) return {};
    const data = {};
    container.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.name && !el.id) return;
      const key = el.name || el.id;
      if (el.type === 'checkbox') data[key] = el.checked;
      else if (el.type === 'number') data[key] = el.value === '' ? null : parseFloat(el.value);
      else data[key] = el.value || null;
    });
    return data;
  },

  validateForm(containerId) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) || document.querySelector(containerId) : containerId;
    if (!container) return { valid: false, errors: ['Container not found'] };
    let valid = true;
    const errors = [];
    container.querySelectorAll('.form-error').forEach(e => e.remove());
    container.querySelectorAll('.form-control').forEach(el => {
      el.classList.remove('error');
      if (el.required && !el.value.trim()) {
        el.classList.add('error');
        const label = el.closest('.form-group')?.querySelector('label')?.textContent?.replace('*', '').trim() || el.name;
        errors.push(`${label} is required`);
        valid = false;
      }
    });
    if (!valid && errors.length > 0) {
      const firstError = container.querySelector('.form-control.error');
      if (firstError) firstError.focus();
    }
    return { valid, errors };
  },

  toolbar({ searchPlaceholder = 'Search...', filters = [], onSearch, onFilter, actions = [] }) {
    const filterHtml = filters.map(f => {
      const opts = f.options.map(o => typeof o === 'object' ? `<option value="${o.value}">${o.label}</option>` : `<option value="${o}">${o}</option>`).join('');
      return `<select data-filter="${f.key}" class="toolbar-filter-select">${opts}</select>`;
    }).join('');
    const actionsHtml = actions.map(a => `<button class="btn ${a.class || ''}" onclick="${a.onclick}">${a.icon || ''} ${a.label}</button>`).join('');
    return `
      <div class="toolbar">
        <div class="toolbar-search"><input type="text" placeholder="${searchPlaceholder}" data-search></div>
        <div class="toolbar-filter">${filterHtml}</div>
        ${actionsHtml}
      </div>
    `;
  },

  pagination({ page, limit, total, onPageChange }) {
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    let pageButtons = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pageButtons += `<button class="${i === page ? 'active' : ''}" onclick="${onPageChange}(${i})">${i}</button>`;
    }
    if (totalPages > 5) pageButtons += `<span style="padding:0 4px">...</span><button onclick="${onPageChange}(${totalPages})">${totalPages}</button>`;
    return `
      <div class="pagination">
        <div class="pagination-info">Showing ${start}-${end} of ${total}</div>
        <div class="pagination-controls">
          <button ${page <= 1 ? 'disabled' : ''} onclick="${onPageChange}(${page - 1})">\u2190</button>
          ${pageButtons}
          <button ${page >= totalPages ? 'disabled' : ''} onclick="${onPageChange}(${page + 1})">\u2192</button>
        </div>
      </div>
    `;
  },

  detailTabs(tabs, activeTab) {
    const tabsHtml = tabs.map(t => `<div class="detail-tab ${t.id === activeTab ? 'active' : ''}" data-detail-tab="${t.id}">${t.icon || ''} ${t.label}</div>`).join('');
    return `<div class="detail-tabs">${tabsHtml}</div>`;
  },

  emptyState(icon, title, desc) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-desc">${desc}</div></div>`;
  },

  workflowSteps(steps) {
    return `<div class="workflow-steps">${steps.map((s, i) => `
      ${i > 0 ? '<div class="workflow-arrow">\u2192</div>' : ''}
      <div class="workflow-step ${s.status}">
        <div class="step-circle">${s.count !== undefined ? s.count : s.icon || (i + 1)}</div>
        <div class="step-name">${s.label}</div>
      </div>
    `).join('')}</div>`;
  },

  statCards(cards) {
    return `<div class="stat-cards">${cards.map(c => `
      <div class="stat-card">
        <div class="stat-value" style="${c.color ? 'color:' + c.color : ''}">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>
    `).join('')}</div>`;
  }
};
