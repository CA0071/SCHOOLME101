# Codex AI Integration Guide

## Overview

Connect your SCHOOLME101 MCP Server to Codex AI for intelligent, curriculum-aware tutoring.

---

## Step 1: Get Codex API Key

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Add to `.env`:
   ```env
   CODEX_API_KEY=sk-your-key-here
   ```

---

## Step 2: Server Setup

Ensure your MCP Server is running:

```bash
npm install
npm start
```

Server will be available at `http://localhost:3000` (or your deployment URL)

---

## Step 3: Test Codex Endpoint

```bash
curl -X POST http://localhost:3000/api/codex \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-your-key",
    "subject": "Mathematics",
    "query": "What is differentiation?",
    "grade": "12"
  }'
```

Response example:
```json
{
  "success": true,
  "status": "ready_for_codex",
  "payload": {
    "subject": "Mathematics",
    "grade": "12",
    "curriculum_context": "...",
    "user_query": "What is differentiation?",
    "instructions": {...}
  },
  "codex_integration": {
    "endpoint": "https://api.openai.com/v1/engines/codex/completions",
    "prompt_template": "You are an expert South African CAPS curriculum tutor..."
  }
}
```

---

## Step 4: Send to Codex

```javascript
async function queryCodex(subject, question, grade, apiKey) {
  // Step 1: Get context from MCP Server
  const mcp = await fetch('http://your-server:3000/api/codex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: apiKey,
      subject: subject,
      query: question,
      grade: grade
    })
  }).then(r => r.json());

  // Step 2: Send to Codex
  const codexResponse = await fetch(
    'https://api.openai.com/v1/engines/codex/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: mcp.codex_integration.prompt_template,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1.0
      })
    }
  ).then(r => r.json());

  return codexResponse.choices[0].text;
}

// Usage
const answer = await queryCodex(
  'Mathematics',
  'Explain quadratic equations',
  '10',
  'sk-your-api-key'
);

console.log(answer);
```

---

## Step 5: Use in Your Application

### Web Application Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>SCHOOLME101 AI Tutor</title>
</head>
<body>
  <input type="text" id="question" placeholder="Ask a question...">
  <button onclick="getTutoring()">Get Answer</button>
  <div id="answer"></div>

  <script>
    async function getTutoring() {
      const question = document.getElementById('question').value;
      const grade = document.getElementById('grade').value || '10';
      const subject = document.getElementById('subject').value || 'Mathematics';
      const apiKey = 'sk-your-key'; // Store securely!

      try {
        const response = await fetch('http://your-server:3000/api/codex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: apiKey,
            subject: subject,
            query: question,
            grade: grade
          })
        });

        const data = await response.json();
        
        // Send to Codex
        const codexRes = await fetch(
          'https://api.openai.com/v1/engines/codex/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: data.codex_integration.prompt_template,
              max_tokens: 500,
              temperature: 0.7
            })
          }
        );

        const answer = await codexRes.json();
        document.getElementById('answer').textContent = 
          answer.choices[0].text;
      } catch (error) {
        console.error('Error:', error);
      }
    }
  </script>
</body>
</html>
```

---

## API Endpoints Summary

### `/api/codex` - Main Integration Endpoint

**Method:** POST

**Request:**
```json
{
  "apiKey": "sk-...",
  "subject": "Mathematics",
  "query": "What is calculus?",
  "grade": "12"
}
```

**Response:**
```json
{
  "success": true,
  "status": "ready_for_codex",
  "payload": {
    "subject": "Mathematics",
    "grade": "12",
    "curriculum_context": "...",
    "user_query": "What is calculus?",
    "instructions": {...}
  },
  "codex_integration": {
    "endpoint": "https://api.openai.com/v1/engines/codex/completions",
    "method": "POST",
    "auth_header": "Authorization: Bearer sk-...",
    "prompt_template": "..."
  }
}
```

---

## Recommended Settings for Codex

```json
{
  "prompt": "...",
  "max_tokens": 500,
  "temperature": 0.7,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

**Explanation:**
- `max_tokens: 500` - Adequate for educational responses
- `temperature: 0.7` - Balance between creativity and consistency
- `top_p: 1.0` - Use full probability distribution

---

## Caching Strategy

Cache responses for 1 hour to save API calls:

```javascript
const cache = new Map();

async function queryCodexWithCache(key, subject, question, grade, apiKey) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await queryCodex(subject, question, grade, apiKey);
  cache.set(key, result);

  // Auto-clear after 1 hour
  setTimeout(() => cache.delete(key), 3600000);

  return result;
}
```

---

## Rate Limiting

Implement rate limiting to prevent excessive API calls:

```javascript
const rateLimit = {};

function canQuery(userId) {
  const now = Date.now();
  if (!rateLimit[userId]) {
    rateLimit[userId] = [];
  }

  // Remove old entries (> 1 minute)
  rateLimit[userId] = rateLimit[userId].filter(t => now - t < 60000);

  // Allow max 10 requests per minute
  if (rateLimit[userId].length < 10) {
    rateLimit[userId].push(now);
    return true;
  }

  return false;
}
```

---

## Error Handling

```javascript
async function safeCodexQuery(subject, question, grade, apiKey) {
  try {
    // Step 1: Validate inputs
    if (!subject || !apiKey) {
      throw new Error('Missing required parameters');
    }

    // Step 2: Get MCP context
    const mcp = await fetch('http://your-server:3000/api/codex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: apiKey,
        subject: subject,
        query: question,
        grade: grade
      })
    }).then(r => r.json());

    if (!mcp.success) {
      throw new Error(mcp.error || 'MCP Server error');
    }

    // Step 3: Query Codex with error handling
    const codexRes = await fetch(
      'https://api.openai.com/v1/engines/codex/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: mcp.codex_integration.prompt_template,
          max_tokens: 500,
          temperature: 0.7
        })
      }
    );

    if (!codexRes.ok) {
      const error = await codexRes.json();
      throw new Error(error.error?.message || 'Codex API error');
    }

    return await codexRes.json();

  } catch (error) {
    console.error('Codex Query Error:', error);
    return {
      error: error.message,
      fallback: 'Unable to process query. Please try again.'
    };
  }
}
```

---

## Best Practices

1. **Store API keys securely** - Use environment variables or secure vaults
2. **Implement caching** - Reduce API calls and costs
3. **Use rate limiting** - Prevent abuse
4. **Validate inputs** - Ensure valid subjects and grades
5. **Handle errors gracefully** - Provide fallback responses
6. **Monitor usage** - Track API calls and costs
7. **Log requests** - For debugging and analytics

---

## Deployment Checklist

- ✅ MCP Server deployed and running
- ✅ Codex API key configured in `.env`
- ✅ HTTPS enabled (required for production)
- ✅ CORS configured properly
- ✅ Error handling implemented
- ✅ Rate limiting enabled
- ✅ Caching strategy in place
- ✅ Logging configured
- ✅ API key rotation policy defined

---

## Support

For issues or questions:
1. Check [OpenAI Codex Documentation](https://platform.openai.com/docs/guides/code)
2. Review error messages in console
3. Test endpoints with cURL first
4. Check `.env` configuration

---

**Version:** 1.0.0  
**Last Updated:** 2026-06-10
