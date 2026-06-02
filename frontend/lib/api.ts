import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Handle 401 – redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role?: string;
    gradeId?: number;
    schoolName?: string;
  }) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { fullName?: string; gradeId?: number; schoolName?: string }) =>
    api.put('/auth/profile', data),
};

// ─── Curriculum ─────────────────────────────────────────────────────────────
export const curriculumApi = {
  getGrades: () => api.get('/curriculum/grades'),
  getSubjects: (gradeId?: number) =>
    api.get('/curriculum/subjects', { params: gradeId ? { gradeId } : {} }),
  getTopics: (params: { gradeId?: number; subjectId?: number; term?: number }) =>
    api.get('/curriculum/topics', { params }),
  getSubtopics: (topicId: number) => api.get(`/curriculum/topics/${topicId}/subtopics`),
  getLearningOutcomes: (topicId: number) =>
    api.get(`/curriculum/topics/${topicId}/outcomes`),
  createTopic: (data: {
    name: string;
    subjectId: number;
    gradeId: number;
    term: number;
    description?: string;
    weekStart?: number;
    weekEnd?: number;
  }) => api.post('/curriculum/topics', data),
  getStats: () => api.get('/curriculum/stats'),
  listUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get('/curriculum/users', { params }),
};

// ─── Documents ──────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (params?: { gradeId?: number; subjectId?: number; status?: string; page?: number }) =>
    api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  upload: (formData: FormData) =>
    api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min for large PDFs
    }),
  delete: (id: string) => api.delete(`/documents/${id}`),
  reprocess: (id: string) => api.post(`/documents/${id}/reprocess`),
};

// ─── AI Tutor ───────────────────────────────────────────────────────────────
export const tutorApi = {
  askQuestion: (data: {
    question: string;
    gradeId?: number;
    subjectId?: number;
    topicId?: number;
  }) => api.post('/tutor/ask', data),
  generateTest: (data: {
    gradeId?: number;
    subjectId?: number;
    topicId?: number;
    numQuestions?: number;
    totalMarks?: number;
    difficulty?: string;
  }) => api.post('/tutor/generate-test', data),
  generateWorksheet: (data: {
    gradeId?: number;
    subjectId?: number;
    topicId?: number;
    worksheetType?: string;
    difficulty?: string;
  }) => api.post('/tutor/generate-worksheet', data),
  generateLessonPlan: (data: {
    gradeId?: number;
    subjectId?: number;
    topicId?: number;
    durationMinutes?: number;
  }) => api.post('/tutor/generate-lesson-plan', data),
  getHistory: (userId?: string) =>
    api.get(userId ? `/tutor/history/${userId}` : '/tutor/history'),
  submitTest: (data: { testId: string; answers: unknown[]; timeTakenMinutes?: number }) =>
    api.post('/tutor/submit-test', data),
  getProgress: (userId?: string) =>
    api.get(userId ? `/tutor/progress/${userId}` : '/tutor/progress'),
};

export default api;
