const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery, getClient } = require('../config/database');
const { createNotification } = require('../services/notification.service');

router.get('/vacancies/from-organogram', authenticate, async (req, res, next) => {
  try {
    const { department_id } = req.query;
    let where = 'WHERE p.status = \'VACANT\' AND p.enabled = TRUE';
    const params = [];
    let pi = 1;
    if (department_id) {
      where += ` AND p.department_id = $${pi}`;
      params.push(parseInt(department_id, 10));
      pi++;
    }
    const result = await dbQuery(
      `SELECT p.id, p.position_code, p.title, p.funded, p.capacity, p.is_hod,
              p.department_id,
              p.division_id,
              tg.grade_code, tg.grade_name,
              jp.job_title AS profile_title
       FROM positions p
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       ${where}
       AND NOT EXISTS (
         SELECT 1 FROM recruitment_vacancies rv
         WHERE rv.position_id = p.id AND rv.status NOT IN ('CANCELLED', 'CLOSED')
       )
       ORDER BY p.position_code`,
      params
    );
    const { enrichDeptDiv } = require('./department.routes');
    await enrichDeptDiv(result.rows);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/vacancies', authenticate, async (req, res, next) => {
  try {
    const { status, department_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (status) { where += ` AND rv.status = $${pi}`; params.push(status); pi++; }
    if (department_id) { where += ` AND rv.department_id = $${pi}`; params.push(parseInt(department_id)); pi++; }
    const result = await dbQuery(
      `SELECT rv.*, p.title AS position_title, p.position_code,
              (SELECT COUNT(*) FROM recruitment_applicants ra WHERE ra.vacancy_id = rv.id) AS applicant_count
       FROM recruitment_vacancies rv
       LEFT JOIN positions p ON rv.position_id = p.id
       ${where} ORDER BY rv.created_at DESC`, params
    );
    const { enrichDeptDiv } = require('./department.routes');
    await enrichDeptDiv(result.rows);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/vacancies', authenticate, auditLog('CREATE', 'vacancy'), async (req, res, next) => {
  try {
    const { position_id, title, department_id, closing_date, salary_range_min, salary_range_max, requirements, duties } = req.body;
    const reqNum = `REQ-${Date.now().toString().slice(-6)}`;
    const result = await dbQuery(
      `INSERT INTO recruitment_vacancies (position_id, requisition_number, title, department_id, closing_date, salary_range_min, salary_range_max, requirements, duties, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [position_id, reqNum, title, department_id, closing_date, salary_range_min, salary_range_max, requirements, duties, req.user?.id || 1]
    );

    if (position_id) {
      const pos = await dbQuery('SELECT status FROM positions WHERE id = $1', [position_id]);
      if (pos.rows.length > 0 && pos.rows[0].status !== 'VACANT') {
        await dbQuery(
          `UPDATE positions SET status = 'VACANT', updated_at = NOW(), updated_by = $1 WHERE id = $2`,
          [req.user?.id || 1, position_id]
        );
      }
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/vacancies/:id', authenticate, async (req, res, next) => {
  try {
    const vacancy = await dbQuery(
      `SELECT rv.*, p.title AS position_title
       FROM recruitment_vacancies rv LEFT JOIN positions p ON rv.position_id = p.id
       WHERE rv.id = $1`, [req.params.id]
    );
    if (!vacancy.rows.length) return res.status(404).json({ success: false, error: { message: 'Vacancy not found' } });
    const applicants = await dbQuery('SELECT * FROM recruitment_applicants WHERE vacancy_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: { ...vacancy.rows[0], applicants: applicants.rows } });
  } catch (err) { next(err); }
});

router.put('/vacancies/:id', authenticate, auditLog('UPDATE', 'vacancy'), async (req, res, next) => {
  try {
    const { status, closing_date, requirements, duties } = req.body;
    const result = await dbQuery(
      `UPDATE recruitment_vacancies SET status=$1, closing_date=$2, requirements=$3, duties=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [status, closing_date, requirements, duties, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/applicants', authenticate, async (req, res, next) => {
  try {
    const { vacancy_id, status } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (vacancy_id) { where += ` AND ra.vacancy_id = $${pi}`; params.push(parseInt(vacancy_id)); pi++; }
    if (status) { where += ` AND ra.status = $${pi}`; params.push(status); pi++; }
    const result = await dbQuery(
      `SELECT ra.*, rv.title AS vacancy_title, rv.requisition_number
       FROM recruitment_applicants ra JOIN recruitment_vacancies rv ON ra.vacancy_id = rv.id
       ${where} ORDER BY ra.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/applicants', authenticate, auditLog('CREATE', 'applicant'), async (req, res, next) => {
  try {
    const { vacancy_id, first_name, surname, id_number, email, phone, qualifications, experience_years } = req.body;
    const result = await dbQuery(
      `INSERT INTO recruitment_applicants (vacancy_id, first_name, surname, id_number, email, phone, qualifications, experience_years)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vacancy_id, first_name, surname, id_number, email, phone, qualifications, experience_years]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/applicants/:id', authenticate, auditLog('UPDATE', 'applicant'), async (req, res, next) => {
  try {
    const { status, interview_date, interview_score, notes } = req.body;
    const result = await dbQuery(
      `UPDATE recruitment_applicants SET status=$1, interview_date=$2, interview_score=$3, notes=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [status, interview_date, interview_score, notes, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: { message: 'Applicant not found' } });
    }

    const applicant = result.rows[0];
    let employeeRecord = null;
    let onboardingChecklist = null;

    if (status === 'APPOINTED') {
      const vacancy = await dbQuery(
        `SELECT rv.*, p.id AS pos_id, p.title AS position_title, p.department_id AS pos_department_id,
                p.task_grade_id AS pos_task_grade_id, p.employee_type_id AS pos_employee_type_id,
                p.condition_of_service_id AS pos_condition_of_service_id
         FROM recruitment_vacancies rv
         LEFT JOIN positions p ON rv.position_id = p.id
         WHERE rv.id = $1`,
        [applicant.vacancy_id]
      );
      const vac = vacancy.rows[0];

      if (vac && vac.pos_id) {
        await dbQuery(
          `UPDATE positions SET status = 'FILLED', updated_at = NOW(), updated_by = $1 WHERE id = $2`,
          [req.user?.id || 1, vac.pos_id]
        );
      }

      const existingEmployee = await dbQuery(
        'SELECT id FROM employees WHERE id_number = $1 AND id_number IS NOT NULL LIMIT 1',
        [applicant.id_number]
      );

      if (existingEmployee.rows.length > 0) {
        const empId = existingEmployee.rows[0].id;
        if (vac && vac.pos_id) {
          await dbQuery(
            `UPDATE employees SET position_id = $1, status = 'ACTIVE', updated_at = NOW(), updated_by = $2 WHERE id = $3`,
            [vac.pos_id, req.user?.id || 1, empId]
          );
        }
        employeeRecord = { id: empId, linked: true };
      } else {
        const empCode = `EMP-${Date.now().toString().slice(-6)}`;
        const newEmp = await dbQuery(
          `INSERT INTO employees (
            employee_code, first_name, surname, id_number, email_address, cell_number,
            position_id, task_grade_id, employee_type_id, condition_of_service_id,
            joining_date, status, created_by, updated_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_DATE,'ACTIVE',$11,$11) RETURNING *`,
          [
            empCode,
            applicant.first_name,
            applicant.surname,
            applicant.id_number,
            applicant.email,
            applicant.phone,
            vac?.pos_id || null,
            vac?.pos_task_grade_id || null,
            vac?.pos_employee_type_id || null,
            vac?.pos_condition_of_service_id || null,
            req.user?.id || 1
          ]
        );
        employeeRecord = newEmp.rows[0];
      }

      const empId = employeeRecord.id;
      const defaultItems = [
        { item_name: 'Complete personal information form', category: 'DOCUMENTATION' },
        { item_name: 'Submit certified ID copy', category: 'DOCUMENTATION' },
        { item_name: 'Submit qualifications', category: 'DOCUMENTATION' },
        { item_name: 'Tax registration (IRP5)', category: 'DOCUMENTATION' },
        { item_name: 'Bank account details', category: 'DOCUMENTATION' },
        { item_name: 'IT access setup', category: 'IT' },
        { item_name: 'Office allocation', category: 'FACILITIES' },
        { item_name: 'Orientation session', category: 'INDUCTION' },
        { item_name: 'Policy acknowledgment', category: 'COMPLIANCE' },
        { item_name: 'Probation review schedule', category: 'HR' }
      ];
      const checklist = await dbQuery(
        `INSERT INTO onboarding_checklists (employee_id, template_name, assigned_to) VALUES ($1, $2, $3) RETURNING *`,
        [empId, 'Standard Onboarding', req.user?.id || 1]
      );
      onboardingChecklist = checklist.rows[0];
      for (let i = 0; i < defaultItems.length; i++) {
        await dbQuery(
          `INSERT INTO onboarding_items (checklist_id, item_name, category, sort_order) VALUES ($1, $2, $3, $4)`,
          [onboardingChecklist.id, defaultItems[i].item_name, defaultItems[i].category, i + 1]
        );
      }

      if (vac) {
        await dbQuery(
          `UPDATE recruitment_vacancies SET status = 'FILLED', updated_at = NOW() WHERE id = $1`,
          [applicant.vacancy_id]
        );
      }

      await createNotification({
        title: 'Applicant Appointed',
        message: `${applicant.first_name} ${applicant.surname} has been appointed${vac?.position_title ? ` to position "${vac.position_title}"` : ''}. Employee record and onboarding checklist created.`,
        type: 'SUCCESS',
        category: 'RECRUITMENT'
      });
    }

    res.json({
      success: true,
      data: applicant,
      employee: employeeRecord,
      onboarding_checklist: onboardingChecklist
    });
  } catch (err) { next(err); }
});

router.get('/interview-slots', authenticate, async (req, res, next) => {
  try {
    const { vacancy_id, applicant_id, status } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (vacancy_id) { where += ` AND is2.vacancy_id = $${pi}`; params.push(parseInt(vacancy_id)); pi++; }
    if (applicant_id) { where += ` AND is2.applicant_id = $${pi}`; params.push(parseInt(applicant_id)); pi++; }
    if (status) { where += ` AND is2.status = $${pi}`; params.push(status); pi++; }
    const result = await dbQuery(
      `SELECT is2.*, ra.first_name AS applicant_first_name, ra.surname AS applicant_surname,
              rv.title AS vacancy_title, rv.requisition_number
       FROM interview_slots is2
       JOIN recruitment_applicants ra ON is2.applicant_id = ra.id
       JOIN recruitment_vacancies rv ON is2.vacancy_id = rv.id
       ${where} ORDER BY is2.interview_date, is2.interview_time`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/interview-slots', authenticate, auditLog('CREATE', 'interview_slot'), async (req, res, next) => {
  try {
    const { vacancy_id, applicant_id, interview_date, interview_time, interview_type, venue, panel_members, conducted_by } = req.body;
    const result = await dbQuery(
      `INSERT INTO interview_slots (vacancy_id, applicant_id, interview_date, interview_time, interview_type, venue, panel_members, conducted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vacancy_id, applicant_id, interview_date, interview_time, interview_type || 'PANEL', venue, panel_members, conducted_by]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/interview-slots/:id', authenticate, auditLog('UPDATE', 'interview_slot'), async (req, res, next) => {
  try {
    const { status, score, feedback, interview_date, interview_time, venue } = req.body;
    const result = await dbQuery(
      `UPDATE interview_slots SET status=$1, score=$2, feedback=$3, interview_date=COALESCE($4, interview_date), interview_time=COALESCE($5, interview_time), venue=COALESCE($6, venue) WHERE id=$7 RETURNING *`,
      [status, score, feedback, interview_date, interview_time, venue, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Interview slot not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/onboarding', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND oc.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    if (status) { where += ` AND oc.status = $${pi}`; params.push(status); pi++; }
    const result = await dbQuery(
      `SELECT oc.*, e.first_name, e.surname, e.employee_code,
              (SELECT COUNT(*) FROM onboarding_items oi WHERE oi.checklist_id = oc.id) AS total_items,
              (SELECT COUNT(*) FROM onboarding_items oi WHERE oi.checklist_id = oc.id AND oi.is_completed = TRUE) AS completed_items
       FROM onboarding_checklists oc
       JOIN employees e ON oc.employee_id = e.id
       ${where} ORDER BY oc.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/onboarding', authenticate, auditLog('CREATE', 'onboarding_checklist'), async (req, res, next) => {
  try {
    const { employee_id, template_name, assigned_to, items } = req.body;
    const checklist = await dbQuery(
      `INSERT INTO onboarding_checklists (employee_id, template_name, assigned_to) VALUES ($1,$2,$3) RETURNING *`,
      [employee_id, template_name || 'Standard Onboarding', assigned_to]
    );
    const checklistId = checklist.rows[0].id;
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        await dbQuery(
          `INSERT INTO onboarding_items (checklist_id, item_name, category, due_date, sort_order) VALUES ($1,$2,$3,$4,$5)`,
          [checklistId, items[i].item_name, items[i].category, items[i].due_date, i + 1]
        );
      }
    }
    const allItems = await dbQuery('SELECT * FROM onboarding_items WHERE checklist_id = $1 ORDER BY sort_order', [checklistId]);
    res.status(201).json({ success: true, data: { ...checklist.rows[0], items: allItems.rows } });
  } catch (err) { next(err); }
});

router.get('/onboarding/:id', authenticate, async (req, res, next) => {
  try {
    const checklist = await dbQuery(
      `SELECT oc.*, e.first_name, e.surname FROM onboarding_checklists oc JOIN employees e ON oc.employee_id = e.id WHERE oc.id = $1`, [req.params.id]
    );
    if (!checklist.rows.length) return res.status(404).json({ success: false, error: { message: 'Checklist not found' } });
    const items = await dbQuery('SELECT * FROM onboarding_items WHERE checklist_id = $1 ORDER BY sort_order', [req.params.id]);
    res.json({ success: true, data: { ...checklist.rows[0], items: items.rows } });
  } catch (err) { next(err); }
});

router.put('/onboarding/:checklistId/items/:itemId', authenticate, auditLog('UPDATE', 'onboarding_item'), async (req, res, next) => {
  try {
    const { is_completed, notes } = req.body;
    const completedAt = is_completed ? 'NOW()' : 'NULL';
    const completedBy = is_completed ? (req.user?.id || 1) : null;
    const result = await dbQuery(
      `UPDATE onboarding_items SET is_completed=$1, notes=$2, completed_by=$3, completed_at=${completedAt} WHERE id=$4 AND checklist_id=$5 RETURNING *`,
      [is_completed, notes, completedBy, req.params.itemId, req.params.checklistId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Item not found' } });
    const remaining = await dbQuery(
      `SELECT COUNT(*) FROM onboarding_items WHERE checklist_id = $1 AND is_completed = FALSE`, [req.params.checklistId]
    );
    if (parseInt(remaining.rows[0].count) === 0) {
      await dbQuery(`UPDATE onboarding_checklists SET status='COMPLETED', completion_date=CURRENT_DATE WHERE id=$1`, [req.params.checklistId]);
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/applicants/:id/scores', authenticate, auditLog('CREATE', 'applicant_score'), async (req, res, next) => {
  try {
    const applicantId = parseInt(req.params.id, 10);
    const { scores } = req.body;
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Scores array is required' } });
    }

    const applicant = await dbQuery('SELECT id FROM recruitment_applicants WHERE id = $1', [applicantId]);
    if (!applicant.rows.length) return res.status(404).json({ success: false, error: { message: 'Applicant not found' } });

    const results = [];
    for (const s of scores) {
      const result = await dbQuery(
        `INSERT INTO applicant_scores (applicant_id, criterion, score, max_score, scored_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [applicantId, s.criterion, s.score, s.max_score || 10, req.user?.id || 1]
      );
      results.push(result.rows[0]);
    }

    const totals = await dbQuery(
      `SELECT SUM(score) AS total_score, SUM(max_score) AS total_max_score,
              ROUND(AVG(score::numeric / NULLIF(max_score, 0) * 100), 2) AS average_percentage
       FROM applicant_scores WHERE applicant_id = $1`,
      [applicantId]
    );

    res.status(201).json({
      success: true,
      data: {
        scores: results,
        summary: totals.rows[0]
      }
    });
  } catch (err) { next(err); }
});

router.get('/applicants/:id/scores', authenticate, async (req, res, next) => {
  try {
    const applicantId = parseInt(req.params.id, 10);
    const scores = await dbQuery(
      `SELECT aps.*, u.first_name AS scorer_first_name, u.surname AS scorer_surname
       FROM applicant_scores aps
       LEFT JOIN employees u ON aps.scored_by = u.id
       WHERE aps.applicant_id = $1
       ORDER BY aps.created_at`,
      [applicantId]
    );

    const totals = await dbQuery(
      `SELECT SUM(score) AS total_score, SUM(max_score) AS total_max_score,
              ROUND(AVG(score::numeric / NULLIF(max_score, 0) * 100), 2) AS average_percentage
       FROM applicant_scores WHERE applicant_id = $1`,
      [applicantId]
    );

    res.json({
      success: true,
      data: {
        scores: scores.rows,
        summary: totals.rows[0]
      }
    });
  } catch (err) { next(err); }
});

router.get('/pipeline', authenticate, async (req, res, next) => {
  try {
    const pipeline = await dbQuery(
      `SELECT rv.status, COUNT(*) AS vacancy_count,
              SUM((SELECT COUNT(*) FROM recruitment_applicants ra WHERE ra.vacancy_id = rv.id)) AS total_applicants
       FROM recruitment_vacancies rv
       GROUP BY rv.status
       ORDER BY rv.status`
    );

    const applicantPipeline = await dbQuery(
      `SELECT ra.status, COUNT(*) AS count
       FROM recruitment_applicants ra
       GROUP BY ra.status
       ORDER BY ra.status`
    );

    const departmentBreakdown = await dbQuery(
      `SELECT rv.department_id, rv.status, COUNT(*) AS count
       FROM recruitment_vacancies rv
       WHERE rv.department_id IS NOT NULL
       GROUP BY rv.department_id, rv.status
       ORDER BY rv.department_id, rv.status`
    );
    const { getDepartments } = require('./department.routes');
    const deptsBd = await getDepartments();
    const deptMapBd = new Map(deptsBd.map(d => [d.id, d.name]));
    for (const row of departmentBreakdown.rows) { row.department_name = deptMapBd.get(Number(row.department_id)) || null; }

    res.json({
      success: true,
      data: {
        vacancy_pipeline: pipeline.rows,
        applicant_pipeline: applicantPipeline.rows,
        department_breakdown: departmentBreakdown.rows
      }
    });
  } catch (err) { next(err); }
});

router.get('/applicants/:id/offer-letter', authenticate, async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const applicantId = parseInt(req.params.id, 10);

    const result = await dbQuery(
      `SELECT ra.*, rv.title AS vacancy_title, rv.salary_range_min, rv.salary_range_max,
              rv.requirements, rv.duties,
              p.title AS position_title, p.position_code
       FROM recruitment_applicants ra
       JOIN recruitment_vacancies rv ON ra.vacancy_id = rv.id
       LEFT JOIN positions p ON rv.position_id = p.id
       WHERE ra.id = $1`,
      [applicantId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Applicant not found' } });
    const a = result.rows[0];

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="offer_letter_${a.first_name}_${a.surname}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Date: ${new Date().toLocaleDateString('en-ZA')}`);
    doc.moveDown();
    doc.text(`Dear ${a.first_name} ${a.surname},`);
    doc.moveDown();
    doc.text(`We are pleased to offer you the position of ${a.position_title || a.vacancy_title} in the ${a.department_name || 'relevant'} department.`);
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Position Details:');
    doc.font('Helvetica');
    doc.text(`Position: ${a.position_title || a.vacancy_title}`);
    if (a.position_code) doc.text(`Position Code: ${a.position_code}`);
    doc.text(`Department: ${a.department_name || 'N/A'}`);
    if (a.salary_range_min || a.salary_range_max) {
      const min = a.salary_range_min ? `R${parseFloat(a.salary_range_min).toLocaleString('en-ZA')}` : '';
      const max = a.salary_range_max ? `R${parseFloat(a.salary_range_max).toLocaleString('en-ZA')}` : '';
      doc.text(`Salary Range: ${min} - ${max} per annum`);
    }
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Terms and Conditions:');
    doc.font('Helvetica');
    doc.list([
      'This appointment is subject to a 3-month probationary period',
      'Normal working hours are 08:00 to 16:30, Monday to Friday',
      'Leave entitlement is in accordance with the Basic Conditions of Employment Act',
      'Membership of the relevant pension/provident fund is compulsory',
      'This offer is subject to verification of qualifications and references'
    ]);
    doc.moveDown();
    doc.text('Please confirm acceptance of this offer by signing below and returning within 5 working days.');
    doc.moveDown(3);
    doc.text('____________________________          ____________________________');
    doc.text('Authorised Signature                        Date');
    doc.moveDown(3);
    doc.font('Helvetica-Bold').text('ACCEPTANCE');
    doc.font('Helvetica');
    doc.text('I hereby accept the offer of employment as detailed above.');
    doc.moveDown(2);
    doc.text('____________________________          ____________________________');
    doc.text('Candidate Signature                         Date');

    doc.end();
  } catch (err) { next(err); }
});

module.exports = router;
