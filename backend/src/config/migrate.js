require('dotenv').config();
const { pool } = require('./database');
const logger = require('../utils/logger');

const migrations = [
  // Enable pgvector extension
  `CREATE EXTENSION IF NOT EXISTS vector;`,
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

  // Grades table
  `CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Subjects table
  `CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Grade-Subject mapping
  `CREATE TABLE IF NOT EXISTS grade_subjects (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    is_compulsory BOOLEAN DEFAULT true,
    UNIQUE(grade_id, subject_id)
  );`,

  // Topics table
  `CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    term INTEGER CHECK (term BETWEEN 1 AND 4),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    week_start INTEGER,
    week_end INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Subtopics table
  `CREATE TABLE IF NOT EXISTS subtopics (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Learning outcomes table
  `CREATE TABLE IF NOT EXISTS learning_outcomes (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    subtopic_id INTEGER REFERENCES subtopics(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    bloom_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Assessment standards table
  `CREATE TABLE IF NOT EXISTS assessment_standards (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    code VARCHAR(50),
    description TEXT NOT NULL,
    weighting DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Curriculum documents table
  `CREATE TABLE IF NOT EXISTS curriculum_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    document_type VARCHAR(50) DEFAULT 'curriculum',
    status VARCHAR(50) DEFAULT 'pending',
    total_pages INTEGER,
    total_chunks INTEGER DEFAULT 0,
    summary TEXT,
    processing_error TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Document chunks with vector embeddings
  `CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES curriculum_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_summary TEXT,
    page_number INTEGER,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    term INTEGER,
    embedding vector(768),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Create HNSW index for fast vector search
  `CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
    ON document_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);`,

  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    school_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Student progress table
  `CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    subtopic_id INTEGER REFERENCES subtopics(id) ON DELETE SET NULL,
    mastery_level DECIMAL(5,2) DEFAULT 0,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
  );`,

  // Q&A sessions table
  `CREATE TABLE IF NOT EXISTS qa_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT,
    sources JSONB DEFAULT '[]',
    model_used VARCHAR(100),
    tokens_used INTEGER,
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Generated tests table
  `CREATE TABLE IF NOT EXISTS generated_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    instructions TEXT,
    total_marks INTEGER,
    duration_minutes INTEGER,
    questions JSONB NOT NULL DEFAULT '[]',
    answer_memo JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Generated worksheets table
  `CREATE TABLE IF NOT EXISTS generated_worksheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    worksheet_type VARCHAR(50) DEFAULT 'practice',
    difficulty VARCHAR(50) DEFAULT 'moderate',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Lesson plans table
  `CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    grade_id INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    objectives TEXT,
    introduction TEXT,
    main_activities TEXT,
    conclusion TEXT,
    assessment TEXT,
    resources TEXT,
    differentiation TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Student test attempts
  `CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES generated_tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '[]',
    score DECIMAL(5,2),
    total_marks INTEGER,
    percentage DECIMAL(5,2),
    time_taken_minutes INTEGER,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Refresh tokens table
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info('Running database migrations...');
    for (const migration of migrations) {
      await client.query(migration);
    }
    logger.info('All migrations completed successfully.');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrate };
