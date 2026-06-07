/**
 * MCP resource handlers for the SCHOOLME101 server.
 *
 * Resources are read-only data sources exposed at URI paths such as
 * /schoolme/subjects or /schoolme/grades/{grade}.
 */

import * as fs from "fs";
import * as path from "path";
import { SubjectEntry } from "./types.js";
import { normalise } from "./utils.js";

export interface ResourceContent {
  /** MIME type of the content */
  mimeType: string;
  /** Text or JSON content */
  text: string;
}

// ---------------------------------------------------------------------------
// /schoolme/subjects
// ---------------------------------------------------------------------------

/**
 * Return a JSON list of all available subject names.
 */
export function resourceSubjects(entries: SubjectEntry[]): ResourceContent {
  const subjects = [...new Set(entries.map((e) => e.name))].sort();
  return {
    mimeType: "application/json",
    text: JSON.stringify({ subjects, total: subjects.length }, null, 2),
  };
}

// ---------------------------------------------------------------------------
// /schoolme/grades/{grade}
// ---------------------------------------------------------------------------

/**
 * Return subjects for a specific grade.
 */
export function resourceGrade(
  entries: SubjectEntry[],
  grade: string
): ResourceContent {
  const matches = entries.filter(
    (e) => normalise(e.grade) === normalise(grade)
  );
  const subjects = matches.map((e) => ({ name: e.name, filename: e.filename }));
  return {
    mimeType: "application/json",
    text: JSON.stringify(
      { grade, phase: matches[0]?.phase ?? "Unknown", subjects },
      null,
      2
    ),
  };
}

// ---------------------------------------------------------------------------
// /schoolme/subject/{subjectName}
// ---------------------------------------------------------------------------

/**
 * Return subject content (markdown) with metadata envelope.
 */
export function resourceSubjectContent(
  entries: SubjectEntry[],
  subjectName: string
): ResourceContent {
  const ns = normalise(subjectName);
  const entry = entries.find(
    (e) =>
      normalise(e.name) === ns ||
      normalise(e.name).includes(ns) ||
      ns.includes(normalise(e.name))
  );

  if (!entry) {
    return {
      mimeType: "application/json",
      text: JSON.stringify({ error: `Subject not found: ${subjectName}` }),
    };
  }

  return {
    mimeType: "text/markdown",
    text: entry.content,
  };
}

// ---------------------------------------------------------------------------
// /schoolme/tutor-instructions
// ---------------------------------------------------------------------------

/**
 * Return the AI tutor instructions file.
 */
export function resourceTutorInstructions(
  curriculumDir: string
): ResourceContent {
  const filePath = path.join(curriculumDir, "AI_TUTOR_INSTRUCTIONS.md");
  if (!fs.existsSync(filePath)) {
    return {
      mimeType: "text/plain",
      text: "AI tutor instructions not found.",
    };
  }
  return {
    mimeType: "text/markdown",
    text: fs.readFileSync(filePath, "utf-8"),
  };
}

// ---------------------------------------------------------------------------
// /schoolme/curriculum/search
// ---------------------------------------------------------------------------

/**
 * Return a lightweight search index (subject + grade + phase) as JSON.
 */
export function resourceSearchIndex(entries: SubjectEntry[]): ResourceContent {
  const index = entries.map((e) => ({
    subject: e.name,
    grade: e.grade,
    phase: e.phase,
    filename: e.filename,
  }));
  return {
    mimeType: "application/json",
    text: JSON.stringify({ total: index.length, index }, null, 2),
  };
}
