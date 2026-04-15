const ReportsModule = {
  async render(el) {
    el.innerHTML = `
      <div class="module-tabs">
        <div class="detail-tab active" data-rtab="statutory">${icon('file',14)} Statutory Reports</div>
        <div class="detail-tab" data-rtab="payslips">${icon('creditCard',14)} Payslips</div>
        <div class="detail-tab" data-rtab="exports">${icon('download',14)} Data Exports</div>
        <div class="detail-tab" data-rtab="ee">${icon('users',14)} Employment Equity</div>
        <div class="detail-tab" data-rtab="tools">${icon('settings',14)} Tools</div>
      </div>
      <div id="reports-content"></div>
    `;
    el.querySelectorAll('[data-rtab]').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.loadTab(tab.dataset.rtab);
      });
    });
    this.loadTab('statutory');
  },

  async loadTab(tab) {
    const el = document.getElementById('reports-content');
    if (!el) return;
    switch (tab) {
      case 'statutory': await this.renderStatutory(el); break;
      case 'payslips': await this.renderPayslips(el); break;
      case 'exports': this.renderExports(el); break;
      case 'ee': await this.renderEE(el); break;
      case 'tools': await this.renderTools(el); break;
    }
  },

  async renderStatutory(el) {
    const periodMonths = ['March','April','May','June','July','August','September','October','November','December','January','February'];
    el.innerHTML = `
      <div class="form-grid" style="max-width:400px;margin-bottom:20px">
        <div class="form-group">
          <label>Tax Year</label>
          <select class="form-control" id="report-tax-year" onchange="ReportsModule.loadStatutorySummary()">
            <option value="2026" selected>2026 (Mar 2025 - Feb 2026)</option>
            <option value="2025">2025 (Mar 2024 - Feb 2025)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tax Period</label>
          <select class="form-control" id="report-tax-period">
            ${Array.from({length:12}, (_,i) => `<option value="${i+1}">Period ${i+1} - ${periodMonths[i]}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="section-header">${icon('shield',16)} SARS Statutory Reports</div>
      <div class="summary-row" style="margin-bottom:20px">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.showEMP201Form()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">EMP201</div><div class="summary-value">Monthly Declaration</div><div class="summary-sub">PAYE + UIF + SDL</div></div>
        </div>
        <div class="summary-card sc-green" style="cursor:pointer" onclick="ReportsModule.showEMP501Form()">
          <div class="summary-icon" style="background:var(--success-bg)">${icon('barChart',18)}</div>
          <div><div class="summary-label">EMP501</div><div class="summary-value">Annual Reconciliation</div><div class="summary-sub">Full tax year summary</div></div>
        </div>
        <div class="summary-card sc-orange" style="cursor:pointer" onclick="ReportsModule.downloadIRP5()">
          <div class="summary-icon" style="background:var(--warning-bg)">${icon('fileText',18)}</div>
          <div><div class="summary-label">IRP5 / IT3(a)</div><div class="summary-value">Tax Certificates</div><div class="summary-sub">Per employee per year</div></div>
        </div>
        <div class="summary-card sc-purple" style="cursor:pointer" onclick="ReportsModule.showEasyFileForm()">
          <div class="summary-icon" style="background:var(--purple-bg)">${icon('download',18)}</div>
          <div><div class="summary-label">e@syFile</div><div class="summary-value">SARS Export</div><div class="summary-sub">CSV for eFiling</div></div>
        </div>
      </div>

      <div class="section-header" style="margin-top:20px">${icon('shield',16)} Additional Statutory Reports</div>
      <div class="summary-row" style="margin-bottom:20px">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.showUIFUI19Form()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">UIF UI-19</div><div class="summary-value">UIF Declaration</div><div class="summary-sub">Monthly UIF return</div></div>
        </div>
        <div class="summary-card sc-orange" style="cursor:pointer" onclick="ReportsModule.showMFMAS66Form()">
          <div class="summary-icon" style="background:var(--warning-bg)">${icon('barChart',18)}</div>
          <div><div class="summary-label">MFMA S66</div><div class="summary-value">Municipal Report</div><div class="summary-sub">Section 66 personnel</div></div>
        </div>
      </div>

      <div class="section-header" style="margin-top:20px">${icon('upload',16)} Electronic Filing</div>
      <div class="summary-row" style="margin-bottom:20px">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.downloadIRP5Batch()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">IRP5 Batch PDF</div><div class="summary-value">All Certificates</div><div class="summary-sub">Bulk PDF download</div></div>
        </div>
        <div class="summary-card sc-green" style="cursor:pointer" onclick="ReportsModule.downloadIRP5Text()">
          <div class="summary-icon" style="background:var(--success-bg)">${icon('fileText',18)}</div>
          <div><div class="summary-label">IRP5 Electronic Text</div><div class="summary-value">Text File</div><div class="summary-sub">SARS electronic format</div></div>
        </div>
        <div class="summary-card sc-orange" style="cursor:pointer" onclick="ReportsModule.downloadEMP201Electronic()">
          <div class="summary-icon" style="background:var(--warning-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">EMP201 Electronic</div><div class="summary-value">Electronic Submission</div><div class="summary-sub">Monthly e-filing</div></div>
        </div>
        <div class="summary-card sc-purple" style="cursor:pointer" onclick="ReportsModule.downloadEMP501Electronic()">
          <div class="summary-icon" style="background:var(--purple-bg)">${icon('barChart',18)}</div>
          <div><div class="summary-label">EMP501 Electronic</div><div class="summary-value">Annual e-filing</div><div class="summary-sub">Electronic reconciliation</div></div>
        </div>
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.showAmendedIRP5()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('edit',18)}</div>
          <div><div class="summary-label">Amended IRP5</div><div class="summary-value">Corrected Certificate</div><div class="summary-sub">Per employee amendment</div></div>
        </div>
      </div>

      <div class="section-header" style="margin-top:20px">${icon('shield',16)} Compliance Reports</div>
      <div class="summary-row" style="margin-bottom:20px">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.downloadROE()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">Return of Earnings</div><div class="summary-value">COIDA</div><div class="summary-sub">Annual earnings report</div></div>
        </div>
        <div class="summary-card sc-green" style="cursor:pointer" onclick="ReportsModule.downloadSDL1()">
          <div class="summary-icon" style="background:var(--success-bg)">${icon('barChart',18)}</div>
          <div><div class="summary-label">SDL Annual</div><div class="summary-value">LGSETA</div><div class="summary-sub">Skills levy report</div></div>
        </div>
        <div class="summary-card sc-orange" style="cursor:pointer" onclick="ReportsModule.downloadWSP()">
          <div class="summary-icon" style="background:var(--warning-bg)">${icon('download',18)}</div>
          <div><div class="summary-label">WSP/ATR Export</div><div class="summary-value">Skills Plan</div><div class="summary-sub">Workplace skills plan</div></div>
        </div>
      </div>

      <div class="section-header" style="margin-top:24px">${icon('upload',16)} SARS Submission Workflow</div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="font-size:13px;color:var(--text-secondary);margin:0 0 12px 0">
          ${icon('alertTriangle',14)} <strong>SARS does not offer a direct API for submissions.</strong> The standard workflow uses the e@syFile Employer CSV format.
        </p>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">${icon('file',14)} Step 1: Generate Reports</div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0">Generate EMP201 (monthly) or EMP501 (annual reconciliation) from payroll data above.</p>
          </div>
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">${icon('download',14)} Step 2: Export e@syFile CSV</div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0">Download the e@syFile CSV with SARS-specified columns (demographics, source codes, amounts).</p>
          </div>
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">${icon('upload',14)} Step 3: Upload to SARS</div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0">Import the CSV into SARS e@syFile Employer software or upload via SARS eFiling portal.</p>
          </div>
          <div style="flex:1;min-width:200px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">${icon('check',14)} Step 4: Confirm Submission</div>
            <p style="font-size:12px;color:var(--text-secondary);margin:0">Verify submission status on eFiling and retain the receipt number for reconciliation.</p>
          </div>
        </div>
      </div>

      <div class="section-header" style="margin-top:24px">${icon('barChart',16)} Report Generation History</div>
      <div id="statutory-summary-container">
        <div class="loading"><div class="spinner"></div>Loading summary...</div>
      </div>
    `;
    this.loadStatutorySummary();
  },

  async loadStatutorySummary() {
    const container = document.getElementById('statutory-summary-container');
    if (!container) return;
    const year = document.getElementById('report-tax-year')?.value || 2026;
    try {
      const result = await api(`/reports/statutory-summary/${year}`);
      const d = result.data;
      container.innerHTML = `
        <div class="stat-cards" style="margin-bottom:16px">
          <div class="stat-card"><div class="stat-value" style="color:var(--danger)">R ${Number(d.totals.paye || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total PAYE (Year)</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--info)">R ${Number(d.totals.uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total UIF (Year)</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--warning)">R ${Number(d.totals.sdl || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total SDL (Year)</div></div>
          <div class="stat-card"><div class="stat-value">${d.totals.employee_count || 0}</div><div class="stat-label">Employees Processed</div></div>
        </div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Period</th><th style="text-align:right">PAYE</th><th style="text-align:right">UIF (EE+ER)</th><th style="text-align:right">SDL</th><th style="text-align:center">Employees</th><th style="text-align:center">Runs</th></tr>
            </thead>
            <tbody>
              ${(d.periods || []).length ? d.periods.map(p => `
                <tr>
                  <td>Period ${p.tax_period}</td>
                  <td style="text-align:right">R ${Number(p.paye || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                  <td style="text-align:right">R ${Number(p.uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                  <td style="text-align:right">R ${Number(p.sdl || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                  <td style="text-align:center">${p.employee_count || 0}</td>
                  <td style="text-align:center">${p.run_count || 0}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No payroll data for this tax year</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:var(--text-muted);text-align:center;padding:16px">No report history available for this tax year.</div>`;
    }
  },

  showEMP201Form() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    const period = document.getElementById('report-tax-period')?.value || 1;
    UI.modal({
      title: 'EMP201 - Monthly PAYE Declaration',
      size: 'lg',
      content: `
        <div class="form-grid" style="max-width:400px;margin-bottom:16px">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" id="emp201-year">
              <option value="2026" ${year == 2026 ? 'selected' : ''}>2026</option>
              <option value="2025" ${year == 2025 ? 'selected' : ''}>2025</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tax Period</label>
            <select class="form-control" id="emp201-period">
              ${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${(i+1) == period ? 'selected' : ''}>Period ${i+1}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="emp201-preview" style="margin-top:12px">
          <button class="btn" onclick="ReportsModule.previewEMP201()">${icon('eye',14)} Preview Summary</button>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doEMP201Download()">${icon('download',14)} Download PDF</button>`
    });
  },

  async previewEMP201() {
    const year = document.getElementById('emp201-year')?.value || 2026;
    const period = document.getElementById('emp201-period')?.value || 1;
    const previewEl = document.getElementById('emp201-preview');
    if (!previewEl) return;
    previewEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading preview...</div>';
    try {
      const result = await api(`/reports/statutory-summary/${year}`);
      const d = result.data;
      const p = (d.periods || []).find(x => x.tax_period == period);
      previewEl.innerHTML = `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:8px">
          <div style="font-weight:700;margin-bottom:12px">EMP201 Summary - Period ${period}, Tax Year ${year}</div>
          <div class="stat-cards">
            <div class="stat-card"><div class="stat-value" style="color:var(--danger)">R ${Number(p?.paye || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">PAYE</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--info)">R ${Number(p?.uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">UIF (EE + ER)</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--warning)">R ${Number(p?.sdl || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">SDL</div></div>
            <div class="stat-card"><div class="stat-value">${p?.employee_count || 0}</div><div class="stat-label">Employees</div></div>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Total payable: R ${Number((p?.paye || 0) + (p?.uif || 0) + (p?.sdl || 0)).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div>
        </div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewEMP201()">${icon('refresh',14)} Refresh</button>
      `;
    } catch (err) {
      previewEl.innerHTML = `<div style="color:var(--text-muted);padding:8px">No data available for this period. Run payroll first.</div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewEMP201()">${icon('refresh',14)} Retry</button>`;
    }
  },

  doEMP201Download() {
    const year = document.getElementById('emp201-year')?.value || 2026;
    const period = document.getElementById('emp201-period')?.value || 1;
    window.open(`${API_BASE}/reports/emp201/${year}/${period}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'EMP201 Report', 'Downloading monthly declaration PDF');
  },

  showEMP501Form() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    UI.modal({
      title: 'EMP501 - Annual Reconciliation',
      size: 'lg',
      content: `
        <div class="form-grid" style="max-width:300px;margin-bottom:16px">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" id="emp501-year">
              <option value="2026" ${year == 2026 ? 'selected' : ''}>2026</option>
              <option value="2025" ${year == 2025 ? 'selected' : ''}>2025</option>
            </select>
          </div>
        </div>
        <div id="emp501-preview" style="margin-top:12px">
          <button class="btn" onclick="ReportsModule.previewEMP501()">${icon('eye',14)} Preview Reconciliation</button>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doEMP501Download()">${icon('download',14)} Download PDF</button>`
    });
  },

  async previewEMP501() {
    const year = document.getElementById('emp501-year')?.value || 2026;
    const previewEl = document.getElementById('emp501-preview');
    if (!previewEl) return;
    previewEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading reconciliation...</div>';
    try {
      const result = await api(`/reports/statutory-summary/${year}`);
      const d = result.data;
      previewEl.innerHTML = `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:8px">
          <div style="font-weight:700;margin-bottom:12px">EMP501 Annual Reconciliation - Tax Year ${year}</div>
          <div class="stat-cards">
            <div class="stat-card"><div class="stat-value" style="color:var(--danger)">R ${Number(d.totals.paye || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total PAYE</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--info)">R ${Number(d.totals.uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total UIF</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--warning)">R ${Number(d.totals.sdl || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total SDL</div></div>
            <div class="stat-card"><div class="stat-value">${d.totals.employee_count || 0}</div><div class="stat-label">IRP5 Certificates</div></div>
          </div>
          <div class="data-grid" style="margin-top:12px">
            <table>
              <thead><tr><th>Period</th><th style="text-align:right">PAYE</th><th style="text-align:right">UIF</th><th style="text-align:right">SDL</th></tr></thead>
              <tbody>
                ${(d.periods || []).map(p => `
                  <tr>
                    <td>Period ${p.tax_period}</td>
                    <td style="text-align:right">R ${Number(p.paye || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                    <td style="text-align:right">R ${Number(p.uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                    <td style="text-align:right">R ${Number(p.sdl || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
            Grand Total: R ${Number((d.totals.paye || 0) + (d.totals.uif || 0) + (d.totals.sdl || 0)).toLocaleString('en-ZA', {minimumFractionDigits:2})}
          </div>
        </div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewEMP501()">${icon('refresh',14)} Refresh</button>
      `;
    } catch (err) {
      previewEl.innerHTML = `<div style="color:var(--text-muted);padding:8px">No data available. Run payroll first.</div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewEMP501()">${icon('refresh',14)} Retry</button>`;
    }
  },

  doEMP501Download() {
    const year = document.getElementById('emp501-year')?.value || 2026;
    window.open(`${API_BASE}/reports/emp501/${year}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'EMP501 Report', 'Downloading annual reconciliation PDF');
  },

  showEasyFileForm() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    UI.modal({
      title: 'e@syFile Employer Export',
      content: `
        <div class="form-grid" style="max-width:300px;margin-bottom:16px">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" id="easyfile-year">
              <option value="2026" ${year == 2026 ? 'selected' : ''}>2026</option>
              <option value="2025" ${year == 2025 ? 'selected' : ''}>2025</option>
            </select>
          </div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px">
          <p style="font-size:12px;color:var(--text-secondary);margin:0">
            ${icon('alertTriangle',12)} The e@syFile CSV contains employee demographics, IRP5 source codes, and amounts in the SARS-specified column format.
            Import this file into the SARS e@syFile Employer application for submission.
          </p>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doEasyFileDownload()">${icon('download',14)} Download CSV</button>`
    });
  },

  doEasyFileDownload() {
    const year = document.getElementById('easyfile-year')?.value || 2026;
    window.open(`${API_BASE}/reports/easyfile/${year}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'e@syFile Export', 'Downloading SARS CSV file');
  },

  showUIFUI19Form() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    const period = document.getElementById('report-tax-period')?.value || 1;
    UI.modal({
      title: 'UIF UI-19 - Monthly Declaration',
      size: 'lg',
      content: `
        <div class="form-grid" style="max-width:400px;margin-bottom:16px">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" id="uif19-year">
              <option value="2026" ${year == 2026 ? 'selected' : ''}>2026</option>
              <option value="2025" ${year == 2025 ? 'selected' : ''}>2025</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tax Period</label>
            <select class="form-control" id="uif19-period">
              ${Array.from({length:12}, (_,i) => `<option value="${i+1}" ${(i+1) == period ? 'selected' : ''}>Period ${i+1}</option>`).join('')}
            </select>
          </div>
        </div>
        <div id="uif19-preview" style="margin-top:12px">
          <button class="btn" onclick="ReportsModule.previewUIFUI19()">${icon('eye',14)} Preview UIF Summary</button>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button>
        <button class="btn" onclick="ReportsModule.doUIFUI19Download('json')" style="margin-right:4px">${icon('eye',14)} View JSON</button>
        <button class="btn btn-primary" onclick="ReportsModule.doUIFUI19Download('pdf')">${icon('download',14)} Download PDF</button>`
    });
  },

  async previewUIFUI19() {
    const year = document.getElementById('uif19-year')?.value || 2026;
    const period = document.getElementById('uif19-period')?.value || 1;
    const previewEl = document.getElementById('uif19-preview');
    if (!previewEl) return;
    previewEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading UIF data...</div>';
    try {
      const result = await api(`/reports/uif-ui19/${year}/${period}`);
      const d = result.data;
      previewEl.innerHTML = `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:8px">
          <div style="font-weight:700;margin-bottom:12px">UIF UI-19 Summary - Period ${period}, Tax Year ${year}</div>
          <div class="stat-cards">
            <div class="stat-card"><div class="stat-value">R ${Number(d.totals.gross_remuneration || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Gross Remuneration</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--info)">R ${Number(d.totals.uif_employee || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">UIF Employee</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--info)">R ${Number(d.totals.uif_employer || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">UIF Employer</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--danger)">R ${Number(d.totals.total_uif || 0).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div><div class="stat-label">Total UIF Payable</div></div>
          </div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">${d.employee_count} employees included</div>
        </div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewUIFUI19()">${icon('refresh',14)} Refresh</button>
      `;
    } catch (err) {
      previewEl.innerHTML = `<div style="color:var(--text-muted);padding:8px">No UIF data available. Run payroll first.</div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewUIFUI19()">${icon('refresh',14)} Retry</button>`;
    }
  },

  doUIFUI19Download(format) {
    const year = document.getElementById('uif19-year')?.value || 2026;
    const period = document.getElementById('uif19-period')?.value || 1;
    if (format === 'pdf') {
      window.open(`${API_BASE}/reports/uif-ui19/${year}/${period}?format=pdf`, '_blank');
    } else {
      window.open(`${API_BASE}/reports/uif-ui19/${year}/${period}`, '_blank');
    }
    UI.closeModal();
    UI.toast('success', 'UIF UI-19', 'Downloading UIF declaration report');
  },

  showMFMAS66Form() {
    UI.modal({
      title: 'MFMA Section 66 - Staff Establishment',
      size: 'lg',
      content: `
        <div class="form-grid" style="max-width:300px;margin-bottom:16px">
          <div class="form-group">
            <label>Financial Year</label>
            <input type="text" class="form-control" id="mfma-year" placeholder="e.g. 2025/2026" value="${new Date().getFullYear()}/${new Date().getFullYear()+1}">
          </div>
        </div>
        <div id="mfma-preview" style="margin-top:12px">
          <button class="btn" onclick="ReportsModule.previewMFMAS66()">${icon('eye',14)} Preview Report</button>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doMFMAS66Download()">${icon('download',14)} Download JSON</button>`
    });
  },

  async previewMFMAS66() {
    const year = document.getElementById('mfma-year')?.value;
    const previewEl = document.getElementById('mfma-preview');
    if (!previewEl) return;
    previewEl.innerHTML = '<div class="loading"><div class="spinner"></div>Loading MFMA data...</div>';
    try {
      const result = await api(`/reports/mfma-s66${year ? '?financial_year=' + encodeURIComponent(year) : ''}`);
      const d = result.data;
      const s = d.summary;
      previewEl.innerHTML = `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-top:8px">
          <div style="font-weight:700;margin-bottom:12px">${d.report_title} - ${d.financial_year}</div>
          <div class="stat-cards">
            <div class="stat-card"><div class="stat-value">${s.total_approved}</div><div class="stat-label">Approved Posts</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--success-dark)">${s.total_filled}</div><div class="stat-label">Filled Posts</div></div>
            <div class="stat-card"><div class="stat-value" style="color:var(--danger)">${s.total_vacant}</div><div class="stat-label">Vacant Posts</div></div>
            <div class="stat-card"><div class="stat-value">${s.overall_vacancy_rate}%</div><div class="stat-label">Vacancy Rate</div></div>
          </div>
          <div class="data-grid" style="margin-top:12px">
            <table>
              <thead><tr><th>Department</th><th style="text-align:center">Approved</th><th style="text-align:center">Filled</th><th style="text-align:center">Vacant</th><th style="text-align:right">Budgeted</th><th style="text-align:right">Actual</th></tr></thead>
              <tbody>
                ${(d.departments || []).map(dept => `
                  <tr>
                    <td>${dept.department}</td>
                    <td style="text-align:center">${dept.approved_posts}</td>
                    <td style="text-align:center">${dept.filled_posts}</td>
                    <td style="text-align:center">${dept.vacant_posts}</td>
                    <td style="text-align:right">R ${Number(dept.budgeted_cost).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                    <td style="text-align:right">R ${Number(dept.actual_cost).toLocaleString('en-ZA', {minimumFractionDigits:2})}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewMFMAS66()">${icon('refresh',14)} Refresh</button>
      `;
    } catch (err) {
      previewEl.innerHTML = `<div style="color:var(--text-muted);padding:8px">Unable to load MFMA data.</div>
        <button class="btn" style="margin-top:8px" onclick="ReportsModule.previewMFMAS66()">${icon('refresh',14)} Retry</button>`;
    }
  },

  doMFMAS66Download() {
    const year = document.getElementById('mfma-year')?.value;
    window.open(`${API_BASE}/reports/mfma-s66${year ? '?financial_year=' + encodeURIComponent(year) : ''}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'MFMA S66', 'Downloading MFMA Section 66 report');
  },

  async downloadIRP5() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    UI.modal({
      title: 'Generate IRP5 Certificate',
      content: `
        <div class="form-group">
          <label>Select Employee</label>
          <select class="form-control" id="irp5-employee">
            <option value="">Loading...</option>
          </select>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doIRP5Download()">Download IRP5</button>`
    });
    const data = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const sel = document.getElementById('irp5-employee');
    if (sel) {
      sel.innerHTML = '<option value="">-- Select Employee --</option>' +
        data.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
    }
  },
  doIRP5Download() {
    const empId = document.getElementById('irp5-employee')?.value;
    const year = document.getElementById('report-tax-year')?.value || 2026;
    if (!empId) { UI.toast('error', 'Error', 'Please select an employee'); return; }
    window.open(`${API_BASE}/reports/irp5/${year}/${empId}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'IRP5 Certificate', 'Downloading tax certificate PDF');
  },

  async showAmendedIRP5() {
    const year = document.getElementById('report-tax-year')?.value || 2026;
    UI.modal({
      title: 'Amended IRP5 Certificate',
      content: `
        <div class="form-grid" style="max-width:400px;margin-bottom:16px">
          <div class="form-group">
            <label>Tax Year</label>
            <select class="form-control" id="amended-irp5-year">
              <option value="2026" ${year == 2026 ? 'selected' : ''}>2026</option>
              <option value="2025" ${year == 2025 ? 'selected' : ''}>2025</option>
            </select>
          </div>
          <div class="form-group">
            <label>Select Employee</label>
            <select class="form-control" id="amended-irp5-employee">
              <option value="">Loading...</option>
            </select>
          </div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:12px">
          <p style="font-size:12px;color:var(--text-secondary);margin:0">
            ${icon('alertTriangle',12)} An amended IRP5 replaces the original certificate when corrections are required after initial submission. Use this for salary adjustments, tax recalculations, or data corrections.
          </p>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.doAmendedIRP5Download()">${icon('download',14)} Download Amended IRP5</button>`
    });
    const data = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
    const sel = document.getElementById('amended-irp5-employee');
    if (sel) {
      sel.innerHTML = '<option value="">-- Select Employee --</option>' +
        data.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
    }
  },

  doAmendedIRP5Download() {
    const empId = document.getElementById('amended-irp5-employee')?.value;
    const year = document.getElementById('amended-irp5-year')?.value || 2026;
    if (!empId) { UI.toast('error', 'Error', 'Please select an employee'); return; }
    window.open(`${API_BASE}/reports/irp5-amended/${year}/${empId}`, '_blank');
    UI.closeModal();
    UI.toast('success', 'Amended IRP5', 'Downloading amended tax certificate');
  },

  downloadIRP5Batch() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/irp5-batch/${taxYear}`, '_blank');
    UI.toast('success', 'IRP5 Batch', 'Downloading batch IRP5 certificates');
  },

  downloadIRP5Text() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/irp5-text/${taxYear}`, '_blank');
    UI.toast('success', 'IRP5 Text', 'Downloading electronic text file');
  },

  downloadEMP201Electronic() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    const period = document.getElementById('report-tax-period')?.value || 1;
    window.open(`${API_BASE}/reports/emp201-electronic/${taxYear}/${period}`, '_blank');
    UI.toast('success', 'EMP201 Electronic', 'Downloading electronic EMP201');
  },

  downloadEMP501Electronic() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/emp501-electronic/${taxYear}`, '_blank');
    UI.toast('success', 'EMP501 Electronic', 'Downloading electronic EMP501');
  },

  downloadROE() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/roe/${taxYear}`, '_blank');
    UI.toast('success', 'Return of Earnings', 'Downloading COIDA report');
  },

  downloadSDL1() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/sdl1/${taxYear}`, '_blank');
    UI.toast('success', 'SDL Annual', 'Downloading LGSETA report');
  },

  downloadWSP() {
    const taxYear = document.getElementById('report-tax-year')?.value || 2026;
    window.open(`${API_BASE}/reports/wsp/${taxYear}`, '_blank');
    UI.toast('success', 'WSP/ATR Export', 'Downloading workplace skills plan');
  },

  downloadPayslipBatch() {
    const runId = document.getElementById('payslip-run')?.value;
    if (!runId) { UI.toast('error', 'Error', 'Please select a payroll run'); return; }
    window.open(`${API_BASE}/reports/payslips-batch/${runId}`, '_blank');
    UI.toast('success', 'Batch Payslips', 'Downloading batch payslips PDF');
  },

  async showEEAnnualReport() {
    const year = document.getElementById('ee-report-year')?.value || 2026;
    UI.modal({
      title: 'EE Annual Report - ' + year,
      size: 'lg',
      content: '<div class="loading"><div class="spinner"></div>Loading EE Annual data...</div>',
      footer: `<button class="btn" data-close-modal>Close</button><button class="btn btn-primary" onclick="window.open(API_BASE+'/reports/ee-annual/${year}','_blank');UI.closeModal()">${icon('download',14)} Download Report</button>`
    });
    try {
      const result = await api(`/reports/ee-annual/${year}`);
      const data = result.data || result;
      const modalBody = document.querySelector('.modal-body');
      if (!modalBody) return;
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        modalBody.innerHTML = `
          <div class="data-grid">
            <table>
              <thead><tr>${headers.map(h => '<th>' + h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + '</th>').join('')}</tr></thead>
              <tbody>${data.map(r => '<tr>' + headers.map(h => '<td>' + (r[h] != null ? r[h] : '-') + '</td>').join('') + '</tr>').join('')}</tbody>
            </table>
          </div>
        `;
      } else {
        modalBody.innerHTML = `
          <div style="padding:20px;text-align:center">
            <div style="font-size:16px;font-weight:600;margin-bottom:8px">EE Annual Report - ${year}</div>
            <pre style="text-align:left;background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;max-height:400px;overflow:auto">${JSON.stringify(data, null, 2)}</pre>
          </div>
        `;
      }
    } catch (err) {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) modalBody.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px">Unable to load EE Annual data: ' + err.message + '</div>';
    }
  },

  async showEEA2Report() {
    const year = document.getElementById('ee-report-year')?.value || 2026;
    UI.modal({
      title: 'EEA2 Workforce Profile - ' + year,
      size: 'lg',
      content: '<div class="loading"><div class="spinner"></div>Loading EEA2 data...</div>',
      footer: '<button class="btn" data-close-modal>Close</button>'
    });
    try {
      const result = await api(`/reports/eea2/${year}`);
      const rows = result.data || [];
      const modalBody = document.querySelector('.modal-body');
      if (!modalBody) return;
      modalBody.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Occupational Level</th><th style="text-align:center">AM</th><th style="text-align:center">AF</th><th style="text-align:center">CM</th><th style="text-align:center">CF</th><th style="text-align:center">IM</th><th style="text-align:center">IF</th><th style="text-align:center">WM</th><th style="text-align:center">WF</th><th style="text-align:center">Total</th></tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(r => '<tr><td>' + (r.occupational_level || '-') + '</td><td style="text-align:center">' + (r.african_male || 0) + '</td><td style="text-align:center">' + (r.african_female || 0) + '</td><td style="text-align:center">' + (r.coloured_male || 0) + '</td><td style="text-align:center">' + (r.coloured_female || 0) + '</td><td style="text-align:center">' + (r.indian_male || 0) + '</td><td style="text-align:center">' + (r.indian_female || 0) + '</td><td style="text-align:center">' + (r.white_male || 0) + '</td><td style="text-align:center">' + (r.white_female || 0) + '</td><td style="text-align:center;font-weight:700">' + (r.total || 0) + '</td></tr>').join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text-muted)">No EEA2 data available</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) modalBody.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px">Unable to load EEA2 data: ' + err.message + '</div>';
    }
  },

  async showEEA4Report() {
    const year = document.getElementById('ee-report-year')?.value || 2026;
    UI.modal({
      title: 'EEA4 Income Differentials - ' + year,
      size: 'lg',
      content: '<div class="loading"><div class="spinner"></div>Loading EEA4 data...</div>',
      footer: '<button class="btn" data-close-modal>Close</button>'
    });
    try {
      const result = await api(`/reports/eea4/${year}`);
      const rows = result.data || [];
      const modalBody = document.querySelector('.modal-body');
      if (!modalBody) return;
      modalBody.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Occupational Level</th><th>Demographic</th><th style="text-align:right">Avg Remuneration</th><th style="text-align:right">Median</th><th style="text-align:center">Count</th><th style="text-align:right">Ratio</th></tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map(r => '<tr><td>' + (r.occupational_level || '-') + '</td><td>' + (r.demographic || (r.race || '-') + ' ' + (r.gender || '-')) + '</td><td style="text-align:right">R ' + Number(r.avg_remuneration || 0).toLocaleString('en-ZA', {minimumFractionDigits:2}) + '</td><td style="text-align:right">R ' + Number(r.median_remuneration || 0).toLocaleString('en-ZA', {minimumFractionDigits:2}) + '</td><td style="text-align:center">' + (r.count || 0) + '</td><td style="text-align:right">' + (r.ratio || '-') + '</td></tr>').join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No EEA4 data available</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) modalBody.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:16px">Unable to load EEA4 data: ' + err.message + '</div>';
    }
  },

  async renderPayslips(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading payroll runs...</div>';
    try {
      const runs = await api('/payroll/runs?limit=20');
      const completedRuns = runs.data.filter(r => ['COMPLETED','LOCKED','APPROVED'].includes(r.status));
      el.innerHTML = `
        <div class="section-header">${icon('creditCard',16)} Payslip Generation</div>
        <div class="form-grid" style="max-width:600px;margin-bottom:16px">
          <div class="form-group">
            <label>Select Payroll Run</label>
            <select class="form-control" id="payslip-run">
              <option value="">-- Select Run --</option>
              ${completedRuns.map(r => `<option value="${r.id}">${r.cycle_name} - Period ${r.period_number} (${r.run_type}) [${r.status}]</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Employee (optional - leave blank for all)</label>
            <select class="form-control" id="payslip-employee"><option value="">All Employees</option></select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="ReportsModule.downloadPayslip()">${icon('download',14)} Download Payslip</button>
        <button class="btn" onclick="ReportsModule.downloadPayslipBatch()" style="margin-left:8px">${icon('file',14)} Batch Payslips</button>
        <button class="btn" onclick="ReportsModule.downloadEFT()" style="margin-left:8px">${icon('creditCard',14)} Download EFT File</button>
        <button class="btn" onclick="ReportsModule.exportPayroll('excel')" style="margin-left:8px">${icon('file',14)} Export Excel</button>
        <button class="btn" onclick="ReportsModule.exportPayroll('csv')" style="margin-left:8px">${icon('download',14)} Export CSV</button>
      `;
      const emps = await api('/employees?limit=100&sort_by=surname&sort_order=asc');
      const empSel = document.getElementById('payslip-employee');
      if (empSel) {
        empSel.innerHTML = '<option value="">All Employees</option>' +
          emps.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
      }
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`;
    }
  },

  downloadPayslip() {
    const runId = document.getElementById('payslip-run')?.value;
    const empId = document.getElementById('payslip-employee')?.value;
    if (!runId) { UI.toast('error', 'Error', 'Please select a payroll run'); return; }
    if (empId) {
      window.open(`${API_BASE}/reports/payslip/${runId}/${empId}`, '_blank');
    } else {
      UI.toast('info', 'Info', 'Individual payslip download - please select an employee');
    }
    UI.toast('success', 'Payslip', 'Downloading payslip PDF');
  },

  downloadEFT() {
    const runId = document.getElementById('payslip-run')?.value;
    if (!runId) { UI.toast('error', 'Error', 'Please select a payroll run'); return; }
    window.open(`${API_BASE}/reports/eft/${runId}`, '_blank');
    UI.toast('success', 'EFT File', 'Downloading ACB bank file');
  },

  exportPayroll(format) {
    const runId = document.getElementById('payslip-run')?.value;
    if (!runId) { UI.toast('error', 'Error', 'Please select a payroll run'); return; }
    window.open(`${API_BASE}/reports/export/payroll/${runId}?format=${format}`, '_blank');
    UI.toast('success', 'Export', `Downloading payroll ${format.toUpperCase()}`);
  },

  renderExports(el) {
    el.innerHTML = `
      <div class="section-header">${icon('download',16)} Data Exports</div>
      <div class="summary-row">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="window.open(API_BASE+'/reports/export/employees?format=excel','_blank')">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('users',18)}</div>
          <div><div class="summary-label">Employee Register</div><div class="summary-value">Excel</div></div>
        </div>
        <div class="summary-card sc-green" style="cursor:pointer" onclick="window.open(API_BASE+'/reports/export/employees?format=csv','_blank')">
          <div class="summary-icon" style="background:var(--success-bg)">${icon('users',18)}</div>
          <div><div class="summary-label">Employee Register</div><div class="summary-value">CSV</div></div>
        </div>
      </div>
      <div class="section-header" style="margin-top:20px">${icon('file',16)} Proof of Employment</div>
      <div class="form-grid" style="max-width:400px;margin-bottom:12px">
        <div class="form-group">
          <label>Select Employee</label>
          <select class="form-control" id="letter-employee"><option value="">Loading...</option></select>
        </div>
      </div>
      <button class="btn btn-primary" onclick="ReportsModule.downloadEmploymentLetter()">${icon('fileText',14)} Generate Letter</button>
    `;
    api('/employees?limit=100&sort_by=surname&sort_order=asc').then(data => {
      const sel = document.getElementById('letter-employee');
      if (sel) sel.innerHTML = '<option value="">-- Select --</option>' + data.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
    });
  },

  downloadEmploymentLetter() {
    const empId = document.getElementById('letter-employee')?.value;
    if (!empId) { UI.toast('error', 'Error', 'Please select an employee'); return; }
    window.open(`${API_BASE}/reports/employment-letter/${empId}`, '_blank');
    UI.toast('success', 'Employment Letter', 'Generating proof of employment PDF');
  },

  eeSubTab: 'profile',

  async renderEE(el) {
    el.innerHTML = `
      <div class="form-grid" style="max-width:300px;margin-bottom:16px">
        <div class="form-group">
          <label>Year</label>
          <select class="form-control" id="ee-report-year">
            <option value="2026" selected>2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>
      <div class="section-header">${icon('file',16)} EE Statutory Reports</div>
      <div class="summary-row" style="margin-bottom:20px">
        <div class="summary-card sc-blue" style="cursor:pointer" onclick="ReportsModule.showEEA2Report()">
          <div class="summary-icon" style="background:var(--info-bg)">${icon('users',18)}</div>
          <div><div class="summary-label">EEA2 Workforce Profile</div><div class="summary-value">Demographic Breakdown</div><div class="summary-sub">By occupational level</div></div>
        </div>
        <div class="summary-card sc-green" style="cursor:pointer" onclick="ReportsModule.showEEA4Report()">
          <div class="summary-icon" style="background:var(--success-bg)">${icon('barChart',18)}</div>
          <div><div class="summary-label">EEA4 Income Differentials</div><div class="summary-value">Remuneration Analysis</div><div class="summary-sub">Pay gaps by demographic</div></div>
        </div>
        <div class="summary-card sc-orange" style="cursor:pointer" onclick="ReportsModule.showEEAnnualReport()">
          <div class="summary-icon" style="background:var(--warning-bg)">${icon('file',18)}</div>
          <div><div class="summary-label">EE Annual Report</div><div class="summary-value">Annual Submission</div><div class="summary-sub">Full EE annual report</div></div>
        </div>
      </div>
      <div class="module-tabs" style="margin-bottom:16px">
        <div class="detail-tab ${this.eeSubTab === 'profile' ? 'active' : ''}" data-eetab="profile">${icon('users',14)} Workforce Profile</div>
        <div class="detail-tab ${this.eeSubTab === 'targets' ? 'active' : ''}" data-eetab="targets">${icon('target',14)} EE Targets</div>
      </div>
      <div id="ee-content"><div class="loading"><div class="spinner"></div>Loading...</div></div>
    `;
    el.querySelectorAll('[data-eetab]').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.eeSubTab = tab.dataset.eetab;
        this.renderEEContent();
      });
    });
    this.renderEEContent();
  },

  async renderEEContent() {
    const el = document.getElementById('ee-content');
    if (!el) return;
    if (this.eeSubTab === 'targets') return this.renderEETargets(el);
    return this.renderEEProfile(el);
  },

  async renderEEProfile(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading workforce profile...</div>';
    try {
      const [profile, summary] = await Promise.all([
        api('/reports/ee/workforce-profile'),
        api('/reports/ee/summary')
      ]);

      const levels = {};
      profile.data.forEach(r => {
        if (!levels[r.occupational_level]) levels[r.occupational_level] = [];
        levels[r.occupational_level].push(r);
      });

      let profileHtml = '';
      Object.entries(levels).forEach(([level, rows]) => {
        const total = rows.reduce((s, r) => s + parseInt(r.count), 0);
        const byDemo = {};
        rows.forEach(r => {
          const key = `${r.race || 'Unknown'} ${r.gender || 'Unknown'}`;
          byDemo[key] = (byDemo[key] || 0) + parseInt(r.count);
        });
        profileHtml += `<tr><td style="font-weight:600">${level}</td>`;
        const cats = ['African Male','African Female','Coloured Male','Coloured Female','Indian Male','Indian Female','White Male','White Female'];
        cats.forEach(c => {
          profileHtml += `<td style="text-align:center">${byDemo[c] || 0}</td>`;
        });
        profileHtml += `<td style="text-align:center;font-weight:700">${total}</td></tr>`;
      });

      const demoCards = summary.data.demographics.map(d =>
        `<div class="stat-card"><div class="stat-value">${d.count}</div><div class="stat-label">${d.race || 'Unknown'} ${d.gender || ''} (${d.percentage}%)</div></div>`
      ).join('');

      el.innerHTML = `
        <div class="section-header">${icon('users',16)} Employment Equity - Workforce Profile (EEA2)</div>
        <div class="stat-cards" style="margin-bottom:16px">${demoCards}</div>
        <div class="data-grid">
          <table>
            <thead>
              <tr><th>Occupational Level</th><th style="text-align:center">AM</th><th style="text-align:center">AF</th><th style="text-align:center">CM</th><th style="text-align:center">CF</th><th style="text-align:center">IM</th><th style="text-align:center">IF</th><th style="text-align:center">WM</th><th style="text-align:center">WF</th><th style="text-align:center">Total</th></tr>
            </thead>
            <tbody>${profileHtml || '<tr><td colspan="10" style="text-align:center">No data - run payroll first</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`;
    }
  },

  async renderEETargets(el) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div>Loading EE targets...</div>';
    try {
      let targets = [];
      let comparison = [];
      try {
        const tData = await api('/reports/ee/targets');
        targets = tData.data || [];
      } catch (e) {}
      try {
        const cData = await api('/reports/ee/targets/vs-actual');
        comparison = cData.data || [];
      } catch (e) {}

      const targetRows = targets.map(t => `
        <tr>
          <td>${t.occupational_level || '-'}</td>
          <td>${t.race || '-'}</td>
          <td>${t.gender || '-'}</td>
          <td style="text-align:center">${t.target_count !== null && t.target_count !== undefined ? t.target_count : '-'}</td>
          <td style="text-align:center">${t.target_percentage !== null && t.target_percentage !== undefined ? t.target_percentage + '%' : '-'}</td>
          <td>${t.financial_year || '-'}</td>
          <td>
            <button class="btn btn-sm" onclick="ReportsModule.editEETarget(${t.id})">${icon('edit',12)}</button>
            <button class="btn btn-sm" onclick="ReportsModule.deleteEETarget(${t.id})">${icon('trash',12)}</button>
          </td>
        </tr>
      `).join('');

      const compRows = comparison.map(c => {
        const variance = c.actual !== null && c.target !== null ? c.actual - c.target : null;
        const varColor = variance === null ? '#94A3B8' : variance >= 0 ? '#10B981' : '#EF4444';
        return `
          <tr>
            <td>${c.occupational_level || '-'}</td>
            <td>${c.race || '-'} ${c.gender || '-'}</td>
            <td style="text-align:center">${c.target !== null && c.target !== undefined ? c.target : '-'}</td>
            <td style="text-align:center">${c.actual !== null && c.actual !== undefined ? c.actual : '-'}</td>
            <td style="text-align:center;font-weight:700;color:${varColor}">${variance !== null ? (variance >= 0 ? '+' : '') + variance : '-'}</td>
          </tr>
        `;
      }).join('');

      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('target',16)} EE Targets</div>
          <button class="btn btn-primary" onclick="ReportsModule.showAddEETarget()">${icon('plus',14)} Add Target</button>
        </div>
        <div class="data-grid" style="margin-bottom:24px">
          <table>
            <thead><tr><th>Occupational Level</th><th>Race</th><th>Gender</th><th style="text-align:center">Target Count</th><th style="text-align:center">Target %</th><th>Financial Year</th><th>Actions</th></tr></thead>
            <tbody>${targetRows || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No EE targets set</td></tr>'}</tbody>
          </table>
        </div>
        <div class="section-header">${icon('barChart',16)} Targets vs Actual Comparison</div>
        <div class="data-grid">
          <table>
            <thead><tr><th>Occupational Level</th><th>Demographic</th><th style="text-align:center">Target</th><th style="text-align:center">Actual</th><th style="text-align:center">Variance</th></tr></thead>
            <tbody>${compRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No comparison data available</td></tr>'}</tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="loading" style="color:var(--danger)">${err.message}</div>`;
    }
  },

  showAddEETarget() {
    const fields = UI.buildForm([
      { id: 'eet_level', label: 'Occupational Level', type: 'select', required: true, options: ['Top Management','Senior Management','Professionally Qualified','Skilled Technical','Semi-Skilled','Unskilled'] },
      { id: 'eet_race', label: 'Race', type: 'select', required: true, options: ['African','Coloured','Indian','White'] },
      { id: 'eet_gender', label: 'Gender', type: 'select', required: true, options: ['Male','Female'] },
      { id: 'eet_count', label: 'Target Count', type: 'number', min: 0 },
      { id: 'eet_percentage', label: 'Target Percentage', type: 'number', min: 0, max: 100, step: 0.1 },
      { id: 'eet_year', label: 'Financial Year', type: 'text', placeholder: 'e.g. 2025/2026' },
    ]);
    UI.modal({
      title: 'Add EE Target',
      content: `<div class="form-grid" id="eet-form">${fields}</div>`,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.saveEETarget()">Save</button>`
    });
  },

  async saveEETarget() {
    const d = UI.getFormData('eet-form');
    try {
      await apiPost('/reports/ee/targets', {
        occupational_level: d.eet_level,
        race: d.eet_race,
        gender: d.eet_gender,
        target_count: d.eet_count ? parseInt(d.eet_count) : null,
        target_percentage: d.eet_percentage ? parseFloat(d.eet_percentage) : null,
        financial_year: d.eet_year,
      });
      UI.closeModal();
      UI.toast('success', 'Created', 'EE target added');
      this.renderEEContent();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async editEETarget(id) {
    try {
      const data = await api(`/reports/ee/targets/${id}`);
      const t = data.data;
      const fields = UI.buildForm([
        { id: 'eet_level', label: 'Occupational Level', type: 'select', required: true, value: t.occupational_level, options: ['Top Management','Senior Management','Professionally Qualified','Skilled Technical','Semi-Skilled','Unskilled'] },
        { id: 'eet_race', label: 'Race', type: 'select', required: true, value: t.race, options: ['African','Coloured','Indian','White'] },
        { id: 'eet_gender', label: 'Gender', type: 'select', required: true, value: t.gender, options: ['Male','Female'] },
        { id: 'eet_count', label: 'Target Count', type: 'number', min: 0, value: t.target_count },
        { id: 'eet_percentage', label: 'Target Percentage', type: 'number', min: 0, max: 100, step: 0.1, value: t.target_percentage },
        { id: 'eet_year', label: 'Financial Year', type: 'text', value: t.financial_year || '' },
      ]);
      UI.modal({
        title: 'Edit EE Target',
        content: `<div class="form-grid" id="eet-edit-form">${fields}</div>`,
        footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.updateEETarget(${id})">Update</button>`
      });
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async updateEETarget(id) {
    const d = UI.getFormData('eet-edit-form');
    try {
      await fetch(`${API_BASE}/reports/ee/targets/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupational_level: d.eet_level,
          race: d.eet_race,
          gender: d.eet_gender,
          target_count: d.eet_count ? parseInt(d.eet_count) : null,
          target_percentage: d.eet_percentage ? parseFloat(d.eet_percentage) : null,
          financial_year: d.eet_year,
        })
      });
      UI.closeModal();
      UI.toast('success', 'Updated', 'EE target updated');
      this.renderEEContent();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async deleteEETarget(id) {
    if (!confirm('Delete this EE target?')) return;
    try {
      await fetch(`${API_BASE}/reports/ee/targets/${id}`, { method: 'DELETE' });
      UI.toast('success', 'Deleted', 'EE target removed');
      this.renderEEContent();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async renderTools(el) {
    el.innerHTML = `
      <div class="section-header">${icon('settings',16)} Payroll Tools</div>
      <div class="two-col">
        <div>
          <div class="section-header">${icon('dollar',14)} Gross-Up Calculator</div>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Calculate gross salary from desired nett pay</p>
          <div class="form-grid" style="max-width:300px">
            <div class="form-group">
              <label>Desired Monthly Nett Pay (R)</label>
              <input type="number" class="form-control" id="grossup-nett" placeholder="e.g. 25000" step="100">
            </div>
            <div class="form-group">
              <label>Tax Year</label>
              <select class="form-control" id="grossup-taxyear">
                <option value="2026" selected>2026 (Mar 2025 - Feb 2026)</option>
                <option value="2025">2025 (Mar 2024 - Feb 2025)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" onclick="ReportsModule.calculateGrossUp()">${icon('dollar',14)} Calculate</button>
          <div id="grossup-result" style="margin-top:12px"></div>
        </div>
        <div>
          <div class="section-header">${icon('calendar',14)} Retroactive Pay Calculator</div>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Calculate backdated salary adjustments</p>
          <div class="form-grid" style="max-width:400px">
            <div class="form-group"><label>Employee</label><select class="form-control" id="retro-employee"><option value="">Loading...</option></select></div>
            <div class="form-group"><label>Old Annual Salary (R)</label><input type="number" class="form-control" id="retro-old-amount" placeholder="Leave blank to use current salary"></div>
            <div class="form-group"><label>New Annual Salary (R)</label><input type="number" class="form-control" id="retro-salary" placeholder="e.g. 500000"></div>
            <div class="form-group"><label>Effective Date</label><input type="date" class="form-control" id="retro-date"></div>
          </div>
          <button class="btn btn-primary" onclick="ReportsModule.calculateRetro()">${icon('dollar',14)} Calculate Retro</button>
          <div id="retro-result" style="margin-top:12px"></div>
        </div>
      </div>
      <div style="margin-top:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div class="section-header" style="margin:0">${icon('barChart',14)} CoE Projections</div>
          <button class="btn btn-primary" onclick="ReportsModule.showCoEForm()">${icon('plus',14)} New Projection</button>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Project compensation of employees costs for budget planning</p>
        <div id="coe-list"><div class="loading"><div class="spinner"></div>Loading projections...</div></div>
      </div>
    `;
    const [emps, depts] = await Promise.all([
      api('/employees?limit=100&sort_by=surname&sort_order=asc'),
      api('/departments')
    ]);
    this._departments = depts.data || [];
    const sel = document.getElementById('retro-employee');
    if (sel) sel.innerHTML = '<option value="">-- Select --</option>' + emps.data.map(e => `<option value="${e.id}">${e.employee_code} - ${e.first_name} ${e.surname}</option>`).join('');
    this.loadCoEProjections();
  },

  async loadCoEProjections() {
    const el = document.getElementById('coe-list');
    if (!el) return;
    try {
      const result = await api('/reports/coe-projections');
      const rows = result.data || [];
      if (!rows.length) {
        el.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:24px">No projections yet. Click "New Projection" to create one.</div>';
        return;
      }
      el.innerHTML = `
        <div class="data-grid">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Financial Year</th>
                <th style="text-align:right">Base CoE</th>
                <th style="text-align:right">Projected CoE</th>
                <th style="text-align:center">Increase %</th>
                <th style="text-align:center">Headcount</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.projection_name || '-'}</td>
                  <td>${r.financial_year || '-'}</td>
                  <td style="text-align:right">${formatCurrency(r.base_coe)}</td>
                  <td style="text-align:right;font-weight:600;color:var(--primary)">${formatCurrency(r.projected_coe)}</td>
                  <td style="text-align:center">${r.salary_increase_pct || 0}%</td>
                  <td style="text-align:center">${r.projected_headcount || '-'}</td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.assumptions || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div style="color:var(--danger)">${err.message}</div>`;
    }
  },

  showCoEForm() {
    const deptOptions = (this._departments || []).map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    UI.modal({
      title: 'New CoE Projection',
      content: `
        <div class="form-grid" id="coe-form">
          <div class="form-group">
            <label>Financial Year</label>
            <input type="text" class="form-control" id="coe-year" placeholder="e.g. 2025/2026" required>
          </div>
          <div class="form-group">
            <label>Department (optional)</label>
            <select class="form-control" id="coe-dept">
              <option value="">All Departments</option>
              ${deptOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Total CoE / Base Amount (R)</label>
            <input type="number" class="form-control" id="coe-total" placeholder="Leave blank to auto-calculate" step="0.01">
          </div>
          <div class="form-group">
            <label>Salary Increase %</label>
            <input type="number" class="form-control" id="coe-increase" placeholder="e.g. 5.5" step="0.1">
          </div>
          <div class="form-group">
            <label>Vacancy Fill Rate %</label>
            <input type="number" class="form-control" id="coe-fill" placeholder="e.g. 80" step="1" value="100">
          </div>
          <div class="form-group">
            <label>New Positions</label>
            <input type="number" class="form-control" id="coe-new" placeholder="e.g. 10" value="0">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Notes</label>
            <textarea class="form-control" id="coe-notes" rows="2" placeholder="Assumptions and notes"></textarea>
          </div>
        </div>
      `,
      footer: `<button class="btn" data-close-modal>Cancel</button><button class="btn btn-primary" onclick="ReportsModule.calculateCoE()">${icon('barChart',14)} Calculate & Save</button>`
    });
  },

  async calculateCoE() {
    const year = document.getElementById('coe-year')?.value;
    const deptId = document.getElementById('coe-dept')?.value;
    const totalCoe = document.getElementById('coe-total')?.value;
    const increase = document.getElementById('coe-increase')?.value;
    const fill = document.getElementById('coe-fill')?.value;
    const newPos = document.getElementById('coe-new')?.value;
    const notes = document.getElementById('coe-notes')?.value;
    if (!year) { UI.toast('error', 'Error', 'Enter a financial year'); return; }
    try {
      const result = await apiPost('/reports/coe-projections', {
        financial_year: year,
        department_id: deptId ? parseInt(deptId) : null,
        total_coe: totalCoe ? parseFloat(totalCoe) : null,
        salary_increase_pct: increase ? parseFloat(increase) : 0,
        vacancy_fill_rate: fill ? parseFloat(fill) : 100,
        new_positions: newPos ? parseInt(newPos) : 0,
        notes: notes || null,
      });
      const d = result.data;
      UI.closeModal();
      UI.toast('success', 'Projection Created', `Projected CoE: ${formatCurrency(d.projected_coe)} for ${year}`);
      this.loadCoEProjections();
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async calculateGrossUp() {
    const nett = parseFloat(document.getElementById('grossup-nett')?.value);
    const taxYear = document.getElementById('grossup-taxyear')?.value;
    if (!nett) { UI.toast('error', 'Error', 'Enter desired nett pay'); return; }
    try {
      const result = await apiPost('/reports/gross-up', { target_nett: nett, tax_year: parseInt(taxYear || 2026) });
      const d = result.data;
      document.getElementById('grossup-result').innerHTML = `
        <div class="stat-cards">
          <div class="stat-card"><div class="stat-value" style="color:var(--success-dark)">R ${d.calculated_gross_monthly.toLocaleString()}</div><div class="stat-label">Monthly Gross</div></div>
          <div class="stat-card"><div class="stat-value">R ${d.calculated_gross_annual.toLocaleString()}</div><div class="stat-label">Annual Gross</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--danger)">R ${d.estimated_paye_monthly.toLocaleString()}</div><div class="stat-label">Est. Monthly PAYE</div></div>
        </div>
      `;
    } catch (err) { UI.toast('error', 'Error', err.message); }
  },

  async calculateRetro() {
    const empId = document.getElementById('retro-employee')?.value;
    const salary = document.getElementById('retro-salary')?.value;
    const oldAmount = document.getElementById('retro-old-amount')?.value;
    const date = document.getElementById('retro-date')?.value;
    if (!empId || !salary || !date) { UI.toast('error', 'Error', 'Please fill in employee, new salary and date'); return; }
    try {
      const body = {
        employee_id: parseInt(empId),
        new_amount: parseFloat(salary),
        effective_date: date,
      };
      if (oldAmount) body.old_amount = parseFloat(oldAmount);
      const result = await apiPost('/reports/retro-calculate', body);
      const d = result.data;
      document.getElementById('retro-result').innerHTML = `
        <div class="stat-cards">
          <div class="stat-card"><div class="stat-value">R ${d.old_annual_salary.toLocaleString()}</div><div class="stat-label">Old Annual</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--success-dark)">R ${d.new_annual_salary.toLocaleString()}</div><div class="stat-label">New Annual</div></div>
          <div class="stat-card"><div class="stat-value">${d.affected_periods}</div><div class="stat-label">Affected Periods</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--primary)">R ${d.total_retroactive_amount.toLocaleString()}</div><div class="stat-label">Total Retro Pay</div></div>
        </div>
        ${d.adjustments && d.adjustments.length ? `
        <div class="data-grid" style="margin-top:12px">
          <table>
            <thead><tr><th>Period</th><th>Tax Year</th><th style="text-align:right">Adjustment</th></tr></thead>
            <tbody>${d.adjustments.map(a => `<tr><td>Period ${a.period_number}</td><td>${a.tax_year}</td><td style="text-align:right">${formatCurrency(a.adjustment_amount)}</td></tr>`).join('')}</tbody>
          </table>
        </div>` : ''}
      `;
    } catch (err) { UI.toast('error', 'Error', err.message); }
  }
};
