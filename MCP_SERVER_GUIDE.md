# SCHOOLME101 MCP Server - Setup & Integration Guide

## Overview

SCHOOLME101 is now a fully functional **Model Context Protocol (MCP) Server** providing REST API access to the complete South African CAPS curriculum with Codex AI integration.

---

## 🚀 Quick Start

### 1. Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server
npm start
```

Server will run on `http://localhost:3000`

### 2. Verify Server Status

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "running",
  "server": "SCHOOLME101 MCP Server",
  "version": "1.0.0",
  "timestamp": "2026-06-10T..."
}
```

---

## 📚 API Endpoints

### 1. Health Check
```
GET /health
```
Returns server status.

### 2. Server Info
```
GET /info
```
Returns server information and available endpoints.

### 3. Get All Subjects
```
GET /api/subjects
```
Returns list of all available curriculum subjects.

**Example:**
```bash
curl http://localhost:3000/api/subjects
```

### 4. Get Subject Content
```
GET /api/subject/:name
```
Returns full content of a specific subject.

**Example:**
```bash
curl http://localhost:3000/api/subject/Mathematics
```

### 5. Search Curriculum
```
GET /api/search?q=query&subject=optional
```
Searches across all subjects for a query.

**Example:**
```bash
curl "http://localhost:3000/api/search?q=algebra&subject=Mathematics"
```

### 6. AI Tutor Interface
```
POST /api/tutor
```
Provides context for AI tutoring.

**Body:**
```json
{
  "grade": "10",
  "subject": "Mathematics",
  "question": "How do I solve quadratic equations?",
  "tone": "educational"
}
```

### 7. Codex AI Integration
```
POST /api/codex
```
Prepares curriculum context for Codex AI.

**Body:**
```json
{
  "apiKey": "your_codex_api_key",
  "subject": "Mathematics",
  "query": "Explain derivatives",
  "grade": "12"
}
```

### 8. Get Curriculum Index
```
GET /api/index
```
Returns master index and tutor instructions.

---

## 🔌 Codex AI Integration

### Setup Instructions

1. **Get Codex API Key:**
   - Visit [OpenAI](https://platform.openai.com/docs/guides/code)
   - Create API key
   - Add to `.env` file as `CODEX_API_KEY`

2. **Send Request to Codex Endpoint:**

```javascript
// Example using fetch
const response = await fetch('http://your-server:3000/api/codex', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'sk-...',
    subject: 'Mathematics',
    query: 'What is calculus?',
    grade: '12'
  })
});

const data = await response.json();
// Use data.payload for Codex AI
```

3. **Send to Codex:**

```javascript
const codexResponse = await fetch('https://api.openai.com/v1/engines/codex/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CODEX_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: data.codex_integration.prompt_template,
    max_tokens: 500,
    temperature: 0.7
  })
});
```

---

## 🌍 Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import project
4. Add environment variables
5. Deploy

**Your live endpoint:** `https://your-deployment.vercel.app`

### Option 2: Docker

```bash
# Build image
docker build -t schoolme101-mcp .

# Run container
docker run -p 3000:3000 -e PORT=3000 schoolme101-mcp
```

### Option 3: Railway, Heroku, or AWS

Use `Dockerfile` and standard Node.js deployment process.

---

## 📋 Environment Variables

Create `.env` file:

```env
PORT=3000
NODE_ENV=production
GITHUB_TOKEN=your_token_optional
CODEX_API_KEY=sk-your-key-here
CORS_ORIGIN=*
```

---

## 🧪 Testing

### Test Health
```bash
curl http://localhost:3000/health
```

### Test Subjects
```bash
curl http://localhost:3000/api/subjects
```

### Test Subject Content
```bash
curl http://localhost:3000/api/subject/Mathematics
```

### Test Search
```bash
curl "http://localhost:3000/api/search?q=algebra"
```

### Test Tutor
```bash
curl -X POST http://localhost:3000/api/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "grade": "10",
    "subject": "Mathematics",
    "question": "Solve 2x + 5 = 15"
  }'
```

---

## 🔐 Security

1. **Use HTTPS** in production
2. **Validate inputs** on all endpoints
3. **Rate limiting** (implement as needed)
4. **API Key rotation** for Codex
5. **CORS** configuration in `.env`

---

## 📊 Available Subjects

The server provides access to 100+ curriculum subjects including:

- **Languages:** English, Afrikaans, Sepedi, Sesotho, Setswana, Siswati, Tshivenda, Xitsonga, isiNdebele, isiXhosa, isiZulu
- **Sciences:** Natural Sciences, Physical Sciences, Life Sciences, Agricultural Sciences
- **Mathematics:** Mathematics, Mathematical Literacy
- **Technology:** IT, CAT, Coding & Robotics, Engineering Graphics
- **Arts:** Visual Arts, Music, Dance, Dramatic Arts, Fashion Design
- **Social Sciences:** History, Geography, Social Sciences
- **And more...**

---

## 🛠️ Troubleshooting

### Server won't start
```bash
# Check Node version
node --version  # Should be >= 16

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Codex endpoint returns 401
- Verify API key in `.env`
- Check API key validity on OpenAI dashboard

### No results from search
- Verify subject exists: `GET /api/subjects`
- Check query spelling
- Try broader search terms

---

## 📖 Tutor Tone Guidance

Server automatically adjusts for age groups:

| Grade | Tone | Style |
|-------|------|-------|
| R-3 | Playful | Simple, short |
| 4-6 | Supportive | Clear, step-by-step |
| 7-9 | Coaching | Detailed, examples |
| 10-12 | Professional | Exam-focused |

---

## 🤝 Integration Examples

### JavaScript/Node.js
```javascript
const subject = await fetch('http://localhost:3000/api/subject/Mathematics')
  .then(r => r.json());
console.log(subject.content);
```

### Python
```python
import requests
response = requests.get('http://localhost:3000/api/subjects')
subjects = response.json()['subjects']
```

### cURL
```bash
curl http://localhost:3000/api/subject/Mathematics | jq
```

---

## 📞 Support

- **GitHub Issues:** Report bugs on repository
- **Email:** ca0071@github.com
- **Documentation:** See `AI_TUTOR_INSTRUCTIONS.md` and `master_index.md`

---

## ✅ Status

- ✅ Server: Running
- ✅ API: Functional
- ✅ Codex Integration: Ready
- ✅ Curriculum: Complete (363+ subjects)
- ✅ Documentation: Complete

**Last Updated:** 2026-06-10
**Version:** 1.0.0
