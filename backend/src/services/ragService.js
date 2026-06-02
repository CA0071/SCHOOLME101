const { query } = require('../config/database');
const embeddingService = require('./embeddingService');
const logger = require('../utils/logger');

/**
 * Search for relevant document chunks using vector similarity
 */
async function vectorSearch(queryText, options = {}) {
  const {
    gradeId = null,
    subjectId = null,
    topicId = null,
    limit = 5,
    minSimilarity = 0.3,
  } = options;

  try {
    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    let conditions = ['dc.embedding IS NOT NULL'];
    const params = [embeddingStr, minSimilarity, limit];
    let paramIdx = 4;

    if (gradeId) {
      conditions.push(`dc.grade_id = $${paramIdx++}`);
      params.push(gradeId);
    }
    if (subjectId) {
      conditions.push(`dc.subject_id = $${paramIdx++}`);
      params.push(subjectId);
    }
    if (topicId) {
      conditions.push(`dc.topic_id = $${paramIdx++}`);
      params.push(topicId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         dc.id,
         dc.content,
         dc.chunk_index,
         dc.page_number,
         dc.metadata,
         cd.title AS document_title,
         cd.document_type,
         g.name AS grade_name,
         s.name AS subject_name,
         1 - (dc.embedding <=> $1::vector) AS similarity
       FROM document_chunks dc
       LEFT JOIN curriculum_documents cd ON dc.document_id = cd.id
       LEFT JOIN grades g ON dc.grade_id = g.id
       LEFT JOIN subjects s ON dc.subject_id = s.id
       ${whereClause}
       HAVING 1 - (dc.embedding <=> $1::vector) >= $2
       ORDER BY dc.embedding <=> $1::vector
       LIMIT $3`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Vector search failed:', error.message);
    // Fall back to keyword search
    return keywordSearch(queryText, options);
  }
}

/**
 * Fallback keyword search when vector search is unavailable
 */
async function keywordSearch(queryText, options = {}) {
  const { gradeId = null, subjectId = null, limit = 5 } = options;

  const keywords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 10);

  if (keywords.length === 0) return [];

  const params = [`%${keywords[0]}%`, limit];
  let paramIdx = 3;

  let conditions = [`LOWER(dc.content) LIKE $1`];
  if (gradeId) {
    conditions.push(`dc.grade_id = $${paramIdx++}`);
    params.push(gradeId);
  }
  if (subjectId) {
    conditions.push(`dc.subject_id = $${paramIdx++}`);
    params.push(subjectId);
  }

  const result = await query(
    `SELECT
       dc.id,
       dc.content,
       dc.chunk_index,
       dc.metadata,
       cd.title AS document_title,
       g.name AS grade_name,
       s.name AS subject_name,
       0.5 AS similarity
     FROM document_chunks dc
     LEFT JOIN curriculum_documents cd ON dc.document_id = cd.id
     LEFT JOIN grades g ON dc.grade_id = g.id
     LEFT JOIN subjects s ON dc.subject_id = s.id
     WHERE ${conditions.join(' AND ')}
     LIMIT $2`,
    params
  );

  return result.rows;
}

/**
 * Build RAG context from retrieved chunks
 */
function buildContext(chunks) {
  if (!chunks || chunks.length === 0) {
    return { context: '', sources: [] };
  }

  const contextParts = chunks.map((chunk, i) => {
    const source = [chunk.grade_name, chunk.subject_name, chunk.document_title]
      .filter(Boolean)
      .join(' | ');
    return `[Source ${i + 1}: ${source}]\n${chunk.content}`;
  });

  const sources = chunks.map((chunk) => ({
    documentTitle: chunk.document_title,
    gradeName: chunk.grade_name,
    subjectName: chunk.subject_name,
    similarity: chunk.similarity,
    chunkIndex: chunk.chunk_index,
  }));

  return {
    context: contextParts.join('\n\n---\n\n'),
    sources,
  };
}

module.exports = { vectorSearch, keywordSearch, buildContext };
