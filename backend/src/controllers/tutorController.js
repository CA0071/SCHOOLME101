const tutorService = require('../services/tutorService');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const askQuestion = async (req, res) => {
  try {
    const { question, gradeId, subjectId, topicId } = req.body;

    // Get grade and subject names for context
    let gradeName = '', subjectName = '';
    if (gradeId) {
      const gr = await query('SELECT name FROM grades WHERE id = $1', [gradeId]);
      gradeName = gr.rows[0]?.name || '';
    }
    if (subjectId) {
      const sub = await query('SELECT name FROM subjects WHERE id = $1', [subjectId]);
      subjectName = sub.rows[0]?.name || '';
    }

    const result = await tutorService.answerQuestion(question, {
      userId: req.user.id,
      gradeId,
      subjectId,
      topicId,
      gradeName,
      subjectName,
    });

    res.json(result);
  } catch (error) {
    logger.error('Ask question error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};

const generateTest = async (req, res) => {
  try {
    const {
      gradeId,
      subjectId,
      topicId,
      numQuestions = 10,
      totalMarks = 50,
      difficulty = 'moderate',
      questionTypes,
    } = req.body;

    let gradeName = '', subjectName = '', topicName = '';
    const [gradeRes, subjectRes, topicRes] = await Promise.all([
      gradeId ? query('SELECT name FROM grades WHERE id = $1', [gradeId]) : { rows: [] },
      subjectId ? query('SELECT name FROM subjects WHERE id = $1', [subjectId]) : { rows: [] },
      topicId ? query('SELECT name FROM topics WHERE id = $1', [topicId]) : { rows: [] },
    ]);

    gradeName = gradeRes.rows[0]?.name || '';
    subjectName = subjectRes.rows[0]?.name || '';
    topicName = topicRes.rows[0]?.name || '';

    const result = await tutorService.generateTest({
      gradeId,
      subjectId,
      topicId,
      gradeName,
      subjectName,
      topicName,
      numQuestions,
      totalMarks,
      difficulty,
      questionTypes,
      userId: req.user.id,
    });

    res.json(result);
  } catch (error) {
    logger.error('Generate test error:', error);
    res.status(500).json({ error: 'Failed to generate test' });
  }
};

const generateWorksheet = async (req, res) => {
  try {
    const { gradeId, subjectId, topicId, worksheetType = 'practice', difficulty = 'moderate' } =
      req.body;

    const [gradeRes, subjectRes, topicRes] = await Promise.all([
      gradeId ? query('SELECT name FROM grades WHERE id = $1', [gradeId]) : { rows: [] },
      subjectId ? query('SELECT name FROM subjects WHERE id = $1', [subjectId]) : { rows: [] },
      topicId ? query('SELECT name FROM topics WHERE id = $1', [topicId]) : { rows: [] },
    ]);

    const result = await tutorService.generateWorksheet({
      gradeId,
      subjectId,
      topicId,
      gradeName: gradeRes.rows[0]?.name || '',
      subjectName: subjectRes.rows[0]?.name || '',
      topicName: topicRes.rows[0]?.name || '',
      worksheetType,
      difficulty,
      userId: req.user.id,
    });

    res.json(result);
  } catch (error) {
    logger.error('Generate worksheet error:', error);
    res.status(500).json({ error: 'Failed to generate worksheet' });
  }
};

const generateLessonPlan = async (req, res) => {
  try {
    const { gradeId, subjectId, topicId, durationMinutes = 60 } = req.body;

    const [gradeRes, subjectRes, topicRes] = await Promise.all([
      gradeId ? query('SELECT name FROM grades WHERE id = $1', [gradeId]) : { rows: [] },
      subjectId ? query('SELECT name FROM subjects WHERE id = $1', [subjectId]) : { rows: [] },
      topicId ? query('SELECT name FROM topics WHERE id = $1', [topicId]) : { rows: [] },
    ]);

    const result = await tutorService.generateLessonPlan({
      gradeId,
      subjectId,
      topicId,
      gradeName: gradeRes.rows[0]?.name || '',
      subjectName: subjectRes.rows[0]?.name || '',
      topicName: topicRes.rows[0]?.name || '',
      durationMinutes,
      userId: req.user.id,
    });

    res.json(result);
  } catch (error) {
    logger.error('Generate lesson plan error:', error);
    res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
};

const getQAHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const userId = req.params.userId || req.user.id;

    // Only allow users to view their own history, or admins/teachers to view others
    if (userId !== req.user.id && !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT qa.id, qa.question, qa.answer, qa.sources,
              qa.feedback_rating, qa.created_at,
              g.name AS grade_name, s.name AS subject_name
       FROM qa_sessions qa
       LEFT JOIN grades g ON qa.grade_id = g.id
       LEFT JOIN subjects s ON qa.subject_id = s.id
       WHERE qa.user_id = $1
       ORDER BY qa.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    res.json({ sessions: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    logger.error('Get Q&A history error:', error);
    res.status(500).json({ error: 'Failed to get Q&A history' });
  }
};

const submitTestAttempt = async (req, res) => {
  try {
    const { testId, answers, timeTakenMinutes } = req.body;

    const testResult = await query(
      'SELECT questions, total_marks FROM generated_tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    const questions = test.questions;
    let score = 0;

    // Auto-grade multiple choice and true/false questions
    const gradedAnswers = (answers || []).map((answer) => {
      const question = questions.find((q) => q.number === answer.questionNumber);
      if (!question) return answer;

      let isCorrect = null;
      if (['multiple_choice', 'true_false'].includes(question.type)) {
        isCorrect =
          answer.selectedAnswer?.toLowerCase() === question.answer?.toLowerCase();
        if (isCorrect) score += question.marks || 1;
      }
      return { ...answer, isCorrect, marks: isCorrect ? question.marks || 1 : 0 };
    });

    const percentage = test.total_marks > 0 ? (score / test.total_marks) * 100 : 0;

    const attemptResult = await query(
      `INSERT INTO test_attempts
        (test_id, student_id, answers, score, total_marks, percentage, time_taken_minutes, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, score, total_marks, percentage, completed_at`,
      [
        testId,
        req.user.id,
        JSON.stringify(gradedAnswers),
        score,
        test.total_marks,
        percentage,
        timeTakenMinutes || null,
      ]
    );

    res.json({
      attempt: attemptResult.rows[0],
      gradedAnswers,
    });
  } catch (error) {
    logger.error('Submit test attempt error:', error);
    res.status(500).json({ error: 'Failed to submit test attempt' });
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    if (userId !== req.user.id && !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progressResult = await query(
      `SELECT sp.*, s.name AS subject_name, t.name AS topic_name,
              g.name AS grade_name
       FROM student_progress sp
       LEFT JOIN subjects s ON sp.subject_id = s.id
       LEFT JOIN topics t ON sp.topic_id = t.id
       LEFT JOIN grades g ON t.grade_id = g.id
       WHERE sp.student_id = $1
       ORDER BY sp.last_activity DESC NULLS LAST`,
      [userId]
    );

    const testAttemptsResult = await query(
      `SELECT ta.id, ta.score, ta.total_marks, ta.percentage,
              ta.completed_at, gt.title AS test_title,
              g.name AS grade_name, s.name AS subject_name
       FROM test_attempts ta
       LEFT JOIN generated_tests gt ON ta.test_id = gt.id
       LEFT JOIN grades g ON gt.grade_id = g.id
       LEFT JOIN subjects s ON gt.subject_id = s.id
       WHERE ta.student_id = $1
       ORDER BY ta.completed_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      progress: progressResult.rows,
      recentTests: testAttemptsResult.rows,
    });
  } catch (error) {
    logger.error('Get student progress error:', error);
    res.status(500).json({ error: 'Failed to get student progress' });
  }
};

module.exports = {
  askQuestion,
  generateTest,
  generateWorksheet,
  generateLessonPlan,
  getQAHistory,
  submitTestAttempt,
  getStudentProgress,
};
