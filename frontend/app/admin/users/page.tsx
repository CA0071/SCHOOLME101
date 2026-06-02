'use client';
import { useEffect, useState } from 'react';
import PortalGuard from '@/components/shared/PortalGuard';
import { curriculumApi } from '@/lib/api';
import { User } from '@/types';
import { Loader2, Users } from 'lucide-react';

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  teacher: 'bg-green-100 text-green-700',
  student: 'bg-blue-100 text-blue-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    curriculumApi.listUsers(roleFilter ? { role: roleFilter } : {})
      .then((r) => setUsers(r.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roleFilter]);

  return (
    <PortalGuard allowedRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
              <Users className="w-8 h-8 text-gray-300" /> No users found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Name', 'Email', 'Role', 'Grade', 'School', 'Last Login'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadge[u.role] || ''}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(u as unknown as { grade_name?: string }).grade_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.school_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
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
