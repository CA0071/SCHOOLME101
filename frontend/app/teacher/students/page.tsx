'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { curriculumApi } from '@/lib/api';
import { User } from '@/types';
import { Users, Loader2 } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    curriculumApi.listUsers({ role: 'student' })
      .then((r) => setStudents(r.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PortalGuard allowedRoles={['teacher', 'admin']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Overview</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-gray-300" /> No students registered yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name', 'Email', 'Grade', 'School', 'Joined'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.grade_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.school_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(s.created_at).toLocaleDateString()}</td>
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
