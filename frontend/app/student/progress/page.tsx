'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { tutorApi } from '@/lib/api';
import { StudentProgress } from '@/types';
import { TrendingUp, Loader2, Award } from 'lucide-react';

interface TestAttempt { id: string; score: number; total_marks: number; percentage: number; completed_at: string; test_title: string; }

export default function ProgressPage() {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [tests, setTests] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorApi.getProgress().then((r) => {
      setProgress(r.data.progress || []);
      setTests(r.data.recentTests || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const avg = tests.length > 0 ? tests.reduce((a, t) => a + t.percentage, 0) / tests.length : 0;

  return (
    <PortalGuard allowedRoles={['student', 'teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Learning Progress</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
        ) : (
          <>
            {tests.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-3xl font-bold text-indigo-600">{tests.length}</div>
                  <div className="text-sm text-gray-500 mt-1">Tests Completed</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-3xl font-bold text-green-600">{avg.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500 mt-1">Average Score</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-3xl font-bold text-purple-600">
                    {tests.filter((t) => t.percentage >= 80).length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Distinctions (≥80%)</div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" /> Recent Test Results
              </h2>
              {tests.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests completed yet. Take a practice test to track your progress!</p>
              ) : (
                <div className="space-y-3">
                  {tests.map((t) => (
                    <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm
                        ${t.percentage >= 80 ? 'bg-green-500' : t.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {t.percentage.toFixed(0)}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{t.test_title}</p>
                        <p className="text-xs text-gray-500">{t.score}/{t.total_marks} marks · {new Date(t.completed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {progress.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" /> Topic Mastery
                </h2>
                <div className="space-y-4">
                  {progress.map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{p.subject_name} · {p.topic_name}</span>
                        <span className="text-gray-500">{p.mastery_level.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${p.mastery_level >= 80 ? 'bg-green-500' : p.mastery_level >= 50 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                          style={{ width: `${p.mastery_level}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PortalGuard>
  );
}
