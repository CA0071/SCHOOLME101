/**
 * MCP tool definitions and handlers for the SCHOOLME101 server.
 *
 * Every exported function corresponds to one MCP tool.  Each function
 * receives already-parsed arguments and the loaded curriculum, and returns
 * a plain string that becomes the tool's text response.
 */

import { SubjectEntry } from "./types.js";
import { findSubject, searchEntries, normalise } from "./utils.js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Tool: get_subject_content
// ---------------------------------------------------------------------------

/**
 * Retrieve the full CAPS curriculum content for a named subject.
 *
 * @param entries  Loaded curriculum entries
 * @param subject  Subject name (e.g. "Mathematics")
 * @param grade    Optional grade filter (e.g. "Grade 7")
 */
export function getSubjectContent(
  entries: SubjectEntry[],
  subject: string,
  grade?: string
): string {
  const entry = findSubject(entries, subject, grade);

  if (!entry) {
    const gradeHint = grade ? ` for ${grade}` : "";
    return `No curriculum content found for subject "${subject}"${gradeHint}. Use list_all_subjects to see available subjects.`;
  }

  return entry.content;
}

// ---------------------------------------------------------------------------
// Tool: search_curriculum
// ---------------------------------------------------------------------------

/**
 * Search across all curriculum subjects for a query string.
 *
 * @param entries     Loaded curriculum entries
 * @param query       Search query
 * @param grade       Optional grade filter
 * @param maxResults  Maximum results to return (default 10)
 */
export function searchCurriculum(
  entries: SubjectEntry[],
  query: string,
  grade?: string,
  maxResults = 10
): string {
  if (!query.trim()) return "Please provide a search query.";

  const results = searchEntries(entries, query, grade, maxResults);

  if (results.length === 0) {
    return `No results found for "${query}"${grade ? ` in ${grade}` : ""}.`;
  }

  const lines = results.map(
    (r, i) =>
      `${i + 1}. **${r.subject}** (${r.grade} — ${r.phase})\n   ${r.excerpt}`
  );

  return `## Search Results for "${query}"\n\nFound ${results.length} result(s):\n\n${lines.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Tool: get_grade_overview
// ---------------------------------------------------------------------------

/**
 * Get a summary of all subjects available for a specific grade.
 *
 * @param entries  Loaded curriculum entries
 * @param grade    Grade string (e.g. "Grade 7")
 */
export function getGradeOverview(
  entries: SubjectEntry[],
  grade: string
): string {
  const matches = entries.filter(
    (e) => normalise(e.grade) === normalise(grade)
  );

  if (matches.length === 0) {
    return `No subjects found for "${grade}". Valid grades are: Grade R, Grade 1 – Grade 12.`;
  }

  const phase = matches[0].phase;
  const subjects = matches.map((e) => `- ${e.name}`).sort().join("\n");

  return `## ${grade} — ${phase}\n\n**Total subjects:** ${matches.length}\n\n### Available Subjects\n${subjects}`;
}

// ---------------------------------------------------------------------------
// Tool: get_ai_tutor_instructions
// ---------------------------------------------------------------------------

/**
 * Return the contents of the AI_TUTOR_INSTRUCTIONS.md file.
 *
 * @param curriculumDir  Directory where the file lives
 */
export function getAiTutorInstructions(curriculumDir: string): string {
  const filePath = path.join(curriculumDir, "AI_TUTOR_INSTRUCTIONS.md");
  if (!fs.existsSync(filePath)) {
    return "AI tutor instructions file not found.";
  }
  return fs.readFileSync(filePath, "utf-8");
}

// ---------------------------------------------------------------------------
// Tool: list_all_subjects
// ---------------------------------------------------------------------------

/**
 * Return a markdown table listing every subject with its grade and phase.
 *
 * @param entries  Loaded curriculum entries
 */
export function listAllSubjects(entries: SubjectEntry[]): string {
  if (entries.length === 0) return "No curriculum subjects loaded.";

  const gradeOrder = [
    "Grade R",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ];

  const gradeIndex = (g: string) => {
    const idx = gradeOrder.indexOf(g);
    return idx === -1 ? 999 : idx;
  };

  const sorted = [...entries].sort((a, b) => {
    const gi = gradeIndex(a.grade) - gradeIndex(b.grade);
    if (gi !== 0) return gi;
    return a.name.localeCompare(b.name);
  });

  const rows = sorted
    .map((e) => `| ${e.grade} | ${e.phase} | ${e.name} |`)
    .join("\n");

  return `## All CAPS Curriculum Subjects\n\n**Total:** ${entries.length}\n\n| Grade | Phase | Subject |\n|-------|-------|---------|\n${rows}`;
}

// ---------------------------------------------------------------------------
// Tool: get_subject_by_grade
// ---------------------------------------------------------------------------

/**
 * Get specific subject content filtered by exact grade.
 *
 * @param entries  Loaded curriculum entries
 * @param subject  Subject name
 * @param grade    Grade string
 */
export function getSubjectByGrade(
  entries: SubjectEntry[],
  subject: string,
  grade: string
): string {
  return getSubjectContent(entries, subject, grade);
}

// ---------------------------------------------------------------------------
// Tool: search_by_topic
// ---------------------------------------------------------------------------

/**
 * Deep topic search — searches within a subject and/or grade for a topic.
 *
 * @param entries  Loaded curriculum entries
 * @param topic    Topic to look for
 * @param grade    Optional grade filter
 * @param subject  Optional subject filter
 */
export function searchByTopic(
  entries: SubjectEntry[],
  topic: string,
  grade?: string,
  subject?: string
): string {
  let pool = entries;

  if (grade) {
    pool = pool.filter((e) => normalise(e.grade) === normalise(grade));
  }

  if (subject) {
    pool = pool.filter(
      (e) =>
        normalise(e.name).includes(normalise(subject)) ||
        normalise(subject).includes(normalise(e.name))
    );
  }

  const results = searchEntries(pool, topic, undefined, 10);

  if (results.length === 0) {
    return `Topic "${topic}" not found${grade ? ` in ${grade}` : ""}${subject ? ` for ${subject}` : ""}.`;
  }

  const lines = results.map(
    (r, i) =>
      `${i + 1}. **${r.subject}** — ${r.grade} (${r.phase})\n   ${r.excerpt}`
  );

  return `## Topic Search: "${topic}"\n\n${lines.join("\n\n")}`;
}
