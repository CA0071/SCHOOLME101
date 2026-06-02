const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const documentController = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 150) * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadLimiter,
  upload.single('file'),
  documentController.uploadDocument
);

router.get('/', authenticate, documentController.listDocuments);
router.get('/:id', authenticate, documentController.getDocument);

router.delete('/:id', authenticate, authorize('admin'), documentController.deleteDocument);

router.post(
  '/:id/reprocess',
  authenticate,
  authorize('admin'),
  documentController.reprocessDocument
);

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 150}MB` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
