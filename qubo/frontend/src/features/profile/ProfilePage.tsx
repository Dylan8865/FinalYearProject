import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiChevronRight,
  FiEdit3,
  FiEye,
  FiHeadphones,
  FiKey,
  FiLock,
  FiLogOut,
  FiMoon,
  FiPlus,
  FiSettings,
  FiShield,
  FiTarget,
  FiUser,
} from 'react-icons/fi';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { useThemeStore } from '@/contexts/themeStore';
import { authService } from '@/lib/authService';
import { normalizeSpmTargetGrade } from '@/lib/spmGrades';
import { LearningStyle, Subject } from '@/types/auth';

const styleCards = [
  {
    key: 'visual' as LearningStyle,
    label: 'Visual',
    icon: FiEye,
    activeScore: 65,
    secondaryScore: 15,
    description: 'Prefer diagrams & mind maps',
    color: 'blue',
  },
  {
    key: 'auditory' as LearningStyle,
    label: 'Auditory',
    icon: FiHeadphones,
    activeScore: 65,
    secondaryScore: 20,
    description: 'Audio notes & lectures',
    color: 'emerald',
  },
  {
    key: 'kinesthetic' as LearningStyle,
    label: 'Kinesthetic',
    icon: FiEdit3,
    activeScore: 65,
    secondaryScore: 15,
    description: 'Learn by doing & practice',
    color: 'purple',
  },
];

const stylePalette = {
  blue: {
    border: 'border-blue-500',
    icon: 'bg-blue-50 text-blue-600',
    score: 'text-blue-600',
  },
  emerald: {
    border: 'border-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600',
    score: 'text-emerald-600',
  },
  purple: {
    border: 'border-purple-500',
    icon: 'bg-purple-50 text-purple-600',
    score: 'text-purple-600',
  },
};

const initialsFor = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [imageFailed, setImageFailed] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const darkMode = theme === 'dark';

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const loadSubjects = async () => {
      try {
        setSubjects(await authService.getStudentSubjects());
      } catch (error) {
        console.error('Failed to load profile subjects:', error);
      }
    };

    void loadSubjects();
  }, [user]);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profile_picture_url]);

  const daysUntilExam = useMemo(() => {
    if (!user?.target_exam_date) return '—';
    const examDate = new Date(`${user.target_exam_date.slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const difference = Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000);
    return difference >= 0 ? String(difference) : '0';
  }, [user?.target_exam_date]);

  if (!user) return <div className="min-h-screen bg-[#f6f8fb]" />;

  const selectedStyle = user.learning_style || 'visual';
  const displayName = user.full_name || user.username;
  const targetGrade = normalizeSpmTargetGrade(user.target_grade);
  const coreTargets = [
    targetGrade ? `SPM: ${targetGrade}` : 'SPM: Set target',
    user.form_level || 'Form level not set',
    user.school || 'School not set',
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />

      <div className="min-w-0">
        <main className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-8 lg:py-10">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-[38px]">Student Identity</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Manage your academic profile, learning preferences, and platform security in your scholastic sanctuary.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/profile/settings')}
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 sm:self-auto"
            >
              <FiSettings className="h-4 w-4" />
              Profile Settings
            </button>
          </section>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-24 flex-none">
                    {user.profile_picture_url && !imageFailed ? (
                      <img
                        src={user.profile_picture_url}
                        alt={`${displayName} profile`}
                        onError={() => setImageFailed(true)}
                        className="h-full w-full rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-black text-blue-700 ring-1 ring-blue-200">
                        {initialsFor(displayName) || <FiUser />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/profile/settings')}
                      aria-label="Edit profile picture"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">{displayName}</h2>
                      <FiCheck className="h-5 w-5 rounded-full bg-blue-600 p-1 text-white" />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {user.school || 'SPM Student'} • {user.form_level || 'Form level not set'}
                    </p>
                    <div className="mt-4 grid max-w-sm grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">SPM Target</p>
                        <p className="mt-1 text-xl font-black text-emerald-700">{targetGrade || '—'}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">Days to SPM</p>
                        <p className="mt-1 text-xl font-black text-blue-700">{daysUntilExam} <span className="text-xs">Days</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Core academic targets</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {coreTargets.map((target, index) => (
                      <span key={target} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Learning Style</h2>
                    <p className="mt-1 text-xs font-medium text-slate-400">AI-analyzed cognitive profile</p>
                  </div>
                  <FiBell className="h-5 w-5 text-purple-600" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {styleCards.map((style) => {
                    const isSelected = style.key === selectedStyle;
                    const palette = stylePalette[style.color as keyof typeof stylePalette];
                    const score = isSelected ? style.activeScore : style.secondaryScore;
                    return (
                      <article
                        key={style.key}
                        className={`rounded-2xl border-2 bg-white p-4 text-center ${isSelected ? palette.border : 'border-slate-100'}`}
                      >
                        <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
                          <style.icon className="h-4 w-4" />
                        </span>
                        <h3 className="mt-3 text-sm font-black text-slate-800">{style.label}</h3>
                        <p className={`mt-1 text-2xl font-black ${palette.score}`}>{score}%</p>
                        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">{style.description}</p>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-600 text-white">
                      <FiKey className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-blue-700">AI Recommendation</p>
                      <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                        Based on your {selectedStyle} learning preference, we’ve enabled dynamic infographics for Biology and Chemistry modules.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <FiSettings className="text-blue-600" /> Settings
                </h2>
                <div className="mt-4 space-y-2">
                  <div className="flex h-12 items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><FiMoon /> Dark Mode</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={darkMode}
                      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                      onClick={toggleTheme}
                      className={`relative h-6 w-11 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/profile/settings')}
                    className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-2"><FiShield /> Privacy &amp; Data</span><FiChevronRight />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile/settings')}
                    className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-2"><FiLock /> Account Security</span><FiChevronRight />
                  </button>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <FiTarget className="text-purple-600" /> Academic Preferences
                </h2>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Active subjects</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {subjects.slice(0, 5).map((subject) => (
                    <span key={subject.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700">
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />{subject.subject_name}
                    </span>
                  ))}
                  {subjects.length === 0 && (
                    <span className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-400">No subjects selected</span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/profile/settings')}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  >
                    <FiPlus /> Add More
                  </button>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Study reminders</p>
                <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Daily AI Flashcards</span><span className="font-black text-blue-600">8:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Nightly Progress Review</span><span className="font-black text-blue-600">10:30 PM</span>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <FiLogOut className="h-5 w-5" /> Log Out
              </button>
            </aside>
          </div>

          <section className="mt-28 flex flex-col gap-5 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black text-red-600">Account Management</h2>
              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                Once you delete your account, there is no going back. All your learning progress and AI data will be permanently erased.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled title="Account deactivation is not available yet" className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-500 disabled:opacity-70">
                Deactivate Account
              </button>
              <button type="button" disabled title="Data deletion is not available yet" className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-70">
                Delete Data
              </button>
            </div>
          </section>

          <footer className="pb-2 pt-10 text-center text-[10px] font-medium text-slate-400">
            © {new Date().getFullYear()} Qubo AI Learning Systems. Proudly serving SPM students in Malaysia.
          </footer>
        </main>
      </div>
    </div>
  );
}
