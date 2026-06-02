export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  grade_id?: number;
  grade_name?: string;
  school_name?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Grade {
  id: number;
  name: string;
  level: number;
  description: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface Topic {
  id: number;
  name: string;
  description: string;
  subject_id: number;
  grade_id: number;
  term: number;
  week_start?: number;
  week_end?: number;
  subject_name?: string;
  grade_name?: string;
}

export interface CurriculumDocument {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  document_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_pages?: number;
  total_chunks?: number;
  summary?: string;
  grade_name?: string;
  subject_name?: string;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: Array<{
    documentTitle: string;
    gradeName: string;
    subjectName: string;
    similarity: number;
  }>;
  grade_name?: string;
  subject_name?: string;
  feedback_rating?: number;
  created_at: string;
}

export interface GeneratedTest {
  id: string;
  title: string;
  instructions?: string;
  total_marks: number;
  questions: Array<{
    number: number;
    type: string;
    question: string;
    marks: number;
    options?: string[];
    answer?: string;
    explanation?: string;
  }>;
}

export interface StudentProgress {
  subject_name: string;
  topic_name: string;
  grade_name: string;
  mastery_level: number;
  questions_attempted: number;
  questions_correct: number;
  time_spent_minutes: number;
  last_activity?: string;
}

export interface DashboardStats {
  users: { admin: number; teacher: number; student: number };
  documents: { pending: number; processing: number; completed: number; failed: number };
  totalChunks: number;
  totalQuestions: number;
}
