const embeddingService = require('./embeddingService');
const ragService = require('./ragService');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are SCHOOLMATE, an AI tutor for South African learners following the CAPS (Curriculum and Assessment Policy Statement) curriculum. You help students from Grade R to Grade 12.

Your role:
- Answer questions clearly and accurately based on CAPS curriculum content
- Adapt your language complexity to the learner's grade level
- Provide step-by-step explanations when needed
- Be encouraging and patient
- Only provide information that is aligned with the South African CAPS curriculum
- When generating assessments, follow CAPS assessment standards and Bloom's Taxonomy
- Always cite the curriculum source when possible

If you don't have enough curriculum information to answer accurately, say so honestly and suggest what the student should look for in their textbook.`;

/**
 * Answer a student question using RAG
 */
async function answerQuestion(question, options = {}) {
  const {
    userId,
    gradeId,
    subjectId,
    topicId,
    gradeName,
    subjectName,
  } = options;

  // Retrieve relevant curriculum chunks
  const chunks = await ragService.vectorSearch(question, {
    gradeId,
    subjectId,
    topicId,
    limit: 5,
  });

  const { context, sources } = ragService.buildContext(chunks);

  // Build the prompt
  const contextSection = context
    ? `\n\nRelevant CAPS Curriculum Content:\n${context}\n\nBased on the above curriculum content, `
    : '\n\nNote: No specific curriculum content was found for this query. ';

  const gradeContext = gradeName ? ` for a ${gradeName} student` : '';
  const subjectContext = subjectName ? ` in ${subjectName}` : '';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `${contextSection}please answer the following question${gradeContext}${subjectContext}:\n\n${question}`,
    },
  ];

  const result = await embeddingService.chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 1500,
  });

  // Store Q&A session
  if (userId) {
    try {
      await query(
        `INSERT INTO qa_sessions
          (user_id, grade_id, subject_id, topic_id, question, answer, sources, model_used, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          gradeId || null,
          subjectId || null,
          topicId || null,
          question,
          result.content,
          JSON.stringify(sources),
          result.model,
          result.tokensUsed,
        ]
      );
    } catch (err) {
      logger.warn('Could not store Q&A session:', err.message);
    }
  }

  return {
    answer: result.content,
    sources,
    model: result.model,
  };
}

/**
 * Generate a quiz/test for a topic
 */
async function generateTest(options = {}) {
  const {
    gradeId,
    subjectId,
    topicId,
    gradeName = '',
    subjectName = '',
    topicName = '',
    numQuestions = 10,
    totalMarks = 50,
    questionTypes = ['multiple_choice', 'short_answer', 'long_answer'],
    difficulty = 'moderate',
    userId,
  } = options;

  // Get relevant curriculum content
  const searchQuery = `${subjectName} ${topicName} ${gradeName} assessment questions`.trim();
  const chunks = await ragService.vectorSearch(searchQuery, {
    gradeId,
    subjectId,
    topicId,
    limit: 8,
  });

  const { context } = ragService.buildContext(chunks);

  const prompt = `Generate a ${difficulty} difficulty ${subjectName} test for ${gradeName} on the topic: "${topicName}".

Requirements:
- Total marks: ${totalMarks}
- Number of questions: ${numQuestions}
- Question types: ${questionTypes.join(', ')}
- Follow CAPS assessment standards
- Include a marking memorandum

${context ? `Use this curriculum content as reference:\n${context.substring(0, 3000)}\n\n` : ''}

Format the response as a JSON object with this structure:
{
  "title": "Test title",
  "instructions": "General instructions",
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice|short_answer|long_answer|true_false",
      "question": "Question text",
      "marks": 2,
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": "Correct answer",
      "explanation": "Brief explanation"
    }
  ]
}`;

  const result = await embeddingService.chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.8, maxTokens: 3000 }
  );

  let testData;
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    testData = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [], title: 'Generated Test' };
  } catch (e) {
    testData = { questions: [], title: 'Generated Test', rawContent: result.content };
  }

  // Store in database
  const dbResult = await query(
    `INSERT INTO generated_tests
      (created_by, grade_id, subject_id, topic_id, title, instructions, total_marks, questions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      userId || null,
      gradeId || null,
      subjectId || null,
      topicId || null,
      testData.title || `${subjectName} Test - ${topicName}`,
      testData.instructions || '',
      totalMarks,
      JSON.stringify(testData.questions || []),
    ]
  );

  return {
    id: dbResult.rows[0].id,
    ...testData,
    gradeId,
    subjectId,
    topicId,
  };
}

/**
 * Generate a worksheet
 */
async function generateWorksheet(options = {}) {
  const {
    gradeId,
    subjectId,
    topicId,
    gradeName = '',
    subjectName = '',
    topicName = '',
    worksheetType = 'practice',
    difficulty = 'moderate',
    userId,
  } = options;

  const searchQuery = `${subjectName} ${topicName} ${gradeName} exercises activities`.trim();
  const chunks = await ragService.vectorSearch(searchQuery, {
    gradeId,
    subjectId,
    topicId,
    limit: 6,
  });

  const { context } = ragService.buildContext(chunks);

  const prompt = `Create a ${difficulty} ${worksheetType} worksheet for ${gradeName} ${subjectName} on the topic: "${topicName}".

${context ? `Reference curriculum content:\n${context.substring(0, 2000)}\n\n` : ''}

The worksheet should include:
1. Clear learning objectives
2. Instructions for learners
3. Varied activities (minimum 5 exercises)
4. Space indicators for answers
5. Follow CAPS curriculum standards

Make it engaging and appropriate for ${gradeName} level learners.`;

  const result = await embeddingService.chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.8, maxTokens: 2500 }
  );

  const dbResult = await query(
    `INSERT INTO generated_worksheets
      (created_by, grade_id, subject_id, topic_id, title, content, worksheet_type, difficulty)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      userId || null,
      gradeId || null,
      subjectId || null,
      topicId || null,
      `${subjectName} Worksheet - ${topicName}`,
      result.content,
      worksheetType,
      difficulty,
    ]
  );

  return {
    id: dbResult.rows[0].id,
    title: `${subjectName} Worksheet - ${topicName}`,
    content: result.content,
    gradeId,
    subjectId,
    topicId,
  };
}

/**
 * Generate a lesson plan
 */
async function generateLessonPlan(options = {}) {
  const {
    gradeId,
    subjectId,
    topicId,
    gradeName = '',
    subjectName = '',
    topicName = '',
    durationMinutes = 60,
    userId,
  } = options;

  const searchQuery = `${subjectName} ${topicName} ${gradeName} lesson objectives activities`.trim();
  const chunks = await ragService.vectorSearch(searchQuery, {
    gradeId,
    subjectId,
    topicId,
    limit: 6,
  });

  const { context } = ragService.buildContext(chunks);

  const prompt = `Create a detailed CAPS-aligned lesson plan for:
- Grade: ${gradeName}
- Subject: ${subjectName}
- Topic: ${topicName}
- Duration: ${durationMinutes} minutes

${context ? `CAPS curriculum reference:\n${context.substring(0, 2000)}\n\n` : ''}

Include:
1. Learning objectives (SMART goals)
2. Prior knowledge requirements
3. Resources and materials needed
4. Introduction/Starter activity (${Math.floor(durationMinutes * 0.1)} minutes)
5. Main teaching activities (${Math.floor(durationMinutes * 0.6)} minutes)
6. Learner activities and tasks
7. Conclusion/Plenary (${Math.floor(durationMinutes * 0.15)} minutes)
8. Assessment strategy
9. Differentiation for diverse learners
10. Homework assignment`;

  const result = await embeddingService.chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 2500 }
  );

  const dbResult = await query(
    `INSERT INTO lesson_plans
      (created_by, grade_id, subject_id, topic_id, title, duration_minutes, main_activities)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      userId || null,
      gradeId || null,
      subjectId || null,
      topicId || null,
      `${subjectName} Lesson Plan - ${topicName}`,
      durationMinutes,
      result.content,
    ]
  );

  return {
    id: dbResult.rows[0].id,
    title: `${subjectName} Lesson Plan - ${topicName}`,
    content: result.content,
    gradeId,
    subjectId,
    topicId,
    durationMinutes,
  };
}

module.exports = { answerQuestion, generateTest, generateWorksheet, generateLessonPlan };
