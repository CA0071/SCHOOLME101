'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi, curriculumApi } from '@/lib/api';
import { Grade, Subject, Topic } from '@/types';
import { BookOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonPlansPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({ gradeId: '', subjectId: '', topicId: '', duration: '60' });
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
    if (!form.gradeId || !form.subjectId) return toast.error('Please select a grade and subject');
    setLoading(true);
    setResult(null);
    try {
      const res = await tutorApi.generateLessonPlan({
        gradeId: form.gradeId ? parseInt(form.gradeId) : undefined,
        subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
        topicId: form.topicId ? parseInt(form.topicId) : undefined,
        durationMinutes: parseInt(form.duration),
      });
      setResult(res.data);
      toast.success('Lesson plan generated!');
    } catch { toast.error('Generation failed. Check AI server.'); }
    finally { setLoading(false); }
  };

  return (
    <PortalGuard allowedRoles={['teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Lesson Plans</h1>
        <p className="text-gray-500 text-sm">Generate CAPS-aligned lesson plans for any grade, subject, and topic.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Grade', key: 'gradeId', options: [{ id: '', name: 'Select Grade' }, ...grades] },
              { label: 'Subject', key: 'subjectId', options: [{ id: '', name: 'Select Subject' }, ...subjects] },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><BookOpen className="w-4 h-4" /> Generate Lesson Plan</>}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{result.title}</h2>
              <button onClick={() => window.print()} className="text-sm text-indigo-600 hover:underline">Print / Save PDF</button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result.content}
            </div>
          </div>
        )}
      </div>
    </PortalGuard>
  );
}
