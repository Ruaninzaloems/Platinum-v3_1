const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

router.post('/upload', authenticate, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const { employee_id, document_type, notes, expiry_date } = req.body;

    const result = await dbQuery(
      `INSERT INTO employee_documents (employee_id, document_name, document_type, file_path, file_size, mime_type, uploaded_by, notes, expiry_date, version_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1) RETURNING *`,
      [employee_id, req.file.originalname, document_type || 'OTHER', req.file.filename, req.file.size, req.file.mimetype, req.user?.id || 1, notes, expiry_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/upload-version/:parentId', authenticate, upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const parentDoc = await dbQuery('SELECT * FROM employee_documents WHERE id = $1', [req.params.parentId]);
    if (!parentDoc.rows.length) {
      return res.status(404).json({ success: false, error: { message: 'Parent document not found' } });
    }
    const parent = parentDoc.rows[0];
    const maxVersion = await dbQuery(
      `SELECT COALESCE(MAX(version_number), 0) AS max_ver FROM employee_documents WHERE (id = $1 OR parent_document_id = $1)`,
      [parent.parent_document_id || parent.id]
    );
    const newVersion = parseInt(maxVersion.rows[0].max_ver, 10) + 1;
    const rootId = parent.parent_document_id || parent.id;
    const { notes, expiry_date } = req.body;

    const result = await dbQuery(
      `INSERT INTO employee_documents (employee_id, document_name, document_type, file_path, file_size, mime_type, uploaded_by, notes, expiry_date, version_number, parent_document_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [parent.employee_id, req.file.originalname, parent.document_type, req.file.filename, req.file.size, req.file.mimetype, req.user?.id || 1, notes, expiry_date, newVersion, rootId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/versions/:parentId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM employee_documents WHERE (id = $1 OR parent_document_id = $1) ORDER BY version_number DESC`,
      [req.params.parentId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/employee/:employeeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/download/:id', authenticate, async (req, res, next) => {
  try {
    const doc = await dbQuery('SELECT * FROM employee_documents WHERE id = $1', [req.params.id]);
    if (!doc.rows.length) return res.status(404).json({ success: false, error: { message: 'Document not found' } });
    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', doc.rows[0].file_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: { message: 'File not found on disk' } });
    res.download(filePath, doc.rows[0].document_name);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const doc = await dbQuery('SELECT * FROM employee_documents WHERE id = $1', [req.params.id]);
    if (!doc.rows.length) return res.status(404).json({ success: false, error: { message: 'Document not found' } });
    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', doc.rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await dbQuery('DELETE FROM employee_documents WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
