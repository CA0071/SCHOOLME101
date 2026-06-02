const { query } = require('../config/database');
const logger = require('../utils/logger');

const getGrades = async (req, res) => {
  try {
    const result = await query('SELECT * FROM grades ORDER BY level');
    res.json({ grades: result.rows });
  } catch (error) {
    logger.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to get grades' });
  }
};

const getSubjects = async (req, res) => {
  try {
    const { gradeId } = req.query;
    let result;

    if (gradeId) {
      result = await query(
        `SELECT s.* FROM subjects s
         JOIN grade_subjects gs ON s.id = gs.subject_id
         WHERE gs.grade_id = $1
         ORDER BY s.name`,
        [gradeId]
      );
    } else {
      result = await query('SELECT * FROM subjects ORDER BY name');
    }

    res.json({ subjects: result.rows });
  } catch (error) {
    logger.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to get subjects' });
  }
};

const getTopics = async (req, res) => {
  try {
    const { gradeId, subjectId, term } = req.query;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (gradeId) { conditions.push(`t.grade_id = $${paramIdx++}`); params.push(gradeId); }
    if (subjectId) { conditions.push(`t.subject_id = $${paramIdx++}`); params.push(subjectId); }
    if (term) { conditions.push(`t.term = $${paramIdx++}`); params.push(term); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT t.*, g.name AS grade_name, s.name AS subject_name
       FROM topics t
       LEFT JOIN grades g ON t.grade_id = g.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       ${whereClause}
       ORDER BY t.term, t.week_start, t.name`,
      params
    );

    res.json({ topics: result.rows });
  } catch (error) {
    logger.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
};

const createTopic = async (req, res) => {
  try {
    const { subjectId, gradeId, term, name, description, weekStart, weekEnd } = req.body;

    const result = await query(
      `INSERT INTO topics (subject_id, grade_id, term, name, description, week_start, week_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [subjectId, gradeId, term, name, description, weekStart, weekEnd]
    );

    res.status(201).json({ topic: result.rows[0] });
  } catch (error) {
    logger.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

const getSubtopics = async (req, res) => {
  try {
    const { topicId } = req.params;
    const result = await query(
      `SELECT st.*, t.name AS topic_name FROM subtopics st
       LEFT JOIN topics t ON st.topic_id = t.id
       WHERE st.topic_id = $1
       ORDER BY st.order_index, st.name`,
      [topicId]
    );
    res.json({ subtopics: result.rows });
  } catch (error) {
    logger.error('Get subtopics error:', error);
    res.status(500).json({ error: 'Failed to get subtopics' });
  }
};

const getLearningOutcomes = async (req, res) => {
  try {
    const { topicId } = req.params;
    const result = await query(
      `SELECT lo.*, t.name AS topic_name
       FROM learning_outcomes lo
       LEFT JOIN topics t ON lo.topic_id = t.id
       WHERE lo.topic_id = $1
       ORDER BY lo.id`,
      [topicId]
    );
    res.json({ outcomes: result.rows });
  } catch (error) {
    logger.error('Get learning outcomes error:', error);
    res.status(500).json({ error: 'Failed to get learning outcomes' });
  }
};

const listUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';

    if (role) {
      params.push(role);
      whereClause = 'WHERE u.role = $1';
    }

    params.push(parseInt(limit), offset);
    const paramOffset = role ? 3 : 1;

    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.school_name,
              u.is_active, u.last_login, u.created_at,
              g.name AS grade_name
       FROM users u
       LEFT JOIN grades g ON u.grade_id = g.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramOffset} OFFSET $${paramOffset + 1}`,
      params
    );

    res.json({ users: result.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [usersRes, docsRes, chunksRes, qaRes] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM curriculum_documents GROUP BY status`),
      query(`SELECT COUNT(*) as total_chunks FROM document_chunks`),
      query(`SELECT COUNT(*) as total_questions FROM qa_sessions`),
    ]);

    const userStats = usersRes.rows.reduce((acc, r) => {
      acc[r.role] = parseInt(r.count);
      return acc;
    }, {});

    const docStats = docsRes.rows.reduce((acc, r) => {
      acc[r.status] = parseInt(r.count);
      return acc;
    }, {});

    res.json({
      users: userStats,
      documents: docStats,
      totalChunks: parseInt(chunksRes.rows[0]?.total_chunks || 0),
      totalQuestions: parseInt(qaRes.rows[0]?.total_questions || 0),
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
};

module.exports = {
  getGrades,
  getSubjects,
  getTopics,
  createTopic,
  getSubtopics,
  getLearningOutcomes,
  listUsers,
  getDashboardStats,
};
