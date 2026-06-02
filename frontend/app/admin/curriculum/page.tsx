'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { curriculumApi } from '@/lib/api';
import { Grade, Subject, Topic } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CurriculumPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selGrade, setSelGrade] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', term: '1', weekStart: '', weekEnd: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    curriculumApi.getGrades().then((r) => setGrades(r.data.grades)).catch(() => {});
    curriculumApi.getSubjects().then((r) => setSubjects(r.data.subjects)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selGrade && !selSubject) { setTopics([]); return; }
    setLoading(true);
    curriculumApi.getTopics({ gradeId: selGrade ? parseInt(selGrade) : undefined, subjectId: selSubject ? parseInt(selSubject) : undefined })
      .then((r) => setTopics(r.data.topics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selGrade, selSubject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selGrade || !selSubject) return toast.error('Select a grade and subject first');
    setSaving(true);
    try {
      await curriculumApi.createTopic({
        name: form.name, description: form.description,
        gradeId: parseInt(selGrade), subjectId: parseInt(selSubject),
        term: parseInt(form.term),
        weekStart: form.weekStart ? parseInt(form.weekStart) : undefined,
        weekEnd: form.weekEnd ? parseInt(form.weekEnd) : undefined,
      });
      toast.success('Topic created');
      setShowForm(false);
      setForm({ name: '', description: '', term: '1', weekStart: '', weekEnd: '' });
      curriculumApi.getTopics({ gradeId: parseInt(selGrade), subjectId: parseInt(selSubject) })
        .then((r) => setTopics(r.data.topics));
    } catch { toast.error('Failed to create topic'); }
    finally { setSaving(false); }
  };

  return (
    <PortalGuard allowedRoles={['admin', 'teacher']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Management</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Topic
          </button>
        </div>

        <div className="flex gap-4 flex-wrap">
          <select value={selGrade} onChange={(e) => setSelGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-40">
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={selSubject} onChange={(e) => setSelSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-40">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">New Topic</h2>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Topic Name', key: 'name', required: true },
                { label: 'Description', key: 'description', required: false },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="text" value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {[1, 2, 3, 4].map((t) => <option key={t} value={t}>Term {t}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week Start</label>
                  <input type="number" value={form.weekStart} onChange={(e) => setForm({ ...form, weekStart: e.target.value })} min={1} max={40}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week End</label>
                  <input type="number" value={form.weekEnd} onChange={(e) => setForm({ ...form, weekEnd: e.target.value })} min={1} max={40}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Topic
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
          ) : topics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Select a grade and/or subject to view topics.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name', 'Grade', 'Subject', 'Term', 'Weeks'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topics.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.grade_name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.subject_name}</td>
                    <td className="px-4 py-3 text-gray-600">Term {t.term}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.week_start ? `${t.week_start}–${t.week_end ?? t.week_start}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PortalGuard>
  );
}
