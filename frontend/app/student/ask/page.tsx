'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi, curriculumApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Grade, Subject } from '@/types';
import { Send, Loader2, Bot, User2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; sources?: { documentTitle: string; gradeName: string; similarity: number }[] }

export default function AskPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selGrade, setSelGrade] = useState(user?.grade_id?.toString() || '');
  const [selSubject, setSelSubject] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    curriculumApi.getGrades().then((r) => setGrades(r.data.grades)).catch(() => {});
    curriculumApi.getSubjects().then((r) => setSubjects(r.data.subjects)).catch(() => {});
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const res = await tutorApi.askQuestion({
        question,
        gradeId: selGrade ? parseInt(selGrade) : undefined,
        subjectId: selSubject ? parseInt(selSubject) : undefined,
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.answer, sources: res.data.sources }]);
    } catch { toast.error('Failed to get answer. Is the AI server running?'); }
    finally { setLoading(false); }
  };

  return (
    <PortalGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Ask AI Tutor</h1>
        <p className="text-gray-500 text-sm">Ask any question about your CAPS curriculum. The AI tutor will answer based on your uploaded curriculum documents.</p>

        <div className="flex gap-3 flex-wrap">
          <select value={selGrade} onChange={(e) => setSelGrade(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-36">
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={selSubject} onChange={(e) => setSelSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-40">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Chat window */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '60vh' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Bot className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
                <p className="font-medium text-gray-500">SCHOOLMATE AI Tutor</p>
                <p className="text-sm mt-1">Ask me anything about the CAPS curriculum!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-indigo-600" /></div>}
                <div className={`max-w-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-3 text-sm leading-relaxed`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Sources:</p>
                      {msg.sources.slice(0, 3).map((s, j) => (
                        <p key={j} className="text-xs text-gray-500">{s.documentTitle} · {s.gradeName} · {(s.similarity * 100).toFixed(0)}% relevant</p>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"><User2 className="w-4 h-4 text-white" /></div>}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center"><Bot className="w-4 h-4 text-indigo-600" /></div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSend} className="border-t border-gray-100 p-4 flex gap-3">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the CAPS curriculum…"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </PortalGuard>
  );
}
