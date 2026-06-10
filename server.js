const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GitHub API Configuration
const GITHUB_API_URL = 'https://api.github.com/repos/CA0071/SCHOOLME101/contents';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Cache for curriculum data
let curriculumCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetch file from GitHub
 */
async function fetchFileFromGitHub(path) {
  try {
    const config = {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
    };
    
    const response = await axios.get(`${GITHUB_API_URL}/${path}`, config);
    
    if (response.data.content) {
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error.message);
    return null;
  }
}

/**
 * Get all available subjects
 */
async function getAllSubjects() {
  try {
    const config = {
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
    };
    
    const response = await axios.get(GITHUB_API_URL, config);
    
    const subjects = response.data
      .filter(item => item.type === 'file' && item.name.endsWith('.md'))
      .map(item => ({
        name: item.name.replace('.md', ''),
        path: item.path,
        url: item.html_url,
        size: item.size
      }));
    
    return subjects;
  } catch (error) {
    console.error('Error fetching subjects:', error.message);
    return [];
  }
}

// ============================================
// MCP Server Routes
// ============================================

/**
 * Health Check Endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    server: 'SCHOOLME101 MCP Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get Server Info
 * GET /info
 */
app.get('/info', (req, res) => {
  res.json({
    name: 'SCHOOLME101 MCP Server',
    description: 'South African CAPS Curriculum AI Tutor with Codex AI Integration',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      info: '/info',
      subjects: '/api/subjects',
      subject: '/api/subject/:name',
      search: '/api/search',
      tutor: '/api/tutor'
    },
    features: [
      'Complete CAPS Curriculum',
      'Age-appropriate tutoring',
      'Subject search',
      'Grade-based filtering',
      'AI tutoring interface'
    ]
  });
});

/**
 * Get All Available Subjects
 * GET /api/subjects
 */
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    res.json({
      success: true,
      count: subjects.length,
      subjects: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Specific Subject Content
 * GET /api/subject/:name
 */
app.get('/api/subject/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filename = `${name}.md`;
    
    const content = await fetchFileFromGitHub(filename);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Subject "${name}" not found`
      });
    }
    
    res.json({
      success: true,
      subject: name,
      content: content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search Curriculum
 * GET /api/search?q=query&subject=optional
 */
app.get('/api/search', async (req, res) => {
  try {
    const { q, subject } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const subjects = await getAllSubjects();
    const results = [];
    
    for (const subj of subjects) {
      if (subject && !subj.name.toLowerCase().includes(subject.toLowerCase())) {
        continue;
      }
      
      const content = await fetchFileFromGitHub(subj.path);
      
      if (content && content.toLowerCase().includes(q.toLowerCase())) {
        const lines = content.split('\n');
        const matches = lines
          .map((line, idx) => ({
            line: idx + 1,
            content: line,
            match: line.toLowerCase().includes(q.toLowerCase())
          }))
          .filter(m => m.match);
        
        if (matches.length > 0) {
          results.push({
            subject: subj.name,
            matches: matches.slice(0, 5) // Limit to 5 matches per subject
          });
        }
      }
    }
    
    res.json({
      success: true,
      query: q,
      resultsCount: results.length,
      results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * AI Tutor Interface
 * POST /api/tutor
 */
app.post('/api/tutor', async (req, res) => {
  try {
    const { grade, subject, question, tone = 'educational' } = req.body;
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject is required'
      });
    }
    
    const content = await fetchFileFromGitHub(`${subject}.md`);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Subject "${subject}" not found`
      });
    }
    
    // Extract relevant sections based on question
    const lines = content.split('\n');
    const relevantLines = question 
      ? lines.filter(line => 
          question.split(' ').some(word => 
            line.toLowerCase().includes(word.toLowerCase())
          )
        )
      : lines.slice(0, 20);
    
    const context = relevantLines.join('\n').substring(0, 2000);
    
    res.json({
      success: true,
      subject: subject,
      grade: grade || 'Not specified',
      tone: tone,
      question: question || 'General inquiry',
      context: context,
      instructions: getTutorInstructions(grade),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Codex AI Integration Endpoint
 * POST /api/codex
 */
app.post('/api/codex', async (req, res) => {
  try {
    const { apiKey, subject, query, grade } = req.body;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Codex API Key is required'
      });
    }
    
    if (!subject) {
      return res.status(400).json({
        success: false,
        error: 'Subject is required'
      });
    }
    
    // Fetch curriculum content
    const content = await fetchFileFromGitHub(`${subject}.md`);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Subject "${subject}" not found`
      });
    }
    
    // Prepare context for Codex
    const codexPayload = {
      subject: subject,
      grade: grade || 'Not specified',
      curriculum_context: content.substring(0, 3000),
      user_query: query,
      instructions: getTutorInstructions(grade)
    };
    
    res.json({
      success: true,
      status: 'ready_for_codex',
      payload: codexPayload,
      message: 'Send this payload to Codex AI with your API key',
      codex_integration: {
        endpoint: 'https://api.openai.com/v1/engines/codex/completions',
        method: 'POST',
        auth_header: `Authorization: Bearer ${apiKey}`,
        prompt_template: buildCodexPrompt(subject, query, grade, content)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get Curriculum Index
 * GET /api/index
 */
app.get('/api/index', async (req, res) => {
  try {
    const indexContent = await fetchFileFromGitHub('master_index.md');
    const instructionsContent = await fetchFileFromGitHub('AI_TUTOR_INSTRUCTIONS.md');
    
    res.json({
      success: true,
      index: indexContent,
      instructions: instructionsContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get tutor instructions based on grade
 */
function getTutorInstructions(grade) {
  const gradeNum = parseInt(grade);
  
  if (gradeNum <= 3) {
    return {
      tone: 'playful and encouraging',
      length: 'short and simple',
      vocabulary: 'simple words'
    };
  } else if (gradeNum <= 6) {
    return {
      tone: 'clear and supportive',
      length: 'moderate with step-by-step',
      vocabulary: 'age-appropriate with definitions'
    };
  } else if (gradeNum <= 9) {
    return {
      tone: 'respectful and coaching',
      length: 'detailed with examples',
      vocabulary: 'technical terms with explanations'
    };
  } else {
    return {
      tone: 'professional and exam-focused',
      length: 'comprehensive',
      vocabulary: 'technical and precise'
    };
  }
}

/**
 * Build Codex prompt
 */
function buildCodexPrompt(subject, query, grade, content) {
  return `You are an expert South African CAPS curriculum tutor for Grade ${grade || '7'}.

Subject: ${subject}

Curriculum Context:
${content.substring(0, 2000)}

Student Question: ${query}

Based on the curriculum above, provide a clear, age-appropriate, and educational answer following CAPS guidelines.`;
}

// ============================================
// Error Handling
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   SCHOOLME101 MCP Server - Running Successfully       ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🚀 Server started on http://localhost:${PORT}          ║
║                                                        ║
║  📚 Endpoints:                                         ║
║     • /health - Health check                          ║
║     • /info - Server information                      ║
║     • /api/subjects - List all subjects              ║
║     • /api/subject/:name - Get subject content       ║
║     • /api/search - Search curriculum                ║
║     • /api/tutor - AI tutoring interface             ║
║     • /api/codex - Codex AI integration              ║
║     • /api/index - Get curriculum index              ║
║                                                        ║
║  🔌 Codex AI Integration Ready                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
