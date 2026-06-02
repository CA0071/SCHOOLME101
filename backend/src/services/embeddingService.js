const logger = require('../utils/logger');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;

/**
 * Generate a vector embedding for the given text using Ollama
 */
async function generateEmbedding(text) {
  const truncatedText = text.substring(0, 8192);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: truncatedText,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Ollama embeddings API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    logger.warn('Embedding generation failed, using zero vector:', error.message);
    // Return a zero vector as fallback so document can still be stored
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }
}

/**
 * Generate a text summary using Ollama
 */
async function generateSummary(text) {
  const prompt = `Summarize the following educational curriculum content in 2-3 sentences. Focus on the main topics, grade level, and learning objectives covered:\n\n${text.substring(0, 3000)}`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 200 },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || text.substring(0, 300) + '...';
  } catch (error) {
    logger.warn('Summary generation failed:', error.message);
    return text.substring(0, 300) + '...';
  }
}

/**
 * Chat completion using Ollama or OpenAI-compatible API
 */
async function chatCompletion(messages, options = {}) {
  const {
    model = OLLAMA_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
  } = options;

  // Try Ollama first
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || '',
      model: data.model || model,
      tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    };
  } catch (error) {
    // Fall back to OpenAI-compatible API if configured
    if (process.env.OPENAI_API_KEY) {
      return chatCompletionOpenAI(messages, options);
    }
    throw error;
  }
}

/**
 * OpenAI-compatible fallback
 */
async function chatCompletionOpenAI(messages, options = {}) {
  const { model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 2048 } = options;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errBody}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

module.exports = { generateEmbedding, generateSummary, chatCompletion };
