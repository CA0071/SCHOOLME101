import { CurriculumLoader } from "../../curriculum-loader.js";

function asResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: { result: data as Record<string, unknown> | unknown[] | string | number | boolean | null }
  };
}

export class Schoolme101ToolHandler {
  constructor(private readonly loader: CurriculumLoader) {}

  handle(toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case "get_subject_content": {
        const subject = String(args.subject ?? "").trim();
        const grade = args.grade ? String(args.grade) : undefined;
        const item = this.loader.findSubject(subject, grade);
        if (!item) return asResult({ found: false, message: "Subject not found." });
        return asResult({ found: true, grade: item.grade, subject: item.subject, content: item.content });
      }
      case "search_curriculum": {
        const query = String(args.query ?? "").trim();
        const limit = Number(args.limit ?? 20);
        const matches = this.loader.search(query, {
          grade: args.grade ? String(args.grade) : undefined,
          limit: Number.isFinite(limit) ? limit : 20
        });
        return asResult({ query, count: matches.length, matches });
      }
      case "get_grade_overview": {
        const grade = String(args.grade ?? "").trim();
        const subjects = this.loader
          .loadSubjects()
          .filter((item) => item.grade.toLowerCase() === grade.toLowerCase())
          .map((item) => item.subject);
        return asResult({ grade, count: subjects.length, subjects });
      }
      case "get_ai_tutor_instructions":
        return asResult({ content: this.loader.loadTutorInstructions() });
      case "list_all_subjects":
        return asResult({
          count: this.loader.loadSubjects().length,
          subjects: this.loader.loadSubjects().map((item) => ({ grade: item.grade, subject: item.subject }))
        });
      case "get_subject_by_grade": {
        const grade = String(args.grade ?? "").trim();
        const subject = String(args.subject ?? "").trim();
        const item = this.loader.findByGradeAndSubject(grade, subject);
        if (!item) return asResult({ found: false, message: "No exact grade + subject match." });
        return asResult({ found: true, grade: item.grade, subject: item.subject, content: item.content });
      }
      case "search_by_topic": {
        const topic = String(args.topic ?? "").trim();
        const limit = Number(args.limit ?? 20);
        const matches = this.loader.search(topic, {
          grade: args.grade ? String(args.grade) : undefined,
          subject: args.subject ? String(args.subject) : undefined,
          limit: Number.isFinite(limit) ? limit : 20
        });
        return asResult({ topic, count: matches.length, matches });
      }
      default:
        throw new Error(`Unsupported SCHOOLME101 tool: ${toolName}`);
    }
  }
}
