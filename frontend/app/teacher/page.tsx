'use client';
import PortalGuard from '@/components/shared/PortalGuard';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, Users, GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  const { user } = useAuth();

  const cards = [
    { href: '/teacher/lesson-plans', icon: BookOpen, label: 'Lesson Plans', desc: 'Generate CAPS-aligned lesson plans for any grade and subject', color: 'bg-blue-500' },
    { href: '/teacher/assessments', icon: ClipboardCheck, label: 'Assessments', desc: 'Create tests, worksheets, and assignments', color: 'bg-green-500' },
    { href: '/student/ask', icon: GraduationCap, label: 'AI Tutor', desc: 'Ask the AI tutor a curriculum question', color: 'bg-indigo-500' },
    { href: '/teacher/students', icon: Users, label: 'Student Progress', desc: 'Monitor learner performance and progress', color: 'bg-purple-500' },
  ];

  return (
    <PortalGuard allowedRoles={['teacher', 'admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.full_name}. What would you like to do today?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {cards.map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{label}</h3>
              <p className="text-gray-500 mt-1 text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </PortalGuard>
  );
}
