'use client';
import { useEffect, useState, useRef } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { documentsApi, curriculumApi } from '@/lib/api';
import { CurriculumDocument, Grade, Subject } from '@/types';
import { Upload, RefreshCw, Trash2, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcon = (s: string) => {
  if (s === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (s === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (s === 'processing') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<CurriculumDocument[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ gradeId: '', subjectId: '', title: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    documentsApi.list().then((r) => setDocs(r.data.documents)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    curriculumApi.getGrades().then((r) => setGrades(r.data.grades)).catch(() => {});
    curriculumApi.getSubjects().then((r) => setSubjects(r.data.subjects)).catch(() => {});
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Please select a PDF file');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (form.gradeId) fd.append('gradeId', form.gradeId);
      if (form.subjectId) fd.append('subjectId', form.subjectId);
      if (form.title) fd.append('title', form.title);
      await documentsApi.upload(fd);
      toast.success('Document uploaded and processing started');
      setForm({ gradeId: '', subjectId: '', title: '' });
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document and all its chunks?')) return;
    try {
      await documentsApi.delete(id);
      toast.success('Document deleted');
      setDocs((d) => d.filter((x) => x.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  const handleReprocess = async (id: string) => {
    try {
      await documentsApi.reprocess(id);
      toast.success('Reprocessing started');
      load();
    } catch { toast.error('Reprocessing failed'); }
  };

  return (
    <PortalGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Curriculum Documents</h1>

        {/* Upload form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" /> Upload PDF Document
          </h2>
          <form onSubmit={handleUpload} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Document title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Grades</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".pdf" required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700" />
            <button type="submit" disabled={uploading}
              className="sm:col-span-2 lg:col-span-4 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload & Process</>}
            </button>
          </form>
        </div>

        {/* Documents list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No documents yet. Upload a CAPS curriculum PDF to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Title', 'Grade', 'Subject', 'Status', 'Pages', 'Chunks', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{doc.title}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.grade_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.subject_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 capitalize">{statusIcon(doc.status)} {doc.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{doc.total_pages ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{doc.total_chunks ?? '—'}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <button onClick={() => handleReprocess(doc.id)} title="Reprocess" className="text-blue-500 hover:text-blue-700"><RefreshCw className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(doc.id)} title="Delete" className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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
