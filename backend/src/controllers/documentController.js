const path = require('path');
const fs = require('fs').promises;
const { query } = require('../config/database');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { gradeId, subjectId, documentType = 'curriculum', title } = req.body;

    const result = await query(
      `INSERT INTO curriculum_documents
        (title, filename, file_path, file_size, mime_type, grade_id, subject_id, document_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, filename, status, created_at`,
      [
        title || req.file.originalname,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        gradeId || null,
        subjectId || null,
        documentType,
        req.user.id,
      ]
    );

    const doc = result.rows[0];
    logger.info(`Document uploaded: ${doc.id} - ${doc.title}`);

    // Process PDF in background
    pdfService.processPDF(doc.id, req.file.path).catch((err) => {
      logger.error(`Background PDF processing failed for ${doc.id}:`, err.message);
    });

    res.status(201).json({
      document: doc,
      message: 'Document uploaded and processing started',
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

const listDocuments = async (req, res) => {
  try {
    const { gradeId, subjectId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (gradeId) {
      conditions.push(`cd.grade_id = $${paramIdx++}`);
      params.push(gradeId);
    }
    if (subjectId) {
      conditions.push(`cd.subject_id = $${paramIdx++}`);
      params.push(subjectId);
    }
    if (status) {
      conditions.push(`cd.status = $${paramIdx++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(parseInt(limit), offset);
    const result = await query(
      `SELECT cd.id, cd.title, cd.filename, cd.file_size, cd.document_type,
              cd.status, cd.total_pages, cd.total_chunks, cd.summary,
              cd.created_at, cd.updated_at,
              g.name AS grade_name, s.name AS subject_name,
              u.full_name AS uploaded_by_name
       FROM curriculum_documents cd
       LEFT JOIN grades g ON cd.grade_id = g.id
       LEFT JOIN subjects s ON cd.subject_id = s.id
       LEFT JOIN users u ON cd.uploaded_by = u.id
       ${whereClause}
       ORDER BY cd.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM curriculum_documents cd ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      documents: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    logger.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
};

const getDocument = async (req, res) => {
  try {
    const result = await query(
      `SELECT cd.*, g.name AS grade_name, s.name AS subject_name
       FROM curriculum_documents cd
       LEFT JOIN grades g ON cd.grade_id = g.id
       LEFT JOIN subjects s ON cd.subject_id = s.id
       WHERE cd.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: result.rows[0] });
  } catch (error) {
    logger.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const result = await query(
      'SELECT file_path FROM curriculum_documents WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(result.rows[0].file_path);
    } catch (err) {
      logger.warn('Could not delete file:', err.message);
    }

    await query('DELETE FROM curriculum_documents WHERE id = $1', [req.params.id]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

const reprocessDocument = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, file_path, status FROM curriculum_documents WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = result.rows[0];

    // Delete existing chunks
    await query('DELETE FROM document_chunks WHERE document_id = $1', [doc.id]);

    // Reprocess
    pdfService.processPDF(doc.id, doc.file_path).catch((err) => {
      logger.error(`Reprocessing failed for ${doc.id}:`, err.message);
    });

    res.json({ message: 'Document reprocessing started' });
  } catch (error) {
    logger.error('Reprocess document error:', error);
    res.status(500).json({ error: 'Failed to reprocess document' });
  }
};

module.exports = { uploadDocument, listDocuments, getDocument, deleteDocument, reprocessDocument };
