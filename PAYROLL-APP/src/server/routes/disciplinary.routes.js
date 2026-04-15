const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');
const { createNotification } = require('../services/notification.service');

router.get('/cases', authenticate, async (req, res, next) => {
  try {
    const { status, employee_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (status) { where += ` AND dc.status = $${pi}`; params.push(status); pi++; }
    if (employee_id) { where += ` AND dc.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }

    const result = await dbQuery(
      `SELECT dc.*, e.employee_code, e.first_name, e.surname
       FROM disciplinary_cases dc
       JOIN employees e ON dc.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id
       ${where} ORDER BY dc.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/cases', authenticate, auditLog('CREATE', 'disciplinary_case'), async (req, res, next) => {
  try {
    const { employee_id, charge_description, offence_date, hearing_date, hearing_chairperson } = req.body;
    const caseNum = `DC-${Date.now().toString().slice(-6)}`;
    const result = await dbQuery(
      `INSERT INTO disciplinary_cases (employee_id, case_number, charge_description, offence_date, hearing_date, hearing_chairperson, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, caseNum, charge_description, offence_date, hearing_date, hearing_chairperson, req.user?.id || 1]
    );
    await createNotification({ title: 'Disciplinary Case Initiated', message: `Case ${caseNum} created`, type: 'WARNING', category: 'DISCIPLINARY', referenceType: 'disciplinary_case', referenceId: result.rows[0].id });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/cases/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT dc.*, e.employee_code, e.first_name, e.surname FROM disciplinary_cases dc JOIN employees e ON dc.employee_id = e.id WHERE dc.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Case not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/cases/:id', authenticate, auditLog('UPDATE', 'disciplinary_case'), async (req, res, next) => {
  try {
    const { status, outcome, sanction, hearing_date, hearing_chairperson, appeal_date, appeal_outcome, ccma_referral, ccma_case_number, ccma_outcome } = req.body;
    const result = await dbQuery(
      `UPDATE disciplinary_cases SET status=$1, outcome=$2, sanction=$3, hearing_date=$4, hearing_chairperson=$5,
       appeal_date=$6, appeal_outcome=$7, ccma_referral=$8, ccma_case_number=$9, ccma_outcome=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [status, outcome, sanction, hearing_date, hearing_chairperson, appeal_date, appeal_outcome, ccma_referral, ccma_case_number, ccma_outcome, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/grievances', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE 1=1'; const params = [];
    if (status) { where += ' AND g.status = $1'; params.push(status); }
    const result = await dbQuery(
      `SELECT g.*, e.employee_code, e.first_name, e.surname,
              CASE
                WHEN g.sla_deadline IS NOT NULL THEN g.sla_deadline
                ELSE (g.created_at::date + INTERVAL '30 days')::date
              END AS calculated_sla_deadline,
              CASE
                WHEN g.status IN ('RESOLVED', 'CLOSED') THEN 'COMPLETED'
                WHEN COALESCE(g.sla_deadline, g.created_at::date + INTERVAL '30 days') < CURRENT_DATE THEN 'OVERDUE'
                WHEN COALESCE(g.sla_deadline, g.created_at::date + INTERVAL '30 days') <= CURRENT_DATE + INTERVAL '7 days' THEN 'AT_RISK'
                ELSE 'ON_TIME'
              END AS calculated_sla_status
       FROM grievances g JOIN employees e ON g.employee_id = e.id ${where} ORDER BY g.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/grievances', authenticate, auditLog('CREATE', 'grievance'), async (req, res, next) => {
  try {
    const { employee_id, description, category } = req.body;
    const gNum = `GR-${Date.now().toString().slice(-6)}`;
    const result = await dbQuery(
      `INSERT INTO grievances (employee_id, grievance_number, description, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [employee_id, gNum, description, category]
    );
    await createNotification({ title: 'Grievance Filed', message: `Grievance ${gNum} submitted`, type: 'WARNING', category: 'GRIEVANCE' });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/grievances/:id', authenticate, auditLog('UPDATE', 'grievance'), async (req, res, next) => {
  try {
    const { status, investigator, resolution } = req.body;
    const result = await dbQuery(
      `UPDATE grievances SET status=$1, investigator=$2, resolution=$3, updated_at=NOW() WHERE id=$4 RETURNING *`,
      [status, investigator, resolution, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/progression/:employeeId', authenticate, async (req, res, next) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const cases = await dbQuery(
      `SELECT dc.*, e.employee_code, e.first_name, e.surname
       FROM disciplinary_cases dc
       JOIN employees e ON dc.employee_id = e.id
       WHERE dc.employee_id = $1
       ORDER BY dc.created_at ASC`,
      [employeeId]
    );

    const progressionOrder = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'FINAL_WRITTEN_WARNING', 'DISMISSAL'];
    const history = cases.rows.map(c => ({
      id: c.id,
      case_number: c.case_number,
      charge_description: c.charge_description,
      offence_date: c.offence_date,
      hearing_date: c.hearing_date,
      status: c.status,
      outcome: c.outcome,
      sanction: c.sanction,
      progressive_step: c.progressive_step || c.sanction,
      created_at: c.created_at
    }));

    const sanctions = history.map(h => h.progressive_step).filter(Boolean);
    let currentLevel = 'NONE';
    let nextStep = 'VERBAL_WARNING';
    for (const step of progressionOrder) {
      if (sanctions.includes(step)) {
        currentLevel = step;
        const idx = progressionOrder.indexOf(step);
        nextStep = idx < progressionOrder.length - 1 ? progressionOrder[idx + 1] : 'DISMISSAL';
      }
    }

    res.json({
      success: true,
      data: {
        employee_id: employeeId,
        total_cases: history.length,
        current_level: currentLevel,
        next_step: nextStep,
        progression_order: progressionOrder,
        history
      }
    });
  } catch (err) { next(err); }
});

router.get('/compliance-check/:employeeId', authenticate, async (req, res, next) => {
  try {
    const employeeId = parseInt(req.params.employeeId, 10);
    const emp = await dbQuery('SELECT * FROM employees WHERE id = $1', [employeeId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const cases = await dbQuery(
      `SELECT * FROM disciplinary_cases WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );

    const issues = [];
    for (const c of cases.rows) {
      if (c.status === 'OPEN' && c.hearing_date) {
        const hearingDate = new Date(c.hearing_date);
        const now = new Date();
        if (hearingDate < now && !c.outcome) {
          issues.push({ case_id: c.id, case_number: c.case_number, issue: 'Hearing date passed without recorded outcome', severity: 'HIGH' });
        }
      }
      if (c.sanction === 'DISMISSAL' && !c.hearing_date) {
        issues.push({ case_id: c.id, case_number: c.case_number, issue: 'Dismissal without hearing violates LRA Section 188', severity: 'CRITICAL' });
      }
      if (c.sanction === 'DISMISSAL' && !c.hearing_chairperson) {
        issues.push({ case_id: c.id, case_number: c.case_number, issue: 'Dismissal hearing without chairperson recorded', severity: 'HIGH' });
      }
      if (c.ccma_referral && !c.ccma_case_number) {
        issues.push({ case_id: c.id, case_number: c.case_number, issue: 'CCMA referral noted but no case number recorded', severity: 'MEDIUM' });
      }
    }

    const grievances = await dbQuery(
      `SELECT * FROM grievances WHERE employee_id = $1 AND status NOT IN ('RESOLVED', 'CLOSED') ORDER BY created_at DESC`,
      [employeeId]
    );
    for (const g of grievances.rows) {
      const filed = new Date(g.created_at);
      const daysSince = Math.floor((Date.now() - filed.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 30 && g.status !== 'RESOLVED') {
        issues.push({ grievance_id: g.id, grievance_number: g.grievance_number, issue: `Grievance unresolved for ${daysSince} days (LRA recommends 30-day resolution)`, severity: 'MEDIUM' });
      }
    }

    res.json({
      success: true,
      data: {
        employee_id: employeeId,
        employee_name: `${emp.rows[0].first_name} ${emp.rows[0].surname}`,
        compliant: issues.filter(i => i.severity === 'CRITICAL').length === 0,
        total_issues: issues.length,
        critical_issues: issues.filter(i => i.severity === 'CRITICAL').length,
        issues
      }
    });
  } catch (err) { next(err); }
});

router.get('/:id/notice-to-attend', authenticate, async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const caseResult = await dbQuery(
      `SELECT dc.*, e.employee_code, e.first_name, e.surname, e.position_id,
              p.title AS position_title
       FROM disciplinary_cases dc
       JOIN employees e ON dc.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE dc.id = $1`,
      [req.params.id]
    );
    if (!caseResult.rows.length) return res.status(404).json({ success: false, error: { message: 'Case not found' } });
    const c = caseResult.rows[0];

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="notice_to_attend_${c.case_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('NOTICE TO ATTEND DISCIPLINARY HEARING', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`);
    doc.moveDown();
    doc.text(`To: ${c.first_name} ${c.surname} (${c.employee_code})`);
    doc.text(`Position: ${c.position_title || 'N/A'}`);
    doc.text(`Department: ${c.department_name || 'N/A'}`);
    doc.moveDown();
    doc.text(`Case Number: ${c.case_number}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('You are hereby notified to attend a disciplinary hearing as follows:');
    doc.moveDown();
    doc.font('Helvetica');
    doc.text(`Date of Hearing: ${c.hearing_date ? new Date(c.hearing_date).toLocaleDateString('en-ZA') : 'To be confirmed'}`);
    doc.text(`Chairperson: ${c.hearing_chairperson || 'To be confirmed'}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Charge(s):');
    doc.font('Helvetica').text(c.charge_description || 'As per attached charge sheet');
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Date of Offence:');
    doc.font('Helvetica').text(c.offence_date ? new Date(c.offence_date).toLocaleDateString('en-ZA') : 'N/A');
    doc.moveDown(2);
    doc.text('You have the right to:');
    doc.list([
      'Be represented by a fellow employee or trade union representative',
      'Call witnesses on your behalf',
      'Cross-examine witnesses called against you',
      'Present evidence in your defence',
      'Receive an interpreter if required'
    ]);
    doc.moveDown(2);
    doc.text('____________________________          ____________________________');
    doc.text('Presiding Officer Signature              Date');
    doc.moveDown(2);
    doc.text('____________________________          ____________________________');
    doc.text('Employee Signature                         Date');

    doc.end();
  } catch (err) { next(err); }
});

router.get('/:id/outcome-letter', authenticate, async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const caseResult = await dbQuery(
      `SELECT dc.*, e.employee_code, e.first_name, e.surname, e.position_id,
              p.title AS position_title
       FROM disciplinary_cases dc
       JOIN employees e ON dc.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE dc.id = $1`,
      [req.params.id]
    );
    if (!caseResult.rows.length) return res.status(404).json({ success: false, error: { message: 'Case not found' } });
    const c = caseResult.rows[0];

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="outcome_letter_${c.case_number}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('DISCIPLINARY HEARING OUTCOME', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`);
    doc.moveDown();
    doc.text(`To: ${c.first_name} ${c.surname} (${c.employee_code})`);
    doc.text(`Position: ${c.position_title || 'N/A'}`);
    doc.text(`Department: ${c.department_name || 'N/A'}`);
    doc.moveDown();
    doc.text(`Case Number: ${c.case_number}`);
    doc.text(`Hearing Date: ${c.hearing_date ? new Date(c.hearing_date).toLocaleDateString('en-ZA') : 'N/A'}`);
    doc.text(`Chairperson: ${c.hearing_chairperson || 'N/A'}`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Charge(s):');
    doc.font('Helvetica').text(c.charge_description || 'N/A');
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Finding:');
    doc.font('Helvetica').text(c.outcome || 'Pending');
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Sanction:');
    doc.font('Helvetica').text(c.sanction || 'N/A');
    doc.moveDown();
    if (c.hearing_minutes) {
      doc.font('Helvetica-Bold').text('Hearing Minutes:');
      doc.font('Helvetica').text(c.hearing_minutes);
      doc.moveDown();
    }
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Appeal Rights:');
    doc.font('Helvetica').text('You have the right to appeal this decision within 5 working days of receipt of this letter. You also have the right to refer a dispute to the CCMA within 30 days in terms of Section 191 of the Labour Relations Act.');
    doc.moveDown(2);
    doc.text('____________________________          ____________________________');
    doc.text('Chairperson Signature                      Date');
    doc.moveDown(2);
    doc.text('____________________________          ____________________________');
    doc.text('Employee Signature                         Date');

    doc.end();
  } catch (err) { next(err); }
});

router.put('/cases/:id/ccma-workflow', authenticate, auditLog('UPDATE', 'disciplinary_case'), async (req, res, next) => {
  try {
    const { ccma_referral, ccma_case_number, ccma_outcome, ccma_status } = req.body;
    const updates = [];
    const values = [];
    let pi = 1;
    if (ccma_referral !== undefined) { updates.push(`ccma_referral = $${pi++}`); values.push(ccma_referral); }
    if (ccma_case_number !== undefined) { updates.push(`ccma_case_number = $${pi++}`); values.push(ccma_case_number); }
    if (ccma_outcome !== undefined) { updates.push(`ccma_outcome = $${pi++}`); values.push(ccma_outcome); }
    updates.push('updated_at = NOW()');
    values.push(req.params.id);

    if (updates.length <= 1) {
      return res.status(400).json({ success: false, error: { message: 'No CCMA fields to update' } });
    }

    const result = await dbQuery(
      `UPDATE disciplinary_cases SET ${updates.join(', ')} WHERE id = $${pi} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Case not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
