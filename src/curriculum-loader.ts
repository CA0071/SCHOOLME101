import fs from "node:fs";
import path from "node:path";
import { CurriculumSubject } from "./types.js";

const FILE_SUFFIX = ".md";
const EXCLUDED_FILES = new Set(["README.md", "master_index.md", "AI_TUTOR_INSTRUCTIONS.md"]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}

function parseHeading(content: string): { grade: string; subject: string } | null {
  const firstLine = content.split("\n", 1)[0]?.trim();
  if (!firstLine) return null;
  const match = firstLine.match(/^#\s*Grade\s+([^—-]+)\s+[—-]\s+(.+?)\s*\(/i);
  if (!match) return null;
  return {
    grade: match[1].trim(),
    subject: match[2].trim()
  };
}

export class CurriculumLoader {
  private readonly rootDir: string;
  private subjectsCache: CurriculumSubject[] | null = null;
  private tutorInstructionsCache: string | null = null;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  loadSubjects(): CurriculumSubject[] {
    if (this.subjectsCache) return this.subjectsCache;

    const files = fs
      .readdirSync(this.rootDir)
      .filter((file) => file.endsWith(FILE_SUFFIX) && !EXCLUDED_FILES.has(file));

    const subjects = files.map((file) => {
      const filePath = path.join(this.rootDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const heading = parseHeading(content);
      const derivedSubject = file.replace(FILE_SUFFIX, "").replace(/_/g, " ");

      return {
        grade: heading?.grade ?? "Unknown",
        subject: heading?.subject ?? derivedSubject,
        filePath,
        content
      } satisfies CurriculumSubject;
    });

    subjects.sort((a, b) => a.grade.localeCompare(b.grade) || a.subject.localeCompare(b.subject));
    this.subjectsCache = subjects;
    return subjects;
  }

  loadTutorInstructions(): string {
    if (this.tutorInstructionsCache) return this.tutorInstructionsCache;
    const fullPath = path.join(this.rootDir, "AI_TUTOR_INSTRUCTIONS.md");
    this.tutorInstructionsCache = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
    return this.tutorInstructionsCache;
  }

  findByGradeAndSubject(grade: string, subject: string): CurriculumSubject | undefined {
    const targetGrade = normalize(grade);
    const targetSubject = normalize(subject);
    return this.loadSubjects().find(
      (item) => normalize(item.grade) === targetGrade && normalize(item.subject) === targetSubject
    );
  }

  findSubject(subject: string, grade?: string): CurriculumSubject | undefined {
    const targetSubject = normalize(subject);
    return this.loadSubjects().find((item) => {
      if (grade && normalize(item.grade) !== normalize(grade)) return false;
      return normalize(item.subject) === targetSubject;
    });
  }

  search(query: string, options?: { grade?: string; subject?: string; limit?: number }): CurriculumSubject[] {
    const q = normalize(query);
    const limit = Math.max(1, options?.limit ?? 20);

    return this.loadSubjects()
      .filter((item) => {
        if (options?.grade && normalize(item.grade) !== normalize(options.grade)) return false;
        if (options?.subject && normalize(item.subject) !== normalize(options.subject)) return false;
        return normalize(item.content).includes(q) || normalize(item.subject).includes(q);
      })
      .slice(0, limit);
  }

  grades(): string[] {
    return [...new Set(this.loadSubjects().map((item) => item.grade))].sort((a, b) => a.localeCompare(b));
  }
}
