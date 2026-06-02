const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const embeddingService = require('./embeddingService');

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 1000;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 200;
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

/**
 * Validate that a file path is safely within the configured upload directory.
 * Prevents path traversal / path injection attacks.
 */
function validateUploadPath(filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep) && resolved !== UPLOAD_DIR) {
    throw new Error('Invalid file path: access outside upload directory is not permitted');
  }
  return resolved;
}

/**
 * Split text into overlapping chunks
 */
function splitTextIntoChunks(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  const sentences = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+|\n\n+/)
    .filter((s) => s.trim().length > 0);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push({ index: chunkIndex++, content: currentChunk.trim() });
      // Keep overlap from the end of the current chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(Math.max(0, words.length - Math.floor(overlap / 5)));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ index: chunkIndex, content: currentChunk.trim() });
  }

  return chunks;
}

/**
 * Extract metadata from text content (grade, subject, term, topic)
 */
function extractMetadata(text) {
  const metadata = {};

  // Detect grade
  const gradeMatch = text.match(/grade\s+([r\d]+)/i);
  if (gradeMatch) {
    metadata.grade = gradeMatch[1].toUpperCase() === 'R' ? 'Grade R' : `Grade ${gradeMatch[1]}`;
  }

  // Detect term
  const termMatch = text.match(/term\s+([1-4])/i);
  if (termMatch) {
    metadata.term = parseInt(termMatch[1]);
  }

  // Detect week
  const weekMatch = text.match(/week[s]?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i);
  if (weekMatch) {
    metadata.weekStart = parseInt(weekMatch[1]);
    if (weekMatch[2]) metadata.weekEnd = parseInt(weekMatch[2]);
  }

  return metadata;
}

/**
 * Process a PDF document and store chunks with embeddings
 */
async function processPDF(documentId, filePath) {
  logger.info(`Starting PDF processing for document: ${documentId}`);

  try {
    // Update status to processing
    await query(
      `UPDATE curriculum_documents SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [documentId]
    );

    // Read and parse PDF (path is validated against the upload directory)
    const safeFilePath = validateUploadPath(filePath);
    const fileBuffer = await fs.readFile(safeFilePath);
    const pdfData = await pdfParse(fileBuffer);

    const totalPages = pdfData.numpages;
    const rawText = pdfData.text;

    logger.info(`PDF parsed: ${totalPages} pages, ${rawText.length} characters`);

    // Extract document-level metadata
    const docMetadata = extractMetadata(rawText.substring(0, 2000));

    // Get grade_id and subject_id from document record
    const docResult = await query(
      `SELECT grade_id, subject_id FROM curriculum_documents WHERE id = $1`,
      [documentId]
    );
    const doc = docResult.rows[0];

    // Split into chunks
    const chunks = splitTextIntoChunks(rawText);
    logger.info(`Split into ${chunks.length} chunks`);

    // Generate summary for the document
    const summaryText = rawText.substring(0, 3000);
    let summary = null;
    try {
      summary = await embeddingService.generateSummary(summaryText);
    } catch (err) {
      logger.warn('Could not generate document summary:', err.message);
      summary = rawText.substring(0, 500) + '...';
    }

    // Process and store each chunk
    let processedChunks = 0;
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (chunk) => {
          try {
            const chunkMetadata = extractMetadata(chunk.content);
            const metadata = { ...docMetadata, ...chunkMetadata };

            // Generate embedding
            let embedding = null;
            try {
              embedding = await embeddingService.generateEmbedding(chunk.content);
            } catch (err) {
              logger.warn(`Could not generate embedding for chunk ${chunk.index}:`, err.message);
            }

            await query(
              `INSERT INTO document_chunks
                (document_id, chunk_index, content, grade_id, subject_id, term, metadata, embedding)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                documentId,
                chunk.index,
                chunk.content,
                doc.grade_id,
                doc.subject_id,
                metadata.term || null,
                JSON.stringify(metadata),
                embedding ? `[${embedding.join(',')}]` : null,
              ]
            );
            processedChunks++;
          } catch (err) {
            logger.error(`Error processing chunk ${chunk.index}:`, err.message);
          }
        })
      );

      // Update progress
      const progress = Math.floor(((i + batchSize) / chunks.length) * 100);
      logger.info(`Document ${documentId}: ${Math.min(progress, 100)}% processed`);
    }

    // Update document status
    await query(
      `UPDATE curriculum_documents
       SET status = 'completed',
           total_pages = $1,
           total_chunks = $2,
           summary = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [totalPages, processedChunks, summary, documentId]
    );

    logger.info(`PDF processing completed for document ${documentId}: ${processedChunks} chunks stored`);
    return { success: true, totalPages, totalChunks: processedChunks };
  } catch (error) {
    logger.error(`PDF processing failed for document ${documentId}:`, error);
    await query(
      `UPDATE curriculum_documents
       SET status = 'failed', processing_error = $1, updated_at = NOW()
       WHERE id = $2`,
      [error.message, documentId]
    );
    throw error;
  }
}

module.exports = { processPDF, splitTextIntoChunks, extractMetadata };
