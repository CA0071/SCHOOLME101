const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const curriculumController = require('../controllers/curriculumController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Public routes (authenticated)
router.get('/grades', authenticate, curriculumController.getGrades);
router.get('/subjects', authenticate, curriculumController.getSubjects);
router.get('/topics', authenticate, curriculumController.getTopics);
router.get('/topics/:topicId/subtopics', authenticate, curriculumController.getSubtopics);
router.get('/topics/:topicId/outcomes', authenticate, curriculumController.getLearningOutcomes);

// Admin routes
router.post(
  '/topics',
  authenticate,
  authorize('admin', 'teacher'),
  [
    body('name').trim().isLength({ min: 2 }),
    body('subjectId').isInt(),
    body('gradeId').isInt(),
    body('term').isInt({ min: 1, max: 4 }),
  ],
  validate,
  curriculumController.createTopic
);

router.get('/users', authenticate, authorize('admin'), curriculumController.listUsers);
router.get('/stats', authenticate, authorize('admin'), curriculumController.getDashboardStats);

module.exports = router;
