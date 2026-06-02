'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { MessageSquare, BookOpen, ClipboardCheck, TrendingUp, Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recentQA, setRecentQA] = useState<{ question: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorApi.getHistory().then((r) => setRecentQA(r.data.sessions?.slice(0, 5) || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { href: '/student/ask', label: 'Ask AI Tutor', desc: 'Get instant answers from CAPS curriculum', icon: MessageSquare, color: 'bg-indigo-500' },
    { href: '/student/study', label: 'Study Material', desc: 'Generate worksheets & study guides', icon: BookOpen, color: 'bg-blue-500' },
    { href: '/student/tests', label: 'Practice Tests', desc: 'Test yourself with AI-generated quizzes', icon: ClipboardCheck, color: 'bg-green-500' },
    { href: '/student/progress', label: 'My Progress', desc: 'Track your learning journey', icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <PortalGuard allowedRoles={['student']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          {user?.grade_name && (
            <p className="text-gray-500 mt-1">{user.grade_name} · CAPS Curriculum</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{label}</h3>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Questions</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : recentQA.length === 0 ? (
            <p className="text-gray-500 text-sm">
              You haven&apos;t asked any questions yet.{' '}
              <Link href="/student/ask" className="text-indigo-600 hover:underline">Ask your first question →</Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {recentQA.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 line-clamp-1">{q.question}</span>
                  <span className="text-gray-400 text-xs ml-auto whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalGuard>
  );
}
