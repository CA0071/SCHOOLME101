'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi, curriculumApi } from '@/lib/api';
import { Grade, Subject, Topic } from '@/types';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({ gradeId: '', subjectId: '', topicId: '', type: 'practice', difficulty: 'moderate' });
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);

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
    setResult(null);
    try {
      const res = await tutorApi.generateWorksheet({
        gradeId: form.gradeId ? parseInt(form.gradeId) : undefined,
        subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
        topicId: form.topicId ? parseInt(form.topicId) : undefined,
        worksheetType: form.type,
        difficulty: form.difficulty,
      });
      setResult(res.data);
      toast.success('Worksheet generated!');
    } catch { toast.error('Generation failed. Check AI server.'); }
    finally { setLoading(false); }
  };

  return (
    <PortalGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Study Material</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Grade', key: 'gradeId', options: [{ id: '', name: 'All Grades' }, ...grades] },
              { label: 'Subject', key: 'subjectId', options: [{ id: '', name: 'All Subjects' }, ...subjects] },
              { label: 'Topic', key: 'topicId', options: [{ id: '', name: 'All Topics' }, ...topics] },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="practice">Practice Worksheet</option>
                <option value="homework">Homework</option>
                <option value="revision">Revision</option>
                <option value="enrichment">Enrichment</option>
              </select>
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
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><FileText className="w-4 h-4" /> Generate Worksheet</>}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{result.title}</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.content}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => window.print()} className="text-sm text-indigo-600 hover:underline">Print / Save as PDF</button>
            </div>
          </div>
        )}
      </div>
    </PortalGuard>
  );
}
