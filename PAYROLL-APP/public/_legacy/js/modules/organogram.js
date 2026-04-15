const OrganogramModule = {
  state: {
    positions: [],
    stats: {},
    departments: [],
    taskGrades: [],
    jobProfiles: [],
    tree: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    filterDept: '',
    searchTerm: '',
    expandedNodes: new Set(),
    selectedNode: null,
    viewMode: 'tree',
  },

  DEPT_COLORS: [
    { bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
    { bg: '#ecfdf5', border: '#10b981', text: '#065f46' },
    { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
    { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
    { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
    { bg: '#fefce8', border: '#eab308', text: '#854d0e' },
    { bg: '#f0fdfa', border: '#14b8a6', text: '#134e4a' },
    { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' },
    { bg: '#fff1f2', border: '#fb7185', text: '#9f1239' },
  ],

  getDeptColor(deptName) {
    if (!deptName) return this.DEPT_COLORS[0];
    const depts = [...new Set(this.state.positions.map(p => p.department_name).filter(Boolean))].sort();
    const idx = depts.indexOf(deptName);
    return this.DEPT_COLORS[idx % this.DEPT_COLORS.length];
  },

  async render(el) {
    this.el = el;
    await this.loadData();
    this.renderView();
  },

  async loadData() {
    try {
      const [orgData, depts, grades, profiles, vacantData] = await Promise.all([
        api('/positions/organogram'),
        api('/departments'),
        api('/positions/task-grades'),
        api('/positions/job-profiles'),
        api('/positions/vacant').catch(() => ({ data: [] })),
      ]);
      this.state.positions = orgData.data || [];
      this.state.stats = orgData.stats || {};
      this.state.departments = depts.data || [];
      this.state.taskGrades = grades.data || [];
      this.state.jobProfiles = profiles.data || [];
      this.state.vacantPositions = vacantData.data || [];
      this.buildTree();
    } catch (e) {
      console.error('Organogram load error:', e);
    }
  },

  getRecruitmentStatus(positionId) {
    const vp = (this.state.vacantPositions || []).find(v => v.id === positionId);
    if (!vp || !vp.vacancy_id) return { status: 'NO_VACANCY', label: 'No Vacancy', color: '#94a3b8', bg: '#f1f5f9' };
    const rs = (vp.recruitment_status || '').toUpperCase();
    if (rs === 'INTERVIEWING') return { status: rs, label: 'Interviewing', color: '#8b5cf6', bg: '#f5f3ff' };
    if (rs === 'SHORTLISTING') return { status: rs, label: 'Shortlisting', color: '#3b82f6', bg: '#eff6ff' };
    if (rs === 'OFFERED') return { status: rs, label: 'Offered', color: '#f97316', bg: '#fff7ed' };
    if (rs === 'OPEN') return { status: rs, label: 'Open', color: '#10b981', bg: '#ecfdf5' };
    if (rs === 'DRAFT') return { status: rs, label: 'Draft', color: '#6b7280', bg: '#f9fafb' };
    return { status: rs, label: rs, color: '#6b7280', bg: '#f9fafb' };
  },

  buildTree() {
    const positions = this.state.positions;
    const map = {};
    positions.forEach(p => { map[p.id] = { ...p, children: [] }; });

    let roots = [];
    positions.forEach(p => {
      const node = map[p.id];
      if (p.parent_position_id && map[p.parent_position_id]) {
        map[p.parent_position_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    if (roots.length > 1) {
      this.state.tree = { id: 'root', title: 'Municipality', status: 'FILLED', children: roots, isVirtualRoot: true };
    } else if (roots.length === 1) {
      this.state.tree = roots[0];
    } else {
      this.state.tree = null;
    }

    positions.forEach(p => {
      if (map[p.id].children.length > 0) {
        this.state.expandedNodes.add(p.id);
      }
    });
    if (this.state.tree && !this.state.tree.isVirtualRoot) {
      this.state.expandedNodes.add(this.state.tree.id);
    }
    if (this.state.tree && this.state.tree.isVirtualRoot) {
      this.state.expandedNodes.add('root');
    }
  },

  renderView() {
    const s = this.state.stats;
    const deptOptions = this.state.departments.map(d =>
      `<option value="${d.id}" ${this.state.filterDept == d.id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    this.el.innerHTML = `
      <div class="org-toolbar">
        <div class="org-toolbar-left">
          <div class="org-search-wrap">
            ${icon('search', 16)}
            <input type="text" class="org-search" placeholder="Search positions or employees..." value="${this.state.searchTerm}" />
          </div>
          <select class="org-dept-filter">
            <option value="">All Departments</option>
            ${deptOptions}
          </select>
          <div class="org-view-toggle">
            <button class="org-view-btn ${this.state.viewMode === 'tree' ? 'active' : ''}" data-view="tree" title="Tree View">
              ${icon('grid', 16)} Tree
            </button>
            <button class="org-view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" data-view="list" title="List View">
              ${icon('fileText', 16)} List
            </button>
          </div>
        </div>
        <div class="org-toolbar-right">
          <button class="btn btn-sm org-btn-add" title="Add Position">${icon('plus', 14)} New Post</button>
          <button class="btn btn-sm org-btn-expand" title="Expand All">${icon('chevronRight', 14)} Expand All</button>
          <button class="btn btn-sm org-btn-collapse" title="Collapse All">${icon('chevronRight', 14)} Collapse</button>
          <button class="btn btn-sm org-btn-print" title="Print">${icon('download', 14)} Export</button>
        </div>
      </div>

      <div class="org-stats-bar">
        <div class="org-stat">
          <span class="org-stat-icon org-stat-total">${icon('briefcase', 16)}</span>
          <span class="org-stat-value">${s.total || 0}</span>
          <span class="org-stat-label">Total Posts</span>
        </div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-filled">${icon('user', 16)}</span>
          <span class="org-stat-value">${s.filled || 0}</span>
          <span class="org-stat-label">Filled</span>
        </div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-vacant">${icon('users', 16)}</span>
          <span class="org-stat-value">${s.vacant || 0}</span>
          <span class="org-stat-label">Vacant</span>
        </div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-frozen">${icon('lock', 16)}</span>
          <span class="org-stat-value">${s.frozen || 0}</span>
          <span class="org-stat-label">Frozen</span>
        </div>
        <div class="org-stat-divider"></div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-funded">${icon('dollar', 16)}</span>
          <span class="org-stat-value">${s.funded || 0}</span>
          <span class="org-stat-label">Funded</span>
        </div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-depts">${icon('home', 16)}</span>
          <span class="org-stat-value">${s.departments || 0}</span>
          <span class="org-stat-label">Departments</span>
        </div>
        <div class="org-stat">
          <span class="org-stat-icon org-stat-hod">${icon('shield', 16)}</span>
          <span class="org-stat-value">${s.hod_count || 0}</span>
          <span class="org-stat-label">HODs</span>
        </div>
        <div class="org-vacancy-rate">
          <div class="org-vacancy-bar">
            <div class="org-vacancy-fill" style="width: ${s.total ? Math.round((s.filled / s.total) * 100) : 0}%"></div>
          </div>
          <span class="org-vacancy-text">${s.total ? Math.round((s.filled / s.total) * 100) : 0}% Fill Rate</span>
        </div>
      </div>

      ${this.state.viewMode === 'tree' ? this.renderTreeContainer() : this.renderListView()}

      <div class="org-legend">
        <span class="org-legend-item"><span class="org-legend-dot org-legend-filled"></span> Filled</span>
        <span class="org-legend-item"><span class="org-legend-dot org-legend-vacant"></span> Vacant</span>
        <span class="org-legend-item"><span class="org-legend-dot org-legend-frozen"></span> Frozen</span>
        <span class="org-legend-item"><span class="org-legend-dot org-legend-abolished"></span> Abolished</span>
        <span class="org-legend-item"><span class="org-legend-dot org-legend-hod"></span> HOD</span>
      </div>
    `;

    this.bindEvents();
    if (this.state.viewMode === 'tree') this.initPanZoom();
  },

  renderTreeContainer() {
    if (!this.state.tree) {
      return `<div class="org-empty">
        <div class="org-empty-icon">${icon('briefcase', 48)}</div>
        <h3>No Positions Found</h3>
        <p>Create positions in the Staff Establishment to build the organogram.</p>
      </div>`;
    }
    return `
      <div class="org-canvas-container">
        <div class="org-zoom-controls">
          <button class="org-zoom-btn" data-zoom="in" title="Zoom In">+</button>
          <span class="org-zoom-level">${Math.round(this.state.zoom * 100)}%</span>
          <button class="org-zoom-btn" data-zoom="out" title="Zoom Out">&minus;</button>
          <button class="org-zoom-btn" data-zoom="fit" title="Fit to View">${icon('grid', 14)}</button>
        </div>
        <div class="org-canvas" id="org-canvas">
          <div class="org-tree" id="org-tree" style="transform: scale(${this.state.zoom}) translate(${this.state.panX}px, ${this.state.panY}px)">
            ${this.renderTreeNode(this.state.tree, 0)}
          </div>
        </div>
      </div>`;
  },

  renderTreeNode(node, depth) {
    if (!node) return '';
    const isExpanded = this.state.expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isVacant = node.status === 'VACANT';
    const isFrozen = node.status === 'FROZEN';
    const isAbolished = node.status === 'ABOLISHED';
    const isSelected = this.state.selectedNode === node.id;
    const deptColor = this.getDeptColor(node.department_name);

    const filtered = this.isNodeFiltered(node);
    if (filtered) return '';

    let statusClass = 'org-node-filled';
    if (isVacant) statusClass = 'org-node-vacant';
    else if (isFrozen) statusClass = 'org-node-frozen';
    else if (isAbolished) statusClass = 'org-node-abolished';

    const photoHtml = this.renderAvatar(node);
    const childCount = this.countDescendants(node);

    let childrenHtml = '';
    if (hasChildren && isExpanded) {
      const visibleChildren = node.children.filter(c => !this.isNodeFiltered(c));
      if (visibleChildren.length > 0) {
        childrenHtml = `<div class="org-children">
          ${visibleChildren.map(c => this.renderTreeNode(c, depth + 1)).join('')}
        </div>`;
      }
    }

    return `
      <div class="org-branch">
        <div class="org-node ${statusClass} ${node.is_hod ? 'org-node-hod' : ''} ${isSelected ? 'org-node-selected' : ''} ${node.isVirtualRoot ? 'org-node-root' : ''}"
             data-id="${node.id}" style="--dept-color: ${deptColor.border}; --dept-bg: ${deptColor.bg}">
          <div class="org-node-header" style="background: ${deptColor.bg}; border-bottom: 2px solid ${deptColor.border}">
            <span class="org-node-dept" style="color: ${deptColor.text}">${node.department_name || 'Municipality'}</span>
            ${node.is_hod ? `<span class="org-node-hod-badge">HOD</span>` : ''}
            ${!node.funded && !node.isVirtualRoot ? `<span class="org-node-unfunded-badge">UNFUNDED</span>` : ''}
          </div>
          <div class="org-node-body">
            <div class="org-node-avatar-section">
              ${photoHtml}
              ${isVacant ? `<span class="org-node-status-label org-status-vacant">VACANT</span>` : ''}
              ${isFrozen ? `<span class="org-node-status-label org-status-frozen">FROZEN</span>` : ''}
              ${isAbolished ? `<span class="org-node-status-label org-status-abolished">ABOLISHED</span>` : ''}
              ${isVacant ? (() => { const rs = this.getRecruitmentStatus(node.id); return `<span class="org-node-recruit-status" style="font-size:10px;padding:2px 6px;border-radius:4px;background:${rs.bg};color:${rs.color};font-weight:600;margin-top:4px;display:inline-block">${rs.label}</span>`; })() : ''}
            </div>
            <div class="org-node-info">
              <div class="org-node-title">${node.title || 'Untitled Position'}</div>
              ${node.employee_id ? `
                <div class="org-node-name">${node.first_name || ''} ${node.surname || ''}</div>
                <div class="org-node-code">${node.employee_code || ''}</div>
              ` : `
                <div class="org-node-name org-node-name-vacant">Position Vacant</div>
                <div class="org-node-code">${node.position_code || ''}</div>
              `}
              ${node.grade_code ? `<div class="org-node-grade">Grade: ${node.grade_code}</div>` : ''}
            </div>
          </div>
          <div class="org-node-footer">
            <div class="org-node-actions">
              ${!node.isVirtualRoot ? `
                <button class="org-action-btn" data-action="view" data-id="${node.id}" title="View Details">${icon('eye', 13)}</button>
                <button class="org-action-btn" data-action="edit" data-id="${node.id}" title="Edit Position">${icon('edit', 13)}</button>
                ${isVacant ? `<button class="org-action-btn org-action-recruit" data-action="recruit" data-id="${node.id}" title="Recruit">${icon('plus', 13)}</button>` : ''}
                ${node.employee_id ? `<button class="org-action-btn" data-action="employee" data-id="${node.employee_id}" title="View Employee">${icon('user', 13)}</button>` : ''}
                ${node.employee_id ? `<button class="org-action-btn" data-action="photo" data-id="${node.employee_id}" title="Upload Photo">${icon('eye', 13)}</button>` : ''}
                ${isVacant ? `<button class="org-action-btn org-action-delete" data-action="delete" data-id="${node.id}" title="Abolish Position">${icon('trash', 13)}</button>` : ''}
              ` : ''}
            </div>
            ${hasChildren ? `
              <button class="org-toggle-btn" data-toggle-id="${node.id}" title="${isExpanded ? 'Collapse' : 'Expand'}">
                <span class="org-toggle-icon ${isExpanded ? 'expanded' : ''}">${icon('chevronRight', 12)}</span>
                <span class="org-child-count">${childCount}</span>
              </button>
            ` : ''}
          </div>
        </div>
        ${childrenHtml}
      </div>`;
  },

  renderAvatar(node) {
    if (node.isVirtualRoot) {
      return `<div class="org-avatar org-avatar-root">
        <svg viewBox="0 0 24 24" width="32" height="32" stroke="#0f2b46" stroke-width="1.5" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`;
    }
    if (node.photo_url) {
      return `<div class="org-avatar"><img src="${node.photo_url}" alt="${node.first_name || ''}" /></div>`;
    }
    if (node.employee_id) {
      const initials = `${(node.first_name || '')[0] || ''}${(node.surname || '')[0] || ''}`.toUpperCase();
      const colors = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#06b6d4','#ec4899'];
      const ci = (node.employee_id || 0) % colors.length;
      return `<div class="org-avatar org-avatar-initials" style="background:${colors[ci]}">${initials}</div>`;
    }
    return `<div class="org-avatar org-avatar-vacant">
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="#94a3b8" stroke-width="1.5" fill="none" stroke-dasharray="4 2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`;
  },

  isNodeFiltered(node) {
    if (!node) return true;
    const { filterDept, searchTerm } = this.state;
    if (filterDept && node.department_id != filterDept && !node.isVirtualRoot) {
      const hasVisibleChild = (node.children || []).some(c => !this.isNodeFiltered(c));
      if (!hasVisibleChild) return true;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = (node.title || '').toLowerCase().includes(term) ||
        (node.first_name || '').toLowerCase().includes(term) ||
        (node.surname || '').toLowerCase().includes(term) ||
        (node.position_code || '').toLowerCase().includes(term) ||
        (node.employee_code || '').toLowerCase().includes(term) ||
        (node.department_name || '').toLowerCase().includes(term);
      if (!match) {
        const hasVisibleChild = (node.children || []).some(c => !this.isNodeFiltered(c));
        if (!hasVisibleChild) return true;
      }
    }
    return false;
  },

  countDescendants(node) {
    if (!node.children) return 0;
    let count = node.children.length;
    node.children.forEach(c => { count += this.countDescendants(c); });
    return count;
  },

  renderListView() {
    const positions = this.getFilteredPositions();
    const rows = positions.map(p => {
      const deptColor = this.getDeptColor(p.department_name);
      const statusClass = `status-${(p.status || '').toLowerCase()}`;
      return `<tr class="org-list-row" data-id="${p.id}">
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            ${this.renderAvatarSmall(p)}
            <div>
              <div style="font-weight:600;font-size:13px">${p.title}</div>
              <div style="font-size:11px;color:var(--platinum-text-muted)">${p.position_code}</div>
            </div>
          </div>
        </td>
        <td>${p.employee_id ? `${p.first_name} ${p.surname}` : '<span style="color:var(--platinum-text-muted);font-style:italic">Vacant</span>'}</td>
        <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${deptColor.border};margin-right:6px"></span>${p.department_name || '-'}</td>
        <td>${p.grade_code || '-'}</td>
        <td>
          <span class="status-badge ${statusClass}">${p.status}</span>
          ${p.status === 'VACANT' ? (() => { const rs = this.getRecruitmentStatus(p.id); return `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${rs.bg};color:${rs.color};font-weight:600;margin-left:4px">${rs.label}</span>`; })() : ''}
        </td>
        <td>${p.is_hod ? '<span class="status-badge status-active">HOD</span>' : '-'}</td>
        <td>${p.funded ? '<span style="color:var(--platinum-success)">Yes</span>' : '<span style="color:var(--platinum-danger)">No</span>'}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="org-action-btn" data-action="view" data-id="${p.id}" title="View">${icon('eye', 13)}</button>
            <button class="org-action-btn" data-action="edit" data-id="${p.id}" title="Edit">${icon('edit', 13)}</button>
            ${p.status === 'VACANT' ? `<button class="org-action-btn org-action-recruit" data-action="recruit" data-id="${p.id}" title="Recruit">${icon('plus', 13)}</button>` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    return `<div class="data-grid" style="margin-top:16px">
      <table>
        <thead>
          <tr>
            <th>Position</th><th>Incumbent</th><th>Department</th><th>Grade</th><th>Status</th><th>HOD</th><th>Funded</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--platinum-text-muted)">No positions found</td></tr>'}</tbody>
      </table>
    </div>`;
  },

  renderAvatarSmall(node) {
    if (node.photo_url) {
      return `<img src="${node.photo_url}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover" />`;
    }
    if (node.employee_id) {
      const initials = `${(node.first_name || '')[0] || ''}${(node.surname || '')[0] || ''}`.toUpperCase();
      const colors = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#06b6d4','#ec4899'];
      const ci = (node.employee_id || 0) % colors.length;
      return `<div style="width:32px;height:32px;border-radius:50%;background:${colors[ci]};display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;flex-shrink:0">${initials}</div>`;
    }
    return `<div style="width:32px;height:32px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg viewBox="0 0 24 24" width="16" height="16" stroke="#94a3b8" stroke-width="1.5" fill="none" stroke-dasharray="4 2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`;
  },

  getFilteredPositions() {
    let list = [...this.state.positions];
    const { filterDept, searchTerm } = this.state;
    if (filterDept) list = list.filter(p => p.department_id == filterDept);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.title || '').toLowerCase().includes(t) ||
        (p.first_name || '').toLowerCase().includes(t) ||
        (p.surname || '').toLowerCase().includes(t) ||
        (p.position_code || '').toLowerCase().includes(t) ||
        (p.department_name || '').toLowerCase().includes(t)
      );
    }
    return list;
  },

  bindEvents() {
    const el = this.el;

    el.querySelector('.org-search')?.addEventListener('input', (e) => {
      this.state.searchTerm = e.target.value;
      clearTimeout(this._searchTimeout);
      this._searchTimeout = setTimeout(() => this.renderView(), 300);
    });

    el.querySelector('.org-dept-filter')?.addEventListener('change', (e) => {
      this.state.filterDept = e.target.value;
      this.renderView();
    });

    el.querySelectorAll('.org-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.viewMode = btn.dataset.view;
        this.renderView();
      });
    });

    el.querySelector('.org-btn-add')?.addEventListener('click', () => this.showCreateModal());
    el.querySelector('.org-btn-expand')?.addEventListener('click', () => this.expandAll());
    el.querySelector('.org-btn-collapse')?.addEventListener('click', () => this.collapseAll());
    el.querySelector('.org-btn-print')?.addEventListener('click', () => this.exportOrganogram());

    el.querySelectorAll('.org-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.toggleId === 'root' ? 'root' : parseInt(btn.dataset.toggleId);
        if (this.state.expandedNodes.has(id)) {
          this.state.expandedNodes.delete(id);
        } else {
          this.state.expandedNodes.add(id);
        }
        this.renderView();
      });
    });

    el.querySelectorAll('.org-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        switch (action) {
          case 'view': this.showDetailModal(id); break;
          case 'edit': this.showEditModal(id); break;
          case 'employee': this.navigateToEmployee(id); break;
          case 'recruit': this.showRecruitModal(id); break;
          case 'photo': this.showPhotoUpload(id); break;
          case 'delete': this.confirmDelete(id); break;
        }
      });
    });

    el.querySelectorAll('.org-node').forEach(node => {
      node.addEventListener('click', () => {
        const id = node.dataset.id;
        if (id === 'root') return;
        this.state.selectedNode = parseInt(id);
        this.showDetailModal(parseInt(id));
      });
    });

    el.querySelectorAll('.org-list-row').forEach(row => {
      row.addEventListener('click', () => {
        this.showDetailModal(parseInt(row.dataset.id));
      });
    });

    el.querySelectorAll('.org-zoom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.zoom;
        if (action === 'in') this.state.zoom = Math.min(2, this.state.zoom + 0.1);
        else if (action === 'out') this.state.zoom = Math.max(0.3, this.state.zoom - 0.1);
        else if (action === 'fit') { this.state.zoom = 0.7; this.state.panX = 0; this.state.panY = 0; }
        this.applyTransform();
      });
    });
  },

  initPanZoom() {
    const canvas = this.el.querySelector('#org-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.target.closest('.org-node') || e.target.closest('button')) return;
      this.state.isPanning = true;
      this.state.panStart = { x: e.clientX - this.state.panX, y: e.clientY - this.state.panY };
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.state.isPanning) return;
      this.state.panX = e.clientX - this.state.panStart.x;
      this.state.panY = e.clientY - this.state.panStart.y;
      this.applyTransform();
    });

    canvas.addEventListener('mouseup', () => {
      this.state.isPanning = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      this.state.isPanning = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      this.state.zoom = Math.min(2, Math.max(0.3, this.state.zoom + delta));
      this.applyTransform();
    }, { passive: false });
  },

  applyTransform() {
    const tree = this.el.querySelector('#org-tree');
    if (tree) {
      tree.style.transform = `scale(${this.state.zoom}) translate(${this.state.panX}px, ${this.state.panY}px)`;
    }
    const level = this.el.querySelector('.org-zoom-level');
    if (level) level.textContent = `${Math.round(this.state.zoom * 100)}%`;
  },

  expandAll() {
    this.state.positions.forEach(p => this.state.expandedNodes.add(p.id));
    if (this.state.tree?.isVirtualRoot) this.state.expandedNodes.add('root');
    this.renderView();
  },

  collapseAll() {
    this.state.expandedNodes.clear();
    if (this.state.tree) {
      this.state.expandedNodes.add(this.state.tree.isVirtualRoot ? 'root' : this.state.tree.id);
    }
    this.renderView();
  },

  async showDetailModal(positionId) {
    try {
      const data = await api(`/positions/${positionId}`);
      const p = data.data;
      const deptColor = this.getDeptColor(p.department_name);
      const pos = this.state.positions.find(x => x.id === positionId);
      const directReports = this.state.positions.filter(x => x.parent_position_id === positionId);
      const parent = this.state.positions.find(x => x.id === p.parent_position_id);

      let historyHtml = '';
      try {
        const hist = await api(`/positions/${positionId}/history`);
        if (hist.data && hist.data.length > 0) {
          historyHtml = `<div style="margin-top:16px">
            <h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--platinum-text)">Position History</h4>
            <div class="data-grid"><table>
              <thead><tr><th>Field</th><th>Old Value</th><th>New Value</th><th>Date</th></tr></thead>
              <tbody>${hist.data.slice(0, 10).map(h => `
                <tr>
                  <td>${h.field_name}</td>
                  <td>${h.old_value || '-'}</td>
                  <td>${h.new_value || '-'}</td>
                  <td>${new Date(h.changed_at).toLocaleDateString('en-ZA')}</td>
                </tr>`).join('')}</tbody>
            </table></div>
          </div>`;
        }
      } catch (e) {}

      const content = `
        <div class="org-detail">
          <div class="org-detail-header" style="background:${deptColor.bg};border-left:4px solid ${deptColor.border};padding:16px;border-radius:8px;margin-bottom:16px">
            <div style="display:flex;align-items:center;gap:16px">
              ${pos ? this.renderAvatar(pos) : this.renderAvatar(p)}
              <div style="flex:1">
                <div style="font-size:16px;font-weight:700;color:var(--platinum-text)">${p.title}</div>
                <div style="font-size:13px;color:${deptColor.text};margin-top:2px">${p.department_name || '-'} ${p.division_name ? '/ ' + p.division_name : ''}</div>
                <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                  <span class="status-badge status-${(p.status || '').toLowerCase()}">${p.status}</span>
                  ${p.is_hod ? '<span class="status-badge status-active">HOD</span>' : ''}
                  ${p.funded ? '<span class="status-badge status-completed">FUNDED</span>' : '<span class="status-badge status-rejected">UNFUNDED</span>'}
                </div>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="org-detail-field">
              <span class="org-detail-label">Position Code</span>
              <span class="org-detail-value">${p.position_code}</span>
            </div>
            <div class="org-detail-field">
              <span class="org-detail-label">TASK Grade</span>
              <span class="org-detail-value">${p.grade_code || '-'} ${p.grade_name ? '(' + p.grade_name + ')' : ''}</span>
            </div>
            <div class="org-detail-field">
              <span class="org-detail-label">Employee Type</span>
              <span class="org-detail-value">${p.employee_type_name || '-'}</span>
            </div>
            <div class="org-detail-field">
              <span class="org-detail-label">Condition of Service</span>
              <span class="org-detail-value">${p.condition_of_service_name || '-'}</span>
            </div>
            <div class="org-detail-field">
              <span class="org-detail-label">Reports To</span>
              <span class="org-detail-value">${parent ? parent.title + (parent.first_name ? ' (' + parent.first_name + ' ' + parent.surname + ')' : '') : 'None (Top Level)'}</span>
            </div>
            <div class="org-detail-field">
              <span class="org-detail-label">Capacity (FTE)</span>
              <span class="org-detail-value">${p.capacity || '1.00'}</span>
            </div>
          </div>

          ${p.incumbent_id ? `
            <div style="background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:16px;border:1px solid var(--platinum-border)">
              <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--platinum-text-muted);margin-bottom:10px">Current Incumbent</h4>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="org-detail-field">
                  <span class="org-detail-label">Name</span>
                  <span class="org-detail-value">${p.incumbent_first_name} ${p.incumbent_surname}</span>
                </div>
                <div class="org-detail-field">
                  <span class="org-detail-label">Employee Code</span>
                  <span class="org-detail-value">${p.incumbent_code || '-'}</span>
                </div>
                ${pos?.email_address ? `<div class="org-detail-field"><span class="org-detail-label">Email</span><span class="org-detail-value">${pos.email_address}</span></div>` : ''}
                ${pos?.cell_number ? `<div class="org-detail-field"><span class="org-detail-label">Phone</span><span class="org-detail-value">${pos.cell_number}</span></div>` : ''}
                ${pos?.annual_salary ? `<div class="org-detail-field"><span class="org-detail-label">Annual Salary</span><span class="org-detail-value">${formatCurrency(pos.annual_salary)}</span></div>` : ''}
                ${pos?.joining_date ? `<div class="org-detail-field"><span class="org-detail-label">Start Date</span><span class="org-detail-value">${new Date(pos.joining_date).toLocaleDateString('en-ZA')}</span></div>` : ''}
              </div>
            </div>
          ` : ''}

          ${p.job_purpose ? `
            <div style="margin-bottom:16px">
              <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--platinum-text-muted);margin-bottom:6px">Job Purpose</h4>
              <p style="font-size:13px;color:var(--platinum-text);line-height:1.5">${p.job_purpose}</p>
            </div>
          ` : ''}

          ${directReports.length > 0 ? `
            <div style="margin-bottom:16px">
              <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--platinum-text-muted);margin-bottom:8px">Direct Reports (${directReports.length})</h4>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${directReports.map(r => `
                  <div class="org-report-chip" data-action="view" data-id="${r.id}" style="cursor:pointer">
                    ${this.renderAvatarSmall(r)}
                    <div>
                      <div style="font-size:12px;font-weight:600">${r.title}</div>
                      <div style="font-size:11px;color:var(--platinum-text-muted)">${r.employee_id ? r.first_name + ' ' + r.surname : 'Vacant'}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${historyHtml}
        </div>`;

      UI.modal({
        title: `Position: ${p.title}`,
        size: 'lg',
        content,
        footer: `
          <button class="btn btn-sm" onclick="OrganogramModule.showEditModal(${positionId});document.querySelector('[data-close-modal]')?.click()">
            ${icon('edit', 14)} Edit Position
          </button>
          ${p.status === 'VACANT' ? `<button class="btn btn-sm btn-primary" onclick="OrganogramModule.showRecruitModal(${positionId});document.querySelector('[data-close-modal]')?.click()">
            ${icon('plus', 14)} Recruit to Post
          </button>` : ''}
          ${p.incumbent_id ? `<button class="btn btn-sm" onclick="OrganogramModule.navigateToEmployee(${p.incumbent_id});document.querySelector('[data-close-modal]')?.click()">
            ${icon('user', 14)} View Employee
          </button>` : ''}
        `
      });

      document.querySelectorAll('.org-report-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.querySelector('[data-close-modal]')?.click();
          setTimeout(() => this.showDetailModal(parseInt(chip.dataset.id)), 300);
        });
      });

    } catch (err) {
      UI.toast('error', 'Error', 'Failed to load position details: ' + err.message);
    }
  },

  async showEditModal(positionId) {
    try {
      const data = await api(`/positions/${positionId}`);
      const p = data.data;

      const deptOpts = this.state.departments.map(d =>
        `<option value="${d.id}" ${p.department_id == d.id ? 'selected' : ''}>${d.name}</option>`
      ).join('');
      const gradeOpts = this.state.taskGrades.map(g =>
        `<option value="${g.id}" ${p.task_grade_id == g.id ? 'selected' : ''}>${g.grade_code} - ${g.grade_name}</option>`
      ).join('');
      const profileOpts = this.state.jobProfiles.map(jp =>
        `<option value="${jp.id}" ${p.job_profile_id == jp.id ? 'selected' : ''}>${jp.job_title}</option>`
      ).join('');
      const parentOpts = this.state.positions
        .filter(x => x.id !== positionId)
        .map(x => `<option value="${x.id}" ${p.parent_position_id == x.id ? 'selected' : ''}>${x.title} (${x.position_code})</option>`)
        .join('');

      const content = `
        <form id="edit-position-form" class="form-grid">
          <div class="form-group">
            <label class="form-label">Position Title</label>
            <input type="text" name="title" class="form-control" value="${p.title || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-control">
              ${['VACANT','FILLED','FROZEN','ABOLISHED'].map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <select name="department_id" class="form-control"><option value="">Select...</option>${deptOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Reports To</label>
            <select name="parent_position_id" class="form-control"><option value="">None (Top Level)</option>${parentOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">TASK Grade</label>
            <select name="task_grade_id" class="form-control"><option value="">Select...</option>${gradeOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Job Profile</label>
            <select name="job_profile_id" class="form-control"><option value="">Select...</option>${profileOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">HOD Position</label>
            <select name="is_hod" class="form-control">
              <option value="false" ${!p.is_hod ? 'selected' : ''}>No</option>
              <option value="true" ${p.is_hod ? 'selected' : ''}>Yes</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Funded</label>
            <select name="funded" class="form-control">
              <option value="true" ${p.funded !== false ? 'selected' : ''}>Yes</option>
              <option value="false" ${p.funded === false ? 'selected' : ''}>No</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Change Reason</label>
            <input type="text" name="change_reason" class="form-control" placeholder="Reason for changes (for audit trail)" />
          </div>
        </form>`;

      UI.modal({
        title: `Edit Position: ${p.position_code}`,
        size: 'lg',
        content,
        footer: `
          <button class="btn btn-sm" data-close-modal>Cancel</button>
          <button class="btn btn-sm btn-primary" id="save-position-btn">${icon('check', 14)} Save Changes</button>
        `
      });

      document.getElementById('save-position-btn')?.addEventListener('click', async () => {
        const form = document.getElementById('edit-position-form');
        const fd = new FormData(form);
        const body = {};
        for (const [k, v] of fd.entries()) {
          if (v === '') continue;
          if (k === 'is_hod' || k === 'funded') body[k] = v === 'true';
          else if (['department_id', 'parent_position_id', 'task_grade_id', 'job_profile_id'].includes(k)) body[k] = parseInt(v);
          else body[k] = v;
        }
        try {
          const putRes = await fetch(`${API_BASE}/positions/${positionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          if (!putRes.ok) { const err = await putRes.json(); throw new Error(err.error?.message || 'Update failed'); }
          document.querySelector('[data-close-modal]')?.click();
          UI.toast('success', 'Position Updated', 'Changes saved to the staff establishment.');
          await this.loadData();
          this.renderView();
        } catch (err) {
          UI.toast('error', 'Error', err.message);
        }
      });
    } catch (err) {
      UI.toast('error', 'Error', 'Failed to load position: ' + err.message);
    }
  },

  async showCreateModal() {
    const deptOpts = this.state.departments.map(d =>
      `<option value="${d.id}">${d.name}</option>`
    ).join('');
    const gradeOpts = this.state.taskGrades.map(g =>
      `<option value="${g.id}">${g.grade_code} - ${g.grade_name}</option>`
    ).join('');
    const parentOpts = this.state.positions.map(x =>
      `<option value="${x.id}">${x.title} (${x.position_code})</option>`
    ).join('');

    const content = `
      <form id="create-position-form" class="form-grid">
        <div class="form-group">
          <label class="form-label">Position Code</label>
          <input type="text" name="position_code" class="form-control" placeholder="e.g. POS026" required />
        </div>
        <div class="form-group">
          <label class="form-label">Position Title</label>
          <input type="text" name="title" class="form-control" placeholder="e.g. Senior Accountant" required />
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <select name="department_id" class="form-control" required><option value="">Select...</option>${deptOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Reports To</label>
          <select name="parent_position_id" class="form-control"><option value="">None (Top Level)</option>${parentOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">TASK Grade</label>
          <select name="task_grade_id" class="form-control"><option value="">Select...</option>${gradeOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">HOD Position</label>
          <select name="is_hod" class="form-control">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Funded</label>
          <select name="funded" class="form-control">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="date" name="start_date" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
        </div>
      </form>`;

    UI.modal({
      title: 'Create New Position',
      size: 'lg',
      content,
      footer: `
        <button class="btn btn-sm" data-close-modal>Cancel</button>
        <button class="btn btn-sm btn-primary" id="create-position-btn">${icon('plus', 14)} Create Position</button>
      `
    });

    document.getElementById('create-position-btn')?.addEventListener('click', async () => {
      const form = document.getElementById('create-position-form');
      const fd = new FormData(form);
      const body = {};
      for (const [k, v] of fd.entries()) {
        if (v === '') continue;
        if (k === 'is_hod' || k === 'funded') body[k] = v === 'true';
        else if (['department_id', 'parent_position_id', 'task_grade_id'].includes(k)) body[k] = parseInt(v);
        else body[k] = v;
      }
      try {
        await apiPost('/positions', body);
        document.querySelector('[data-close-modal]')?.click();
        UI.toast('success', 'Position Created', 'New position added to the staff establishment.');
        await this.loadData();
        this.renderView();
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  showPhotoUpload(employeeId) {
    const content = `
      <div style="text-align:center;padding:20px">
        <div class="org-photo-preview" id="photo-preview" style="width:120px;height:120px;border-radius:50%;margin:0 auto 16px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px dashed var(--platinum-border)">
          ${icon('user', 40)}
        </div>
        <p style="font-size:13px;color:var(--platinum-text-muted);margin-bottom:16px">Upload a profile photo (max 5MB, JPG/PNG/WEBP)</p>
        <input type="file" id="photo-input" accept=".jpg,.jpeg,.png,.gif,.webp" style="display:none" />
        <button class="btn btn-sm btn-primary" id="select-photo-btn">${icon('download', 14)} Select Photo</button>
      </div>`;

    UI.modal({
      title: 'Upload Employee Photo',
      content,
      footer: `
        <button class="btn btn-sm" data-close-modal>Cancel</button>
        <button class="btn btn-sm btn-primary" id="upload-photo-btn" disabled>${icon('check', 14)} Upload</button>
      `
    });

    const input = document.getElementById('photo-input');
    const preview = document.getElementById('photo-preview');

    document.getElementById('select-photo-btn')?.addEventListener('click', () => input?.click());

    input?.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover" />`;
          preview.style.borderStyle = 'solid';
          preview.style.borderColor = 'var(--platinum-success)';
          document.getElementById('upload-photo-btn').disabled = false;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('upload-photo-btn')?.addEventListener('click', async () => {
      const file = input?.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('photo', file);
      try {
        const res = await fetch(`${API_BASE}/employees/${employeeId}/photo`, {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
        document.querySelector('[data-close-modal]')?.click();
        UI.toast('success', 'Photo Uploaded', 'Employee photo has been updated.');
        await this.loadData();
        this.renderView();
      } catch (err) {
        UI.toast('error', 'Upload Failed', err.message);
      }
    });
  },

  showRecruitModal(positionId) {
    const pos = this.state.positions.find(p => p.id === positionId);
    if (!pos) return;

    const rs = this.getRecruitmentStatus(positionId);
    const hasVacancy = rs.status !== 'NO_VACANCY';

    if (hasVacancy) {
      UI.modal({
        title: `Recruitment: ${pos.title}`,
        content: `
          <div style="padding:12px">
            <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid var(--platinum-border);margin-bottom:16px">
              <div style="font-size:14px;font-weight:600">${pos.title}</div>
              <div style="font-size:12px;color:var(--platinum-text-muted);margin-top:4px">${pos.department_name || '-'} | ${pos.grade_code || 'No grade'} | ${pos.position_code}</div>
            </div>
            <div style="background:${rs.bg};border:1px solid ${rs.color}33;border-radius:8px;padding:12px;font-size:13px;color:${rs.color};margin-bottom:16px">
              ${icon('briefcase',14)} A recruitment vacancy already exists for this position. Current status: <strong>${rs.label}</strong>
            </div>
          </div>`,
        footer: `
          <button class="btn btn-sm" data-close-modal>Cancel</button>
          <button class="btn btn-sm btn-primary" onclick="document.querySelector('[data-close-modal]')?.click();document.querySelector('[data-module=recruitment]')?.click()">
            ${icon('briefcase', 14)} View in Recruitment
          </button>
        `
      });
      return;
    }

    UI.modal({
      title: `Recruit to: ${pos.title}`,
      content: `
        <div style="padding:12px">
          <div style="background:#f8fafc;padding:14px;border-radius:8px;border:1px solid var(--platinum-border);margin-bottom:16px">
            <div style="font-size:14px;font-weight:600">${pos.title}</div>
            <div style="font-size:12px;color:var(--platinum-text-muted);margin-top:4px">${pos.department_name || '-'} | ${pos.grade_code || 'No grade'} | ${pos.position_code}</div>
          </div>
          <p style="font-size:13px;color:var(--platinum-text);margin-bottom:16px">
            Create a recruitment vacancy for this position to begin the hiring process.
          </p>
          <div class="form-grid" id="org-recruit-form">
            ${UI.buildForm([
              { id: 'orv_salary', label: 'Salary Range', type: 'text', placeholder: 'e.g. R 250,000 - R 350,000' },
              { id: 'orv_closing', label: 'Closing Date', type: 'date' },
              { id: 'orv_requirements', label: 'Requirements', type: 'textarea', fullWidth: true },
            ])}
          </div>
        </div>`,
      size: 'lg',
      footer: `
        <button class="btn btn-sm" data-close-modal>Cancel</button>
        <button class="btn btn-sm btn-primary" id="org-create-vacancy-btn">
          ${icon('plus', 14)} Create Vacancy
        </button>
      `
    });

    document.getElementById('org-create-vacancy-btn')?.addEventListener('click', async () => {
      const d = UI.getFormData('org-recruit-form');
      try {
        const salaryParts = (d.orv_salary || '').replace(/[R,\s]/g, '').split('-');
        await apiPost('/recruitment/vacancies', {
          position_id: positionId,
          department_id: pos.department_id || null,
          title: '',
          salary_range_min: salaryParts[0] ? parseFloat(salaryParts[0]) : null,
          salary_range_max: salaryParts[1] ? parseFloat(salaryParts[1]) : null,
          closing_date: d.orv_closing,
          requirements: d.orv_requirements,
          duties: ''
        });
        document.querySelector('[data-close-modal]')?.click();
        UI.toast('success', 'Vacancy Created', `Recruitment vacancy created for "${pos.title}"`);
        await this.loadData();
        this.renderView();
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  async confirmDelete(positionId) {
    const pos = this.state.positions.find(p => p.id === positionId);
    if (!pos) return;

    UI.modal({
      title: 'Abolish Position',
      content: `
        <div style="padding:12px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:40px;height:40px;border-radius:10px;background:#fef2f2;display:flex;align-items:center;justify-content:center;color:#ef4444;flex-shrink:0">
              ${icon('alertTriangle', 20)}
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--platinum-text)">Are you sure?</div>
              <div style="font-size:12px;color:var(--platinum-text-muted)">This will mark the position as ABOLISHED in the staff establishment.</div>
            </div>
          </div>
          <div style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--platinum-border)">
            <div style="font-size:13px;font-weight:600">${pos.title}</div>
            <div style="font-size:12px;color:var(--platinum-text-muted)">${pos.position_code} | ${pos.department_name || '-'}</div>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-sm" data-close-modal>Cancel</button>
        <button class="btn btn-sm" id="confirm-abolish-btn" style="background:#ef4444;color:#fff">${icon('trash', 14)} Abolish Position</button>
      `
    });

    document.getElementById('confirm-abolish-btn')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_BASE}/positions/${positionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ABOLISHED', change_reason: 'Position abolished via organogram' })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Failed to abolish'); }
        document.querySelector('[data-close-modal]')?.click();
        UI.toast('success', 'Position Abolished', `${pos.title} has been marked as abolished.`);
        await this.loadData();
        this.renderView();
      } catch (err) {
        UI.toast('error', 'Error', err.message);
      }
    });
  },

  navigateToEmployee(employeeId) {
    const empNav = document.querySelector('[data-module="employees"]');
    if (empNav) {
      empNav.click();
      setTimeout(() => {
        if (typeof EmployeeModule !== 'undefined' && EmployeeModule.showDetail) {
          EmployeeModule.showDetail(employeeId);
        }
      }, 500);
    }
  },

  exportOrganogram() {
    const positions = this.getFilteredPositions();
    const headers = ['Position Code', 'Title', 'Status', 'Department', 'Division', 'Grade', 'HOD', 'Funded', 'Incumbent', 'Employee Code', 'Email', 'Phone'];
    const rows = positions.map(p => [
      p.position_code, p.title, p.status, p.department_name || '', p.division_name || '',
      p.grade_code || '', p.is_hod ? 'Yes' : 'No', p.funded ? 'Yes' : 'No',
      p.employee_id ? `${p.first_name} ${p.surname}` : 'VACANT',
      p.employee_code || '', p.email_address || '', p.cell_number || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organogram_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('success', 'Exported', 'Organogram data exported to CSV.');
  },
};

async function renderOrganogramModule(el) {
  if (typeof OrganogramModule !== 'undefined') {
    await OrganogramModule.render(el);
  } else {
    el.innerHTML = '<div class="loading">Organogram module not available</div>';
  }
}
