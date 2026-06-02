const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const tutorController = require('../controllers/tutorController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post(
  '/ask',
  authenticate,
  [body('question').trim().isLength({ min: 3, max: 2000 })],
  validate,
  tutorController.askQuestion
);

router.post(
  '/generate-test',
  authenticate,
  authorize('admin', 'teacher'),
  [
    body('gradeId').optional().isInt(),
    body('subjectId').optional().isInt(),
    body('numQuestions').optional().isInt({ min: 1, max: 50 }),
    body('totalMarks').optional().isInt({ min: 5, max: 300 }),
    body('difficulty').optional().isIn(['easy', 'moderate', 'hard']),
  ],
  validate,
  tutorController.generateTest
);

router.post(
  '/generate-worksheet',
  authenticate,
  [
    body('gradeId').optional().isInt(),
    body('subjectId').optional().isInt(),
    body('worksheetType').optional().isIn(['practice', 'homework', 'revision', 'enrichment']),
    body('difficulty').optional().isIn(['easy', 'moderate', 'hard']),
  ],
  validate,
  tutorController.generateWorksheet
);

router.post(
  '/generate-lesson-plan',
  authenticate,
  authorize('admin', 'teacher'),
  [
    body('gradeId').optional().isInt(),
    body('subjectId').optional().isInt(),
    body('durationMinutes').optional().isInt({ min: 30, max: 180 }),
  ],
  validate,
  tutorController.generateLessonPlan
);

router.get('/history', authenticate, tutorController.getQAHistory);
router.get('/history/:userId', authenticate, tutorController.getQAHistory);

router.post(
  '/submit-test',
  authenticate,
  [body('testId').isUUID(), body('answers').isArray()],
  validate,
  tutorController.submitTestAttempt
);

router.get('/progress', authenticate, tutorController.getStudentProgress);
router.get('/progress/:userId', authenticate, tutorController.getStudentProgress);

module.exports = router;
