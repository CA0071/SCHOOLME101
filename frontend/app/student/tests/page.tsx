'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi, curriculumApi } from '@/lib/api';
import { Grade, Subject, Topic, GeneratedTest } from '@/types';
import { ClipboardCheck, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({ gradeId: '', subjectId: '', topicId: '', numQuestions: '10', totalMarks: '50', difficulty: 'moderate' });
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total_marks: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    curriculumApi.getGrades().then((r) => setGrades(r.data.grades)).catch(() => {});
    curriculumApi.getSubjects().then((r) => setSubjects(r.data.subjects)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.gradeId || form.subjectId) {
      curriculumApi.getTopics({ gradeId: form.gradeId ? parseInt(form.gradeId) : undefined, subjectId: form.subjectId ? parseInt(form.subjectId) : undefined })
        .then((r) => setTopics(r.data.topics)).catch(() => {});
    }
  }, [form.gradeId, form.subjectId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTest(null);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    try {
      const res = await tutorApi.generateTest({
        gradeId: form.gradeId ? parseInt(form.gradeId) : undefined,
        subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
        topicId: form.topicId ? parseInt(form.topicId) : undefined,
        numQuestions: parseInt(form.numQuestions),
        totalMarks: parseInt(form.totalMarks),
        difficulty: form.difficulty,
      });
      setTest(res.data);
    } catch { toast.error('Test generation failed.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const answersList = test.questions.map((q) => ({
        questionNumber: q.number,
        selectedAnswer: answers[q.number] || '',
      }));
      const res = await tutorApi.submitTest({
        testId: test.id,
        answers: answersList,
        timeTakenMinutes: Math.floor((Date.now() - startTime) / 60000),
      });
      setResult(res.data.attempt);
      setSubmitted(true);
      toast.success('Test submitted!');
    } catch { toast.error('Submission failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <PortalGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice Tests & Quizzes</h1>

        {!test && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Grade', key: 'gradeId', options: [{ id: '', name: 'Any Grade' }, ...grades] },
                { label: 'Subject', key: 'subjectId', options: [{ id: '', name: 'Any Subject' }, ...subjects] },
                { label: 'Topic', key: 'topicId', options: [{ id: '', name: 'Any Topic' }, ...topics] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <select value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Questions</label>
                <input type="number" value={form.numQuestions} min={1} max={50}
                  onChange={(e) => setForm({ ...form, numQuestions: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input type="number" value={form.totalMarks} min={5} max={300}
                  onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><ClipboardCheck className="w-4 h-4" /> Generate Test</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {result && (
          <div className={`rounded-xl p-6 text-white ${result.percentage >= 50 ? 'bg-green-600' : 'bg-red-600'}`}>
            <h2 className="text-xl font-bold mb-1">
              {result.percentage >= 80 ? '🎉 Excellent!' : result.percentage >= 50 ? '👍 Good effort!' : '📚 Keep practising!'}
            </h2>
            <p className="text-lg">{result.score}/{result.total_marks} marks · {result.percentage.toFixed(1)}%</p>
          </div>
        )}

        {test && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
              {!submitted && (
                <button onClick={() => setTest(null)} className="text-sm text-gray-500 hover:text-gray-700">← New Test</button>
              )}
            </div>
            {test.instructions && <p className="text-gray-600 text-sm">{test.instructions}</p>}

            {test.questions.map((q) => (
              <div key={q.number} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-medium text-gray-900">{q.number}. {q.question}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-4 whitespace-nowrap">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                </div>
                {q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isSelected = answers[q.number] === opt;
                      const isCorrect = submitted && opt.trim().toLowerCase() === q.answer?.trim().toLowerCase();
                      const isWrong = submitted && isSelected && !isCorrect;
                      return (
                        <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                          ${isCorrect && submitted ? 'bg-green-50 text-green-800' : ''}
                          ${isWrong ? 'bg-red-50 text-red-800' : ''}
                          ${!submitted ? 'hover:bg-indigo-50' : ''}
                        `}>
                          <input type="radio" name={`q${q.number}`} value={opt} checked={isSelected}
                            onChange={() => !submitted && setAnswers({ ...answers, [q.number]: opt })}
                            disabled={submitted} className="text-indigo-600" />
                          <span className="text-sm">{opt}</span>
                          {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                          {isWrong && <XCircle className="w-4 h-4 text-red-600 ml-auto" />}
                        </label>
                      );
                    })}
                  </div>
                )}
                {!q.options && (
                  <textarea value={answers[q.number] || ''} onChange={(e) => !submitted && setAnswers({ ...answers, [q.number]: e.target.value })}
                    disabled={submitted} rows={3} placeholder="Write your answer here…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2" />
                )}
                {submitted && q.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><CheckCircle className="w-4 h-4" /> Submit Test</>}
              </button>
            )}
          </div>
        )}
      </div>
    </PortalGuard>
  );
}
