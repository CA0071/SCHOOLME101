const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  return { accessToken };
};

const register = async (req, res) => {
  try {
    const { email, password, fullName, role = 'student', gradeId, schoolName } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, grade_id, school_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, grade_id, school_name, created_at`,
      [email, passwordHash, fullName, role, gradeId || null, schoolName || null]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user);

    logger.info(`New user registered: ${email} (${role})`);
    res.status(201).json({ user, ...tokens });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, email, password_hash, full_name, role, grade_id, school_name, is_active
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const tokens = generateTokens(user);
    const { password_hash, ...safeUser } = user;

    logger.info(`User logged in: ${email}`);
    res.json({ user: safeUser, ...tokens });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.grade_id, u.school_name,
              u.is_active, u.last_login, u.created_at, g.name AS grade_name
       FROM users u
       LEFT JOIN grades g ON u.grade_id = g.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, gradeId, schoolName } = req.body;

    const result = await query(
      `UPDATE users SET full_name = COALESCE($1, full_name),
                        grade_id = COALESCE($2, grade_id),
                        school_name = COALESCE($3, school_name),
                        updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, full_name, role, grade_id, school_name`,
      [fullName, gradeId, schoolName, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newHash,
      req.user.id,
    ]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
