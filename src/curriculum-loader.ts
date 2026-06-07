/**
 * Curriculum loader — reads and indexes all CAPS markdown files from the
 * repository root directory.
 */

import * as fs from "fs";
import * as path from "path";
import { SubjectEntry } from "./types.js";

/** Map grade name variants to a canonical form */
const GRADE_ALIASES: Record<string, string> = {
  "grade r": "Grade R",
  "grade 1": "Grade 1",
  "grade 2": "Grade 2",
  "grade 3": "Grade 3",
  "grade 4": "Grade 4",
  "grade 5": "Grade 5",
  "grade 6": "Grade 6",
  "grade 7": "Grade 7",
  "grade 8": "Grade 8",
  "grade 9": "Grade 9",
  "grade 10": "Grade 10",
  "grade 11": "Grade 11",
  "grade 12": "Grade 12",
};

/** Determine the school phase for a grade */
function gradeToPhase(grade: string): string {
  const g = grade.toLowerCase().trim();
  if (g === "grade r") return "Foundation Phase";
  if (/^grade [123]$/.test(g)) return "Foundation Phase";
  if (/^grade [456]$/.test(g)) return "Intermediate Phase";
  if (/^grade [789]$/.test(g)) return "Senior Phase";
  if (/^grade 1[012]$/.test(g)) return "FET Phase";
  return "Unknown Phase";
}

/**
 * Parse grade and subject from a markdown file's heading line.
 *
 * Expected format of the first heading:
 *   # Grade X — Subject Name (CAPS)
 *
 * Falls back to deriving subject from the filename when the heading does not
 * match the expected pattern.
 */
function parseHeading(
  content: string,
  filename: string
): { grade: string; subject: string } {
  const lines = content.split("\n");

  for (const line of lines.slice(0, 10)) {
    // Pattern: # Grade X — Subject (CAPS)
    const match = line.match(
      /^#\s+(Grade\s+\w+)\s+[—–-]+\s+(.+?)(?:\s*\(CAPS\))?\s*$/i
    );
    if (match) {
      const gradeRaw = match[1].trim();
      const subjectRaw = match[2].trim();
      const gradeCanon =
        GRADE_ALIASES[gradeRaw.toLowerCase()] ?? gradeRaw;
      return { grade: gradeCanon, subject: subjectRaw };
    }
  }

  // Fallback: derive subject name from filename
  const base = path.basename(filename, ".md").replace(/_/g, " ");

  // Try to extract grade from "**Grade:**" metadata line
  const gradeMatch = content.match(/\*\*Grade:\*\*\s*(Grade\s+\w+)/i);
  const grade = gradeMatch
    ? GRADE_ALIASES[gradeMatch[1].toLowerCase()] ?? gradeMatch[1]
    : "Unknown Grade";

  return { grade, subject: base };
}

/** Files that are NOT subject curriculum files */
const EXCLUDED_FILES = new Set([
  "master_index.md",
  "AI_TUTOR_INSTRUCTIONS.md",
  "README.md",
  "INSTALLATION.md",
  "MCP_TOOLS.md",
  "DEPLOYMENT.md",
]);

/**
 * Load all curriculum subject entries from the given directory.
 *
 * @param curriculumDir - Absolute path to the directory containing *.md files
 * @returns Array of parsed SubjectEntry objects
 */
export function loadCurriculum(curriculumDir: string): SubjectEntry[] {
  const entries: SubjectEntry[] = [];

  if (!fs.existsSync(curriculumDir)) {
    throw new Error(`Curriculum directory not found: ${curriculumDir}`);
  }

  const files = fs
    .readdirSync(curriculumDir)
    .filter((f) => f.endsWith(".md") && !EXCLUDED_FILES.has(f));

  for (const filename of files) {
    const fullPath = path.join(curriculumDir, filename);
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      const { grade, subject } = parseHeading(content, filename);
      const phase = gradeToPhase(grade);
      entries.push({ name: subject, grade, phase, content, filename });
    } catch {
      // Skip unreadable files silently
    }
  }

  return entries;
}

/**
 * Singleton curriculum store so the files are only read once per process.
 */
let _cache: SubjectEntry[] | null = null;

export function getCurriculum(curriculumDir: string): SubjectEntry[] {
  if (!_cache) {
    _cache = loadCurriculum(curriculumDir);
  }
  return _cache;
}
