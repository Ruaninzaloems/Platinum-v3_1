const PDFDocument = require('pdfkit');
const fs = require('fs');
const { query: dbQuery } = require('../config/database');

const DEFAULT_MUNICIPALITY = {
  name: 'Platinum Municipality',
  address: '',
  phone: '',
  email: '',
  logoPath: null,
};

async function loadMunicipalityDetails() {
  try {
    const result = await dbQuery("SELECT key, value FROM system_settings WHERE category IN ('municipality', 'sars') ORDER BY key");
    const s = {};
    result.rows.forEach(r => { s[r.key] = r.value; });
    const logoPath = s.municipality_logo || null;
    return {
      name: s.municipality_name || s.irp5_trading_name || DEFAULT_MUNICIPALITY.name,
      address: [s.municipality_address_line1, s.municipality_address_line2].filter(Boolean).join(', ') || DEFAULT_MUNICIPALITY.address,
      phone: s.municipality_telephone || DEFAULT_MUNICIPALITY.phone,
      email: s.municipality_email || DEFAULT_MUNICIPALITY.email,
      logoPath: logoPath && fs.existsSync(logoPath) ? logoPath : null,
    };
  } catch (e) {
    return DEFAULT_MUNICIPALITY;
  }
}

function fmtCurrency(val) {
  const num = parseFloat(val || 0);
  const parts = num.toFixed(2).split('.');
  const whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R ${whole}.${parts[1]}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function claimTypeLabel(type) {
  const map = { 'S_AND_T': 'S & T', 'TRAVEL': 'Travel', 'OTHER': 'Other' };
  return map[type] || type;
}

async function generateClaimPDF(claimId) {
  const claimResult = await dbQuery(
    `SELECT c.*, e.first_name, e.surname, e.employee_code, e.id_number,
            p.title AS position_title, p.department_id, p.division_id
     FROM claims c
     JOIN employees e ON c.employee_id = e.id
     LEFT JOIN positions p ON e.position_id = p.id
     WHERE c.id = $1`, [claimId]
  );
  if (!claimResult.rows.length) throw new Error('Claim not found');
  const claim = claimResult.rows[0];

  try {
    const { enrichSingle } = require('../routes/department.routes');
    await enrichSingle(claim);
  } catch (_) {}

  let tariffInfo = null;
  if (claim.sub_type) {
    try {
      const configResult = await dbQuery(
        `SELECT cc.*, spr.rate AS sars_rate, spr.description AS sars_description
         FROM claim_configurations cc
         LEFT JOIN sars_prescribed_rates spr ON cc.sars_prescribed_rate_id = spr.id
         WHERE cc.claim_subtype = $1
         AND (cc.end_date IS NULL OR cc.end_date >= CURRENT_DATE)
         LIMIT 1`, [claim.sub_type]
      );
      if (configResult.rows.length > 0) {
        const cfg = configResult.rows[0];
        tariffInfo = {
          clientPolicy: cfg.client_policy ? parseFloat(cfg.client_policy) : null,
          sarsRate: cfg.sars_rate ? parseFloat(cfg.sars_rate) : null,
          sarsDescription: cfg.sars_description || null,
          appliedRate: cfg.client_policy ? parseFloat(cfg.client_policy) : (cfg.sars_rate ? parseFloat(cfg.sars_rate) : null),
          source: cfg.client_policy ? 'Client Policy' : (cfg.sars_rate ? 'SARS Prescribed Rate' : null),
        };
      }
    } catch (_) {}
  }

  const historyResult = await dbQuery(
    `SELECT ch.action, ch.comments, ch.performed_at,
            COALESCE(e.first_name || ' ' || e.surname, 'System') AS performed_by_name
     FROM claim_history ch
     LEFT JOIN employees e ON ch.performed_by = e.id
     WHERE ch.claim_id = $1
     ORDER BY ch.performed_at ASC`, [claimId]
  );
  const history = historyResult.rows;

  const municipality = await loadMunicipalityDetails();

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  if (municipality.logoPath) {
    try {
      doc.image(municipality.logoPath, 40, 40, { width: 60, height: 50, fit: [60, 50] });
      doc.fontSize(14).font('Helvetica-Bold').text(municipality.name, 110, 45, { width: 405, align: 'center' });
      doc.fontSize(10).font('Helvetica').text('CLAIM FORM', 110, 63, { width: 405, align: 'center' });
      doc.y = 100;
    } catch (_) {
      doc.fontSize(14).font('Helvetica-Bold').text(municipality.name, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('CLAIM FORM', { align: 'center' });
    }
  } else {
    doc.fontSize(14).font('Helvetica-Bold').text(municipality.name, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('CLAIM FORM', { align: 'center' });
  }
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).lineWidth(1.5).stroke();
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333');
  doc.text(`Claim #${claim.id}`, 40, doc.y, { continued: true });
  doc.font('Helvetica').text(`     Status: ${claim.status}`, { align: 'right' });
  doc.moveDown(0.5);

  const col1 = 40;
  const col2 = 300;
  let y = doc.y;

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
  doc.text('EMPLOYEE DETAILS', col1, y);
  y += 16;
  doc.moveTo(col1, y).lineTo(260, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
  y += 6;

  doc.fontSize(8).font('Helvetica').fillColor('#333333');

  const empRows = [
    ['Employee Code', claim.employee_code || '-'],
    ['Name', `${claim.first_name} ${claim.surname}`],
    ['ID Number', claim.id_number || '-'],
    ['Position', claim.position_title || '-'],
    ['Department', claim.department_name || '-'],
  ];

  empRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label + ':', col1, y, { width: 100 });
    doc.font('Helvetica').text(value, col1 + 105, y);
    y += 14;
  });

  y = doc.y + 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
  doc.text('CLAIM DETAILS', col1, y);
  y += 16;
  doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
  y += 6;

  doc.fontSize(8).fillColor('#333333');

  const claimRows = [
    ['Claim Type', claimTypeLabel(claim.claim_type)],
    ['Sub-Type', claim.sub_type || '-'],
    ['Start Date', fmtDate(claim.start_date)],
  ];
  if (claim.end_date) claimRows.push(['End Date', fmtDate(claim.end_date)]);
  if (claim.kilometres) claimRows.push(['Kilometres', `${parseFloat(claim.kilometres).toFixed(2)} km`]);
  claimRows.push(['Amount', fmtCurrency(claim.amount)]);
  if (claim.reference_no) claimRows.push(['Reference No', claim.reference_no]);
  claimRows.push(['Date Submitted', fmtDate(claim.created_at)]);

  if (claim.claim_type === 'S_AND_T' && claim.start_date && claim.end_date) {
    const start = new Date(claim.start_date);
    const end = new Date(claim.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = parseFloat(claim.amount) / days;
    claimRows.push(['Days', String(days)]);
    claimRows.push(['Daily Rate', fmtCurrency(dailyRate)]);
  }

  const midPoint = Math.ceil(claimRows.length / 2);
  const leftRows = claimRows.slice(0, midPoint);
  const rightRows = claimRows.slice(midPoint);

  const startY = y;
  leftRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label + ':', col1, y, { width: 100 });
    doc.font('Helvetica').text(value, col1 + 105, y);
    y += 14;
  });

  let y2 = startY;
  rightRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(label + ':', col2, y2, { width: 100 });
    doc.font('Helvetica').text(value, col2 + 105, y2);
    y2 += 14;
  });

  y = Math.max(y, y2);

  if (claim.reason) {
    y += 4;
    doc.font('Helvetica-Bold').text('Reason:', col1, y);
    y += 14;
    doc.font('Helvetica').text(claim.reason, col1, y, { width: 515 });
    y = doc.y + 4;
  }

  if (tariffInfo && tariffInfo.appliedRate) {
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
    doc.text('TARIFF / RATE DETAILS', col1, y);
    y += 16;
    doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
    y += 6;

    doc.fontSize(8).fillColor('#333333');
    if (tariffInfo.sarsRate != null) {
      doc.font('Helvetica-Bold').text('SARS Prescribed Rate:', col1, y, { width: 140 });
      doc.font('Helvetica').text(`${fmtCurrency(tariffInfo.sarsRate)}${tariffInfo.sarsDescription ? ' (' + tariffInfo.sarsDescription + ')' : ''}`, col1 + 145, y);
      y += 14;
    }
    if (tariffInfo.clientPolicy != null) {
      doc.font('Helvetica-Bold').text('Client Policy Rate:', col1, y, { width: 140 });
      doc.font('Helvetica').text(fmtCurrency(tariffInfo.clientPolicy), col1 + 145, y);
      y += 14;
    }
    doc.font('Helvetica-Bold').text('Applied Rate:', col1, y, { width: 140 });
    doc.font('Helvetica').text(`${fmtCurrency(tariffInfo.appliedRate)} (${tariffInfo.source})`, col1 + 145, y);
    y += 14;

    if (claim.claim_type === 'TRAVEL' && claim.kilometres) {
      doc.font('Helvetica-Bold').text('Calculation:', col1, y, { width: 140 });
      doc.font('Helvetica').text(`${parseFloat(claim.kilometres).toFixed(2)} km x ${fmtCurrency(tariffInfo.appliedRate)} = ${fmtCurrency(claim.amount)}`, col1 + 145, y);
      y += 14;
    }
    if (claim.claim_type === 'S_AND_T' && claim.start_date && claim.end_date) {
      const s = new Date(claim.start_date);
      const e = new Date(claim.end_date);
      const d = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      doc.font('Helvetica-Bold').text('Calculation:', col1, y, { width: 140 });
      doc.font('Helvetica').text(`${d} day(s) x ${fmtCurrency(tariffInfo.appliedRate)} = ${fmtCurrency(claim.amount)}`, col1 + 145, y);
      y += 14;
    }
  }

  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
  doc.text('AMOUNT', col1, y);
  y += 16;
  doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
  y += 8;

  doc.rect(col1, y, 515, 30).fillColor('#f0f4f8').fill();
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a4480');
  doc.text(fmtCurrency(claim.amount), col1, y + 8, { width: 515, align: 'center' });
  y += 40;

  if (history.length > 0) {
    y += 6;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
    doc.text('APPROVAL HISTORY', col1, y);
    y += 16;
    doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
    y += 6;

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#333333');
    doc.text('Action', col1, y, { width: 80 });
    doc.text('By', col1 + 85, y, { width: 140 });
    doc.text('Date', col1 + 230, y, { width: 100 });
    doc.text('Comments', col1 + 335, y, { width: 180 });
    y += 12;
    doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.3).strokeColor('#cccccc').stroke();
    y += 4;

    doc.font('Helvetica');
    history.forEach(h => {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
      doc.text(h.action, col1, y, { width: 80 });
      doc.text(h.performed_by_name, col1 + 85, y, { width: 140 });
      doc.text(fmtDate(h.performed_at), col1 + 230, y, { width: 100 });
      doc.text(h.comments || '-', col1 + 335, y, { width: 180 });
      y += 12;
    });
  }

  if (y > 680) {
    doc.addPage();
    y = 40;
  } else {
    y += 20;
  }

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a4480');
  doc.text('SIGNATURES', col1, y);
  y += 16;
  doc.moveTo(col1, y).lineTo(555, y).lineWidth(0.5).strokeColor('#1a4480').stroke();
  y += 12;

  const sigCol1 = 40;
  const sigCol2 = 220;
  const sigCol3 = 400;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
  doc.text('Employee / Claimant:', sigCol1, y);
  doc.text('Manager / Supervisor:', sigCol2, y);
  doc.text('Finance Officer:', sigCol3, y);
  y += 28;
  doc.moveTo(sigCol1, y).lineTo(sigCol1 + 150, y).lineWidth(0.5).strokeColor('#333333').stroke();
  doc.moveTo(sigCol2, y).lineTo(sigCol2 + 150, y).lineWidth(0.5).strokeColor('#333333').stroke();
  doc.moveTo(sigCol3, y).lineTo(sigCol3 + 150, y).lineWidth(0.5).strokeColor('#333333').stroke();
  y += 4;
  doc.font('Helvetica').fontSize(7);
  doc.text(`${claim.first_name} ${claim.surname}`, sigCol1, y);

  y += 16;
  doc.text('Date: ________________', sigCol1, y);
  doc.text('Date: ________________', sigCol2, y);
  doc.text('Date: ________________', sigCol3, y);

  y += 30;
  doc.fontSize(6).font('Helvetica').fillColor('#888888');
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]} | ${municipality.name} | Claim #${claim.id}`, col1, y, { align: 'center', width: 515 });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

module.exports = { generateClaimPDF };
