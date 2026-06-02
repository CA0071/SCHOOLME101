'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { GraduationCap, BookOpen, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: Settings },
    { href: '/admin/documents', label: 'Documents', icon: BookOpen },
    { href: '/admin/curriculum', label: 'Curriculum', icon: GraduationCap },
    { href: '/admin/users', label: 'Users', icon: Users },
  ],
  teacher: [
    { href: '/teacher', label: 'Dashboard', icon: Settings },
    { href: '/teacher/lesson-plans', label: 'Lesson Plans', icon: BookOpen },
    { href: '/teacher/assessments', label: 'Assessments', icon: GraduationCap },
    { href: '/teacher/students', label: 'Students', icon: Users },
  ],
  student: [
    { href: '/student', label: 'Dashboard', icon: Settings },
    { href: '/student/ask', label: 'Ask AI Tutor', icon: GraduationCap },
    { href: '/student/study', label: 'Study Material', icon: BookOpen },
    { href: '/student/tests', label: 'Tests & Quizzes', icon: Users },
    { href: '/student/progress', label: 'My Progress', icon: Settings },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <nav className="bg-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${user.role}`} className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="w-7 h-7" />
            SCHOOLMATE101
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm hover:bg-indigo-600 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-indigo-200">{user.full_name}</span>
            <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-indigo-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-indigo-800 px-4 pb-4 space-y-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-indigo-700"
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-indigo-600 pt-3 mt-2 flex items-center justify-between">
            <span className="text-sm text-indigo-300">{user.full_name}</span>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-indigo-300">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
