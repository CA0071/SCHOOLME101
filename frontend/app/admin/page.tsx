'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { curriculumApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { BookOpen, Users, Database, MessageSquare, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    curriculumApi.getStats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Students', value: stats.users?.student ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Teachers', value: stats.users?.teacher ?? 0, icon: Users, color: 'bg-green-500' },
    { label: 'Documents', value: Object.values(stats.documents || {}).reduce((a, b) => a + b, 0), icon: BookOpen, color: 'bg-indigo-500' },
    { label: 'Knowledge Chunks', value: stats.totalChunks ?? 0, icon: Database, color: 'bg-purple-500' },
    { label: 'AI Questions Asked', value: stats.totalQuestions ?? 0, icon: MessageSquare, color: 'bg-orange-500' },
  ] : [];

  return (
    <PortalGuard allowedRoles={['admin']}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading stats…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {cards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {stats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Processing Status</h2>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(stats.documents || {}).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-500 capitalize">{status}</div>
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
