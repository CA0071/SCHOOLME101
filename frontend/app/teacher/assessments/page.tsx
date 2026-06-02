'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi, curriculumApi } from '@/lib/api';
import { Grade, Subject, Topic, GeneratedTest } from '@/types';
import { ClipboardCheck, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssessmentsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mode, setMode] = useState<'test' | 'worksheet'>('test');
  const [form, setForm] = useState({ gradeId: '', subjectId: '', topicId: '', numQuestions: '10', totalMarks: '50', difficulty: 'moderate', worksheetType: 'practice' });
  const [result, setResult] = useState<GeneratedTest | { title: string; content: string } | null>(null);
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
      let res;
      if (mode === 'test') {
        res = await tutorApi.generateTest({
          gradeId: form.gradeId ? parseInt(form.gradeId) : undefined,
          subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
          topicId: form.topicId ? parseInt(form.topicId) : undefined,
          numQuestions: parseInt(form.numQuestions),
          totalMarks: parseInt(form.totalMarks),
          difficulty: form.difficulty,
        });
      } else {
        res = await tutorApi.generateWorksheet({
          gradeId: form.gradeId ? parseInt(form.gradeId) : undefined,
          subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
          topicId: form.topicId ? parseInt(form.topicId) : undefined,
          worksheetType: form.worksheetType,
          difficulty: form.difficulty,
        });
      }
      setResult(res.data);
      toast.success(`${mode === 'test' ? 'Test' : 'Worksheet'} generated!`);
    } catch { toast.error('Generation failed.'); }
    finally { setLoading(false); }
  };

  const isTest = (r: typeof result): r is GeneratedTest => !!(r && 'questions' in r);

  return (
    <PortalGuard allowedRoles={['teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Assessments</h1>

        <div className="flex gap-2">
          {(['test', 'worksheet'] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {m === 'test' ? <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> Test / Quiz</span> : <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Worksheet</span>}
            </button>
          ))}
        </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {mode === 'test' && <>
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
            </>}
            {mode === 'worksheet' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet Type</label>
                <select value={form.worksheetType} onChange={(e) => setForm({ ...form, worksheetType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="practice">Practice</option>
                  <option value="homework">Homework</option>
                  <option value="revision">Revision</option>
                  <option value="enrichment">Enrichment</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : `Generate ${mode === 'test' ? 'Test' : 'Worksheet'}`}
              </button>
            </div>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{'title' in result ? result.title : ''}</h2>
              <button onClick={() => window.print()} className="text-sm text-indigo-600 hover:underline">Print / Save PDF</button>
            </div>
            {isTest(result) ? (
              <div className="space-y-4">
                {result.instructions && <p className="text-gray-600 text-sm italic">{result.instructions}</p>}
                {result.questions?.map((q) => (
                  <div key={q.number} className="border-b border-gray-100 pb-4 last:border-0">
                    <p className="font-medium text-gray-900">{q.number}. {q.question} <span className="text-gray-400 font-normal text-sm">({q.marks} marks)</span></p>
                    {q.options && <ul className="mt-2 space-y-1">{q.options.map((o, i) => <li key={i} className="text-sm text-gray-600 ml-4">• {o}</li>)}</ul>}
                    {q.answer && <p className="text-sm text-green-700 mt-1 font-medium">Answer: {q.answer}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {'content' in result && result.content}
              </div>
            )}
          </div>
        )}
      </div>
    </PortalGuard>
  );
}
