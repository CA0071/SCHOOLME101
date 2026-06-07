/**
 * TypeScript type definitions for SCHOOLME101 MCP Server
 */

/** A single subject entry loaded from a curriculum markdown file */
export interface SubjectEntry {
  /** Subject name (e.g. "Mathematics") */
  name: string;
  /** Grade string (e.g. "Grade 7") */
  grade: string;
  /** School phase (e.g. "Senior Phase") */
  phase: string;
  /** Full markdown content of the subject file */
  content: string;
  /** Source filename without directory */
  filename: string;
}

/** Result returned by search operations */
export interface SearchResult {
  /** Subject name */
  subject: string;
  /** Grade string */
  grade: string;
  /** School phase */
  phase: string;
  /** Filename */
  filename: string;
  /** Short excerpt around the matched content */
  excerpt: string;
  /** Relevance score (higher is better) */
  score: number;
}

/** Grade overview returned by get_grade_overview */
export interface GradeOverview {
  /** Grade string */
  grade: string;
  /** School phase */
  phase: string;
  /** List of subjects available for this grade */
  subjects: string[];
  /** Total subject count */
  totalSubjects: number;
}

/** Tool call arguments for get_subject_content */
export interface GetSubjectContentArgs {
  subject: string;
  grade?: string;
}

/** Tool call arguments for search_curriculum */
export interface SearchCurriculumArgs {
  query: string;
  grade?: string;
  maxResults?: number;
}

/** Tool call arguments for get_grade_overview */
export interface GetGradeOverviewArgs {
  grade: string;
}

/** Tool call arguments for get_subject_by_grade */
export interface GetSubjectByGradeArgs {
  subject: string;
  grade: string;
}

/** Tool call arguments for search_by_topic */
export interface SearchByTopicArgs {
  topic: string;
  grade?: string;
  subject?: string;
}
