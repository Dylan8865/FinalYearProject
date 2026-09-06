import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { Subject } from '@/types/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBarChart2, FiTarget, FiCheck, FiUploadCloud, FiUsers } from 'react-icons/fi';
import AppSidebar from '@/components/layout/AppSidebar';
import { EducatorDashboard } from '@/types/analytics';
import { normalizeSpmTargetGrade } from '@/lib/spmGrades';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentSubjects, setStudentSubjects] = useState<Subject[]>([]);
  const [subjectsError, setSubjectsError] = useState('');
  const [educatorDashboard, setEducatorDashboard] = useState<EducatorDashboard | null>(null);
  const [showLoginSuccess, setShowLoginSuccess] = useState(location.state?.loginSuccess || false);

  useEffect(() => {
    if (showLoginSuccess) {
      const timer = setTimeout(() => setShowLoginSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showLoginSuccess]);

  useEffect(() => {
    const loadStudentSubjects = async () => {
      if (!user || user.role !== 'student') {
        return;
      }

      try {
        const subjects = await authService.getStudentSubjects();
        setStudentSubjects(subjects);
      } catch (error) {
        setSubjectsError('Subjects could not be loaded from the database.');
      }
    };

    loadStudentSubjects();
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'educator') return;
    Promise.all([
      authService.getEducatorDashboard(),
    ]).then(([dashboardData]) => {
      setEducatorDashboard(dashboardData);
    }).catch(() => {
      setEducatorDashboard(null);
    });
  }, [user]);

  const profileCompletion = useMemo(() => {
    if (!user) {
      return 0;
    }

    const fields = [
      user.username,
      user.full_name,
      user.profile_picture_url,
      user.school,
      user.form_level,
      normalizeSpmTargetGrade(user.target_grade),
      user.target_exam_date,
      user.learning_style,
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  const daysUntilExam = useMemo(() => {
    if (!user?.target_exam_date) {
      return 'Not set';
    }

    const [year, month, day] = user.target_exam_date.slice(0, 10).split('-').map(Number);
    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const examUtc = Date.UTC(year, month - 1, day);
    const remainingDays = Math.round((examUtc - todayUtc) / 86_400_000);

    if (remainingDays < 0) {
      return 'Date passed';
    }
    if (remainingDays === 0) {
      return 'Exam day';
    }
    return `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
  }, [user?.target_exam_date]);

  if (!user) {
    return <div className="min-h-screen bg-[#f4f7fb]" />;
  }

  const isStudent = user.role === 'student';
  const firstName = user.full_name?.split(' ')[0] || user.full_name;
  const targetGrade = normalizeSpmTargetGrade(user.target_grade);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_1fr]">
      <AppSidebar />

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
              {isStudent ? 'Student dashboard' : 'Educator dashboard'}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              Good morning, {firstName}.
            </h1>
          </div>

        </header>

        <main className="space-y-6 px-5 py-6 md:px-8 md:py-8">
          {showLoginSuccess && (
            <div className="flex animate-in fade-in slide-in-from-top-4 duration-500 items-center justify-between rounded-2xl bg-emerald-50 px-6 py-4 border border-emerald-200 text-emerald-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FiCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Login successful</p>
                  <p className="text-sm font-medium text-emerald-700 opacity-90">Welcome back to your dashboard.</p>
                </div>
              </div>
            </div>
          )}
          
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="rounded-[32px] bg-gradient-to-br from-[#155dfc] via-[#2b7cff] to-[#1446d1] p-6 text-white shadow-[0_20px_60px_rgba(29,78,216,0.28)] md:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                <FiTarget className="h-3.5 w-3.5" />
                Database-backed overview
              </div>
              <h2 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-4xl">
                {isStudent
                  ? 'Your learning profile is ready for study tracking.'
                  : 'Review your class and student access from one place.'}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 md:text-base">
                {isStudent
                  ? 'This dashboard uses your saved profile, target exam date, and selected subjects from the database.'
                  : 'Use the profile and access data already stored in the system to manage your cohort.'}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg shadow-blue-950/10 transition hover:-translate-y-0.5"
                >
                  Open profile
                </button>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(isStudent ? [
                  { label: 'Profile completion', value: `${profileCompletion}%` },
                  { label: 'Learning style', value: user.learning_style || 'Not set' },
                  { label: 'Target exam date', value: user.target_exam_date ? user.target_exam_date.slice(0, 10) : 'Not set' },
                  { label: 'Days remaining', value: daysUntilExam },
                ] : [
                  { label: 'Linked students', value: educatorDashboard?.summary.linked_students ?? '—' },
                  { label: 'Students at risk', value: educatorDashboard?.summary.students_at_risk ?? '—' },
                  { label: 'Completed quizzes', value: educatorDashboard?.summary.completed_quizzes ?? '—' },
                  { label: 'Class study time', value: educatorDashboard ? `${educatorDashboard.summary.total_study_minutes}m` : '—' },
                ]).map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{item.label}</p>
                    <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Account summary</p>
              <h3 className="mt-2 text-xl font-extrabold text-slate-950">Stored profile data</h3>

              <div className="mt-5 space-y-3">
                {(isStudent ? [
                  ['Username', user.username],
                  ['Full name', user.full_name],
                  ['School', user.school || 'Not set'],
                  ['Form level', user.form_level || 'Not set'],
                  ['Target grade', targetGrade || 'Not set'],
                ] : [
                  ['Username', user.username],
                  ['Full name', user.full_name],
                  ['Linked students', educatorDashboard?.summary.linked_students ?? '—'],
                  ['Class status', educatorDashboard?.summary.linked_students ? 'Active' : 'Ready to set up'],
                ]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-semibold text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/profile/settings')}
                className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Edit profile
              </button>
            </aside>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Subjects</p>
                  <h3 className="mt-2 text-xl font-extrabold text-slate-950">{isStudent ? 'Selected SPM subjects' : 'Educator workspace'}</h3>
                </div>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" onClick={() => navigate(isStudent ? '/profile/settings' : '/educator/analytics')}>
                  {isStudent ? 'Manage' : 'Open analytics'}
                </button>
              </div>

              <div className="mt-5">
                {isStudent ? (
                  <>
                    {subjectsError && (
                      <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                        {subjectsError}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {studentSubjects.length > 0 ? (
                        studentSubjects.map((subject) => (
                          <div key={subject.id} className="rounded-3xl border border-slate-100 p-4">
                            <p className="text-sm font-bold text-slate-900">{subject.subject_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{subject.category || 'Subject'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2 xl:col-span-3">
                          No subjects have been selected yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: FiUsers, label: 'Manage students', path: '/educator/analytics' },
                      { icon: FiBarChart2, label: 'View class analytics', path: '/educator/analytics' },
                      { icon: FiUploadCloud, label: 'Upload content', path: '/educator/upload' },
                    ].map((action) => (
                      <button key={action.label} type="button" onClick={() => navigate(action.path)} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                        <action.icon className="h-5 w-5 text-blue-600" />{action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Status</p>
                <h3 className="mt-2 text-xl font-extrabold text-slate-950">What the system knows</h3>
                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Role-based access</span>
                    <span className="font-bold capitalize text-slate-900">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Account created</span>
                    <span className="font-bold text-slate-900">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span>Profile picture</span>
                    <span className="font-bold text-slate-900">{user.profile_picture_url ? 'Set' : 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
