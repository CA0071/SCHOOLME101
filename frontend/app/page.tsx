import Link from 'next/link';
import { GraduationCap, BookOpen, Users, Cpu, ChevronRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <GraduationCap className="w-8 h-8" />
          SCHOOLMATE101
        </div>
        <Link
          href="/auth/login"
          className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-700/50 border border-indigo-500 rounded-full px-4 py-1.5 text-sm mb-6">
          <Cpu className="w-4 h-4" />
          AI-Powered · CAPS Curriculum · Grade R – 12
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          Your Personal AI Tutor
          <br />
          <span className="text-indigo-300">for South African Learners</span>
        </h1>
        <p className="text-indigo-200 text-xl max-w-2xl mx-auto mb-10">
          SCHOOLMATE101 uses advanced AI and the CAPS curriculum to help students learn,
          teachers plan, and schools grow — from Grade R to Matric.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 border border-indigo-400 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700/40 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              icon: GraduationCap,
              title: 'For Students',
              desc: 'Ask any CAPS curriculum question and get instant AI explanations, generate practice quizzes, and track your learning progress.',
            },
            {
              icon: Users,
              title: 'For Teachers',
              desc: 'Generate CAPS-aligned lesson plans, create assessments and worksheets, and monitor learner performance effortlessly.',
            },
            {
              icon: BookOpen,
              title: 'For Admins',
              desc: 'Upload curriculum documents, manage the knowledge base, configure AI settings, and oversee the entire platform.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/10 backdrop-blur border border-indigo-600/40 rounded-2xl p-8 hover:bg-white/15 transition-colors"
            >
              <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-indigo-200" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-indigo-300 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-indigo-400 py-8 text-sm">
        © {new Date().getFullYear()} SCHOOLMATE101 · Built for South African Education (CAPS)
      </footer>
    </div>
  );
}
