# SCHOOLMATE101 — AI-Powered Educational Tutoring Platform

An AI-powered tutoring platform for South African learners from **Grade R to Grade 12** using the **CAPS Curriculum**. Features include curriculum PDF ingestion, vector-search RAG, an AI tutor (Ollama / LLaMA 3.2), and three role-based portals for students, teachers, and admins.

---

## Quick Start

### Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20 |
| PostgreSQL | 15 |
| pgvector extension | 0.7 |
| Ollama | latest |

### 1 — Clone & Install

```bash
git clone https://github.com/CA0071/SCHOOLME101.git
cd SCHOOLME101

# Backend
cd backend
npm install
cp .env.example .env   # edit with your database credentials

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 2 — Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE schoolmate101;"

# Run migrations (creates all tables + pgvector)
cd backend
npm run db:migrate

# Seed grades, subjects, and default admin user
npm run db:seed
```

Default admin credentials (change after first login):
- Email: `admin@schoolmate101.co.za`
- Password: `Admin@123456`

### 3 — Start Ollama

```bash
# Install Ollama (https://ollama.ai)
ollama serve

# Pull required models
ollama pull llama3.2          # AI tutor chat
ollama pull nomic-embed-text  # text embeddings
```

### 4 — Start the Application

```bash
# Terminal 1 — Backend API
cd backend
npm run dev   # listens on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev   # listens on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Architecture Overview

```
SCHOOLMATE101/
├── backend/                  # Node.js / Express API
│   ├── src/
│   │   ├── config/           # database.js, migrate.js, seed.js
│   │   ├── controllers/      # authController, documentController,
│   │   │                     # tutorController, curriculumController
│   │   ├── middleware/        # auth (JWT), rateLimiter, validate
│   │   ├── routes/           # auth, documents, tutor, curriculum
│   │   ├── services/
│   │   │   ├── pdfService.js       # PDF extraction + chunking
│   │   │   ├── embeddingService.js # Ollama embeddings + chat
│   │   │   ├── ragService.js       # vector search + context build
│   │   │   └── tutorService.js     # Q&A, test/worksheet/lesson gen
│   │   └── server.js
│   └── tests/
└── frontend/                 # Next.js 16 / Tailwind CSS
    └── app/
        ├── /                 # Landing page
        ├── auth/             # Login / Register
        ├── admin/            # Admin portal (docs, curriculum, users)
        ├── student/          # Student portal (ask, study, tests, progress)
        └── teacher/          # Teacher portal (lesson plans, assessments)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | API server port |
| `DATABASE_URL` | — | Full Postgres connection string |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `schoolmate101` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `JWT_SECRET` | — | **Required** — set a long random string |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Chat model name |
| `OPENAI_API_KEY` | — | Optional OpenAI fallback |
| `UPLOAD_DIR` | `./uploads` | PDF upload directory |
| `MAX_FILE_SIZE_MB` | `150` | Maximum upload size |
| `CHUNK_SIZE` | `1000` | Characters per knowledge chunk |
| `CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `EMBEDDING_DIMENSIONS` | `768` | Vector dimensions (nomic-embed-text) |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Backend API URL |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login and get JWT |
| GET | `/api/auth/profile` | ✓ | Get current user profile |
| PUT | `/api/auth/profile` | ✓ | Update profile |
| PUT | `/api/auth/change-password` | ✓ | Change password |

### AI Tutor

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/tutor/ask` | ✓ | all | Ask a curriculum question (RAG) |
| POST | `/api/tutor/generate-test` | ✓ | admin, teacher | Generate a test/quiz |
| POST | `/api/tutor/generate-worksheet` | ✓ | all | Generate a worksheet |
| POST | `/api/tutor/generate-lesson-plan` | ✓ | admin, teacher | Generate a lesson plan |
| POST | `/api/tutor/submit-test` | ✓ | all | Submit test answers |
| GET | `/api/tutor/history` | ✓ | all | Q&A session history |
| GET | `/api/tutor/progress` | ✓ | all | Student learning progress |

### Documents

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/documents` | ✓ | admin | Upload PDF (multipart/form-data) |
| GET | `/api/documents` | ✓ | all | List documents |
| GET | `/api/documents/:id` | ✓ | all | Get document details |
| DELETE | `/api/documents/:id` | ✓ | admin | Delete document + chunks |
| POST | `/api/documents/:id/reprocess` | ✓ | admin | Re-run PDF pipeline |

### Curriculum

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/curriculum/grades` | ✓ | all | List grades (R–12) |
| GET | `/api/curriculum/subjects` | ✓ | all | List subjects |
| GET | `/api/curriculum/topics` | ✓ | all | List topics (filterable) |
| POST | `/api/curriculum/topics` | ✓ | admin, teacher | Create topic |
| GET | `/api/curriculum/users` | ✓ | admin | List users |
| GET | `/api/curriculum/stats` | ✓ | admin | Dashboard statistics |

---

## PDF Ingestion Pipeline

1. **Upload** — Admin uploads a PDF via the Admin Portal. The file is saved to `UPLOAD_DIR`.
2. **Parse** — `pdf-parse` extracts all text content and page count.
3. **Chunk** — Text is split into overlapping chunks (`CHUNK_SIZE` chars, `CHUNK_OVERLAP` overlap).
4. **Metadata extraction** — Each chunk is analysed for grade, term, and week references.
5. **Embeddings** — Each chunk is sent to `nomic-embed-text` via Ollama to produce a 768-dimensional vector.
6. **Storage** — Chunks + vectors are stored in `document_chunks` (PostgreSQL + pgvector HNSW index).
7. **Summary** — A document-level summary is generated using the LLaMA model.

Processing runs in the background; the API returns immediately with `status: processing`.

---

## RAG Workflow

When a student asks a question:

1. The question is embedded using `nomic-embed-text`.
2. A cosine similarity search (`<=>` operator) finds the top-5 most relevant curriculum chunks.
3. The retrieved chunks are assembled into a context block.
4. A structured prompt (with CAPS system context + retrieved curriculum + question) is sent to LLaMA 3.2.
5. The answer + source citations are returned to the frontend.

Falls back to keyword search if the embedding service is unavailable.

---

## Deployment

### Docker Compose (recommended)

```yaml
# See docker-compose.yml for a ready-to-use stack:
# postgres + pgvector, ollama, backend, frontend
docker compose up -d
```

### Manual Production

```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend
cd frontend
npm run build
npm start
```

### Reverse Proxy (nginx)

Route:
- `/api/*` → `http://localhost:3001`
- `/*` → `http://localhost:3000`

---

## Database Schema (summary)

| Table | Purpose |
|-------|---------|
| `grades` | Grade R – 12 |
| `subjects` | CAPS subjects |
| `grade_subjects` | Grade ↔ subject mapping |
| `topics` | Curriculum topics per grade/subject/term |
| `subtopics` | Sub-division of topics |
| `learning_outcomes` | Specific outcomes per topic |
| `assessment_standards` | Assessment criteria with weightings |
| `curriculum_documents` | Uploaded PDF metadata + status |
| `document_chunks` | Text chunks + 768-dim vector embeddings |
| `users` | Students, teachers, admins |
| `student_progress` | Per-topic mastery tracking |
| `qa_sessions` | All Q&A interactions |
| `generated_tests` | AI-generated tests/quizzes |
| `generated_worksheets` | AI-generated worksheets |
| `lesson_plans` | AI-generated lesson plans |
| `test_attempts` | Student test submissions + scores |
| `refresh_tokens` | JWT refresh tokens |

---

## Running Tests

```bash
cd backend
npm test
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
